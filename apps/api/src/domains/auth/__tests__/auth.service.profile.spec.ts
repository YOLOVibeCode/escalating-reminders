/**
 * Tests for user profile update functionality.
 * Following TDD - tests written before implementation.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';
import { NotFoundError } from '../../../common/exceptions';
import type { User, UserProfile } from '@er/types';

describe('AuthService - Profile Update', () => {
  let service: AuthService;
  let repository: AuthRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
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
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
              if (key === 'JWT_EXPIRES_IN') return '15m';
              if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
              return null;
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    repository = module.get<AuthRepository>(AuthRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    const userId = 'user-123';
    const mockUser: User = {
      id: userId,
      email: 'test@example.com',
      passwordHash: 'hashed',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockProfile: UserProfile = {
      id: 'profile-123',
      userId,
      displayName: 'John Doe',
      timezone: 'America/New_York',
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update user profile successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        profile: mockProfile,
      });
      mockPrismaService.userProfile.upsert.mockResolvedValue({
        ...mockProfile,
        displayName: 'Jane Doe',
        timezone: 'America/Los_Angeles',
      });

      const result = await service.updateProfile(userId, {
        displayName: 'Jane Doe',
        timezone: 'America/Los_Angeles',
      });

      expect(result.displayName).toBe('Jane Doe');
      expect(result.timezone).toBe('America/Los_Angeles');
      expect(mockPrismaService.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: {
          displayName: 'Jane Doe',
          timezone: 'America/Los_Angeles',
        },
        create: {
          userId,
          displayName: 'Jane Doe',
          timezone: 'America/Los_Angeles',
          preferences: {},
        },
      });
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile(userId, { displayName: 'New Name' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should update only provided fields', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        profile: mockProfile,
      });
      mockPrismaService.userProfile.upsert.mockResolvedValue({
        ...mockProfile,
        displayName: 'New Name',
      });

      const result = await service.updateProfile(userId, {
        displayName: 'New Name',
      });

      expect(result.displayName).toBe('New Name');
      expect(result.timezone).toBe(mockProfile.timezone); // Unchanged
      expect(mockPrismaService.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: {
          displayName: 'New Name',
        },
        create: {
          userId,
          displayName: 'New Name',
          timezone: 'America/New_York',
          preferences: {},
        },
      });
    });
  });
});



