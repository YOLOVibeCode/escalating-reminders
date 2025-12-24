import { Test, TestingModule } from '@nestjs/testing';
import { EscalationProfileController } from '../escalation-profile.controller';
import { EscalationProfileService } from '../escalation-profile.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type {
  EscalationProfile,
  CreateEscalationProfileDto,
  UpdateEscalationProfileDto,
} from '@er/types';

describe('EscalationProfileController', () => {
  let controller: EscalationProfileController;
  let service: EscalationProfileService;

  const mockService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUser = {
    sub: 'user_123',
    email: 'test@example.com',
  };

  const mockRequest = {
    user: mockUser,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EscalationProfileController],
      providers: [
        {
          provide: EscalationProfileService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EscalationProfileController>(
      EscalationProfileController,
    );
    service = module.get<EscalationProfileService>(EscalationProfileService);

    jest.clearAllMocks();
  });

  describe('GET /escalation-profiles', () => {
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
      ];

      mockService.findAll.mockResolvedValue(mockProfiles);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(mockProfiles);
      expect(mockService.findAll).toHaveBeenCalledWith('user_123');
    });
  });

  describe('GET /escalation-profiles/:id', () => {
    it('should return profile by ID', async () => {
      const mockProfile: EscalationProfile = {
        id: 'profile_123',
        userId: 'user_123',
        name: 'Test Profile',
        description: null,
        isPreset: false,
        tiers: [] as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.findById.mockResolvedValue(mockProfile);

      const result = await controller.findOne('profile_123');

      expect(result).toEqual(mockProfile);
    });
  });

  describe('POST /escalation-profiles', () => {
    it('should create profile successfully', async () => {
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

      const mockProfile: EscalationProfile = {
        id: 'profile_123',
        userId: 'user_123',
        name: createDto.name,
        description: createDto.description || null,
        tiers: createDto.tiers as any,
        isPreset: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.create.mockResolvedValue(mockProfile);

      const result = await controller.create(mockRequest, createDto);

      expect(result).toEqual(mockProfile);
      expect(mockService.create).toHaveBeenCalledWith('user_123', createDto);
    });
  });

  describe('PATCH /escalation-profiles/:id', () => {
    it('should update profile successfully', async () => {
      const updateDto: UpdateEscalationProfileDto = {
        name: 'Updated Name',
      };

      const mockUpdatedProfile: EscalationProfile = {
        id: 'profile_123',
        userId: 'user_123',
        name: 'Updated Name',
        description: null,
        isPreset: false,
        tiers: [] as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockService.update.mockResolvedValue(mockUpdatedProfile);

      const result = await controller.update(
        mockRequest,
        'profile_123',
        updateDto,
      );

      expect(result).toEqual(mockUpdatedProfile);
    });
  });

  describe('DELETE /escalation-profiles/:id', () => {
    it('should delete profile successfully', async () => {
      mockService.delete.mockResolvedValue(undefined);

      await controller.remove(mockRequest, 'profile_123');

      expect(mockService.delete).toHaveBeenCalledWith('user_123', 'profile_123');
    });
  });
});

