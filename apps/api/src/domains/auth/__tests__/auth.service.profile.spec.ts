/**
 * Tests for user profile update functionality.
 * Following TDD - tests written before implementation.
 */

import type { User, UserProfile } from '@er/types';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { NotFoundError } from '../../../common/exceptions';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { SmsConsentRepository } from '../../sms/sms-consent.repository';
import { AuthRepository } from '../auth.repository';
import { AuthService } from '../auth.service';


describe('AuthService - Profile Update', () => {
  let service: AuthService;

  const mockSmsConsentRepository = {
    recordOptIn: jest.fn(),
  };

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
        {
          provide: SmsConsentRepository,
          useValue: mockSmsConsentRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
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
      phone: null,
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
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
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
      expect(result.phone).toBeNull();
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
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
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



