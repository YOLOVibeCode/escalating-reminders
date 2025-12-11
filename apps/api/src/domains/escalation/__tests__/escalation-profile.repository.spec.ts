import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { EscalationProfileRepository } from '../escalation-profile.repository';
import type { EscalationProfile } from '@er/types';

describe('EscalationProfileRepository', () => {
  let repository: EscalationProfileRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    escalationProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationProfileRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<EscalationProfileRepository>(
      EscalationProfileRepository,
    );
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return user profiles and presets', async () => {
      const mockProfiles: EscalationProfile[] = [
        {
          id: 'profile_1',
          userId: 'user_123',
          name: 'Custom Profile',
          description: 'Test',
          isPreset: false,
          tiers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'esc_preset_gentle',
          userId: null,
          name: 'Gentle',
          description: 'Preset',
          isPreset: true,
          tiers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.escalationProfile.findMany.mockResolvedValue(
        mockProfiles,
      );

      const result = await repository.findAll('user_123');

      expect(result).toEqual(mockProfiles);
      expect(mockPrismaService.escalationProfile.findMany).toHaveBeenCalledWith(
        {
          where: {
            OR: [{ userId: 'user_123' }, { isPreset: true }],
          },
          orderBy: [{ isPreset: 'desc' }, { name: 'asc' }],
        },
      );
    });
  });

  describe('findById', () => {
    it('should return profile when exists', async () => {
      const mockProfile: EscalationProfile = {
        id: 'profile_123',
        userId: 'user_123',
        name: 'Test Profile',
        description: 'Test',
        isPreset: false,
        tiers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.escalationProfile.findUnique.mockResolvedValue(
        mockProfile,
      );

      const result = await repository.findById('profile_123');

      expect(result).toEqual(mockProfile);
      expect(
        mockPrismaService.escalationProfile.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: 'profile_123' },
      });
    });

    it('should return null when not found', async () => {
      mockPrismaService.escalationProfile.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create profile successfully', async () => {
      const createData = {
        userId: 'user_123',
        name: 'Custom Profile',
        description: 'Test',
        isPreset: false,
        tiers: [
          {
            tierNumber: 1,
            delayMinutes: 0,
            agentIds: ['email'],
            includeTrustedContacts: false,
          },
        ],
      };

      const mockProfile: EscalationProfile = {
        id: 'profile_123',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.escalationProfile.create.mockResolvedValue(
        mockProfile,
      );

      const result = await repository.create(createData);

      expect(result).toEqual(mockProfile);
      expect(mockPrismaService.escalationProfile.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe('update', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const mockUpdatedProfile: EscalationProfile = {
        id: 'profile_123',
        userId: 'user_123',
        name: 'Updated Name',
        description: 'Updated description',
        isPreset: false,
        tiers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.escalationProfile.update.mockResolvedValue(
        mockUpdatedProfile,
      );

      const result = await repository.update('profile_123', updateData);

      expect(result).toEqual(mockUpdatedProfile);
      expect(mockPrismaService.escalationProfile.update).toHaveBeenCalledWith({
        where: { id: 'profile_123' },
        data: updateData,
      });
    });
  });

  describe('delete', () => {
    it('should delete profile successfully', async () => {
      mockPrismaService.escalationProfile.delete.mockResolvedValue({
        id: 'profile_123',
      });

      await repository.delete('profile_123');

      expect(mockPrismaService.escalationProfile.delete).toHaveBeenCalledWith({
        where: { id: 'profile_123' },
      });
    });
  });

  describe('countByUser', () => {
    it('should return correct count', async () => {
      mockPrismaService.escalationProfile.findMany.mockResolvedValue([
        { id: '1' },
        { id: '2' },
      ]);

      const result = await repository.countByUser('user_123');

      expect(result).toBe(2);
      expect(mockPrismaService.escalationProfile.findMany).toHaveBeenCalledWith(
        {
          where: { userId: 'user_123', isPreset: false },
          select: { id: true },
        },
      );
    });
  });
});

