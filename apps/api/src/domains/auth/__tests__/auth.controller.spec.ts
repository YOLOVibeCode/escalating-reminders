import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { CreateUserDto, LoginDto, TokenPair, User } from '@er/types';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'Password123',
        displayName: 'Test User',
      };

      const mockUser: User = {
        id: 'user_123',
        email: createUserDto.email,
        passwordHash: '$2b$10$hashed',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTokens: TokenPair = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      };

      mockAuthService.register.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const result = await controller.register(createUserDto);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('user');
      expect(result.data).toHaveProperty('tokens');
      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const mockUser: User = {
        id: 'user_123',
        email: loginDto.email,
        passwordHash: '$2b$10$hashed',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTokens: TokenPair = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      };

      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const result = await controller.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('user');
      expect(result.data).toHaveProperty('tokens');
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const mockTokens: TokenPair = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
      };

      mockAuthService.refreshToken.mockResolvedValue(mockTokens);

      const result = await controller.refreshToken('refresh-token');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTokens);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('refresh-token');
    });
  });

  describe('logout', () => {
    it('should logout a user', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout('refresh-token');

      expect(result.success).toBe(true);
      expect(mockAuthService.logout).toHaveBeenCalledWith('refresh-token');
    });
  });
});

