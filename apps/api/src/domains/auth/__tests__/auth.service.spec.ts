import { ERROR_CODES } from '@er/constants';
import type { CreateUserDto, LoginDto } from '@er/types';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { SmsConsentRepository } from '../../sms/sms-consent.repository';
import { AuthRepository } from '../auth.repository';
import { AuthService } from '../auth.service';

jest.mock('bcrypt', () => {
  const actual = jest.requireActual<typeof import('bcrypt')>('bcrypt');
  return {
    ...actual,
    compare: jest.fn(),
  };
});

const mockBcryptCompare = jest.mocked(bcrypt.compare);

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
      if (key === 'JWT_EXPIRES_IN') return '15m';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AuthRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SmsConsentRepository,
          useValue: { recordOptIn: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    mockBcryptCompare.mockReset();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'Password123',
      displayName: 'Test User',
      timezone: 'America/New_York',
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user_123',
        email: createUserDto.email,
        passwordHash: '$2b$10$hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUserWithSubscription = {
        ...mockUser,
        subscription: { tier: 'FREE' },
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // findByEmail check
        .mockResolvedValueOnce(mockUserWithSubscription); // findByIdWithSubscription
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.register(createUserDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user_123',
        email: createUserDto.email,
      });

      await expect(service.register(createUserDto)).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.RESOURCE_ALREADY_EXISTS,
        },
      });
    });

    it('should hash password before storing', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'user_123',
          email: createUserDto.email,
          subscription: { tier: 'FREE' },
        });
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user_123',
        email: createUserDto.email,
      });
      mockJwtService.sign.mockReturnValue('mock-token');

      await service.register(createUserDto);

      const createCalls = mockPrismaService.user.create.mock.calls as [
        { data: { passwordHash: string } },
      ][];
      const createCall = createCalls[0]?.[0];
      expect(createCall.data.passwordHash).not.toBe(createUserDto.password);
      expect(createCall.data.passwordHash).toHaveLength(60); // bcrypt hash length
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123',
    };

    const mockUser = {
      id: 'user_123',
      email: loginDto.email,
      passwordHash: '$2b$10$hashedpassword', // bcrypt hash
    };

    const mockUserWithSubscription = {
      ...mockUser,
      subscription: { tier: 'FREE' },
    };

    it('should login successfully with correct credentials', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // findByEmail
        .mockResolvedValueOnce(mockUserWithSubscription); // findByIdWithSubscription
      mockJwtService.sign.mockReturnValue('mock-token');

      // Mock bcrypt compare
      mockBcryptCompare.mockResolvedValue(true as never);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
    });

    it('should throw error if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        },
      });
    });

    it('should throw error if password is incorrect', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        },
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const mockUserWithSubscription = {
        id: 'user_123',
        email: 'test@example.com',
        subscription: { tier: 'FREE' },
      };

      mockJwtService.verify.mockReturnValue({
        sub: 'user_123',
        sessionId: 'session_123',
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithSubscription);
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockJwtService.verify).toHaveBeenCalled();
    });

    it('should throw error if refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.AUTH_TOKEN_INVALID,
        },
      });
    });

    it('should throw error if user not found', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user_123',
        sessionId: 'session_123',
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('valid-refresh-token')).rejects.toMatchObject({
        response: {
          code: ERROR_CODES.AUTH_TOKEN_INVALID,
        },
      });
    });
  });

  describe('logout', () => {
    it('should complete logout without error', async () => {
      await expect(service.logout('refresh-token')).resolves.not.toThrow();
    });
  });
});

