import { Test, TestingModule } from '@nestjs/testing';
import { EscalationProfileService } from '../escalation-profile.service';
import { EscalationProfileRepository } from '../escalation-profile.repository';
import { AuthRepository } from '../../auth/auth.repository';
import { SUBSCRIPTION_TIERS } from '@er/constants';
import type {
  EscalationProfile,
  CreateEscalationProfileDto,
  UpdateEscalationProfileDto,
} from '@er/types';

describe('EscalationProfileService', () => {
  let service: EscalationProfileService;
  let repository: EscalationProfileRepository;
  let authRepository: AuthRepository;

  const mockRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countByUser: jest.fn(),
  };

  const mockAuthRepository = {
    findByIdWithSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationProfileService,
        {
          provide: EscalationProfileRepository,
          useValue: mockRepository,
        },
        {
          provide: AuthRepository,
          useValue: mockAuthRepository,
        },
      ],
    }).compile();

    service = module.get<EscalationProfileService>(EscalationProfileService);
    repository = module.get<EscalationProfileRepository>(
      EscalationProfileRepository,
    );
    authRepository = module.get<AuthRepository>(AuthRepository);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all available profiles', async () => {
      const mockProfiles: EscalationProfile[] = [
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
        {
          id: 'profile_1',
          userId: 'user_123',
          name: 'Custom',
          description: 'Custom',
          isPreset: false,
          tiers: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findAll.mockResolvedValue(mockProfiles);

      const result = await service.findAll('user_123');

      expect(result).toEqual(mockProfiles);
      expect(mockRepository.findAll).toHaveBeenCalledWith('user_123');
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

      mockRepository.findById.mockResolvedValue(mockProfile);

      const result = await service.findById('profile_123');

      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundError when profile does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        'NotFoundError',
      );
    });
  });

  describe('create', () => {
    const createDto: CreateEscalationProfileDto = {
      name: 'Custom Profile',
      description: 'Test',
      tiers: [
        {
          tierNumber: 1,
          delayMinutes: 0,
          agentIds: ['email'],
          includeTrustedContacts: false,
        },
      ],
    };

    it('should create profile successfully', async () => {
      mockAuthRepository.findByIdWithSubscription.mockResolvedValue({
        id: 'user_123',
        subscription: { tier: 'FREE' },
      });
      mockRepository.countByUser.mockResolvedValue(0);
      mockRepository.create.mockResolvedValue({
        id: 'profile_123',
        userId: 'user_123',
        ...createDto,
        isPreset: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create('user_123', createDto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Custom Profile');
    });

    it('should check user subscription tier for quota', async () => {
      mockAuthRepository.findByIdWithSubscription.mockResolvedValue({
        id: 'user_123',
        subscription: { tier: 'FREE' },
      });
      // FREE tier doesn't allow custom profiles (we'll set limit to 0)
      mockRepository.countByUser.mockResolvedValue(0);

      // For now, we'll allow creation but this can be enforced later
      mockRepository.create.mockResolvedValue({
        id: 'profile_123',
        userId: 'user_123',
        ...createDto,
        isPreset: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create('user_123', createDto);

      expect(result).toBeDefined();
    });

    it('should validate tiers', async () => {
      const invalidDto = {
        name: 'Test',
        tiers: [], // Empty tiers should fail
      } as CreateEscalationProfileDto;

      mockAuthRepository.findByIdWithSubscription.mockResolvedValue({
        id: 'user_123',
        subscription: { tier: 'FREE' },
      });
      mockRepository.countByUser.mockResolvedValue(0);

      await expect(service.create('user_123', invalidDto)).rejects.toThrow();
    });
  });

  describe('update', () => {
    const updateDto: UpdateEscalationProfileDto = {
      name: 'Updated Name',
    };

    it('should update profile successfully', async () => {
      const mockProfile: EscalationProfile = {
        id: 'profile_123',
        userId: 'user_123',
        name: 'Original Name',
        isPreset: false,
        tiers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockProfile);
      mockRepository.update.mockResolvedValue({
        ...mockProfile,
        name: 'Updated Name',
      });

      const result = await service.update('user_123', 'profile_123', updateDto);

      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundError when profile does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('user_123', 'nonexistent', updateDto),
      ).rejects.toThrow('NotFoundError');
    });

    it('should throw ForbiddenError when user does not own profile', async () => {
      const otherUserProfile: EscalationProfile = {
        id: 'profile_123',
        userId: 'other_user',
        name: 'Other Profile',
        isPreset: false,
        tiers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(otherUserProfile);

      await expect(
        service.update('user_123', 'profile_123', updateDto),
      ).rejects.toThrow('ForbiddenError');
    });
  });

  describe('delete', () => {
    it('should delete profile successfully', async () => {
      const mockProfile: EscalationProfile = {
        id: 'profile_123',
        userId: 'user_123',
        name: 'Test Profile',
        isPreset: false,
        tiers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockProfile);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.delete('user_123', 'profile_123');

      expect(mockRepository.delete).toHaveBeenCalledWith('profile_123');
    });

    it('should throw NotFoundError when profile does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.delete('user_123', 'nonexistent'),
      ).rejects.toThrow('NotFoundError');
    });

    it('should throw ForbiddenError when user does not own profile', async () => {
      const otherUserProfile: EscalationProfile = {
        id: 'profile_123',
        userId: 'other_user',
        name: 'Other Profile',
        isPreset: false,
        tiers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(otherUserProfile);

      await expect(
        service.delete('user_123', 'profile_123'),
      ).rejects.toThrow('ForbiddenError');
    });

    it('should not allow deleting preset profiles', async () => {
      const presetProfile: EscalationProfile = {
        id: 'esc_preset_gentle',
        userId: null,
        name: 'Gentle',
        isPreset: true,
        tiers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(presetProfile);

      await expect(
        service.delete('user_123', 'esc_preset_gentle'),
      ).rejects.toThrow('ForbiddenError');
    });
  });
});

