import { Test, TestingModule } from '@nestjs/testing';
import { EscalationStateService } from '../escalation-state.service';
import { EscalationStateRepository } from '../escalation-state.repository';
import { EscalationProfileRepository } from '../escalation-profile.repository';
import { NotFoundError } from '../../../common/exceptions/not-found.exception';
import type { EscalationState, EscalationProfile } from '@er/types';

describe('EscalationStateService', () => {
  let service: EscalationStateService;
  let stateRepository: EscalationStateRepository;
  let profileRepository: EscalationProfileRepository;

  const mockStateRepository = {
    create: jest.fn(),
    findByReminderId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findDueForAdvancement: jest.fn(),
  };

  const mockProfileRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationStateService,
        {
          provide: EscalationStateRepository,
          useValue: mockStateRepository,
        },
        {
          provide: EscalationProfileRepository,
          useValue: mockProfileRepository,
        },
      ],
    }).compile();

    service = module.get<EscalationStateService>(EscalationStateService);
    stateRepository = module.get<EscalationStateRepository>(
      EscalationStateRepository,
    );
    profileRepository = module.get<EscalationProfileRepository>(
      EscalationProfileRepository,
    );

    jest.clearAllMocks();
  });

  describe('start', () => {
    it('should start escalation successfully', async () => {
      const mockProfile: EscalationProfile = {
        id: 'profile_123',
        userId: null,
        name: 'Test Profile',
        isPreset: true,
        tiers: [
          {
            tierNumber: 1,
            delayMinutes: 0,
            agentIds: ['email'],
            includeTrustedContacts: false,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockState: EscalationState = {
        id: 'state_123',
        reminderId: 'reminder_123',
        profileId: 'profile_123',
        currentTier: 1,
        startedAt: new Date(),
        lastEscalatedAt: null,
        acknowledgedAt: null,
        acknowledgedBy: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProfileRepository.findById.mockResolvedValue(mockProfile);
      mockStateRepository.findByReminderId.mockResolvedValue(null);
      mockStateRepository.create.mockResolvedValue(mockState);

      const result = await service.start('reminder_123', 'profile_123');

      expect(result).toEqual(mockState);
      expect(result.currentTier).toBe(1);
      expect(result.status).toBe('ACTIVE');
    });

    it('should return existing escalation if already started', async () => {
      const existingState: EscalationState = {
        id: 'state_123',
        reminderId: 'reminder_123',
        profileId: 'profile_123',
        currentTier: 1,
        startedAt: new Date(),
        lastEscalatedAt: null,
        acknowledgedAt: null,
        acknowledgedBy: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStateRepository.findByReminderId.mockResolvedValue(existingState);

      const result = await service.start('reminder_123', 'profile_123');

      expect(result).toEqual(existingState);
      expect(mockStateRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if profile does not exist', async () => {
      mockProfileRepository.findById.mockResolvedValue(null);

      await expect(
        service.start('reminder_123', 'nonexistent'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('advance', () => {
    it('should advance to next tier', async () => {
      const mockState: EscalationState = {
        id: 'state_123',
        reminderId: 'reminder_123',
        profileId: 'profile_123',
        currentTier: 1,
        startedAt: new Date(),
        lastEscalatedAt: null,
        acknowledgedAt: null,
        acknowledgedBy: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockProfile: EscalationProfile = {
        id: 'profile_123',
        userId: null,
        name: 'Test',
        isPreset: true,
        tiers: [
          { tierNumber: 1, delayMinutes: 0 },
          { tierNumber: 2, delayMinutes: 5 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStateRepository.findByReminderId.mockResolvedValue(mockState);
      mockProfileRepository.findById.mockResolvedValue(mockProfile);
      mockStateRepository.update.mockResolvedValue({
        ...mockState,
        currentTier: 2,
        lastEscalatedAt: new Date(),
      });

      const result = await service.advance('reminder_123');

      expect(result.currentTier).toBe(2);
      expect(mockStateRepository.update).toHaveBeenCalledWith('state_123', {
        currentTier: 2,
        lastEscalatedAt: expect.any(Date),
      });
    });

    it('should mark as expired when at max tier', async () => {
      const mockState: EscalationState = {
        id: 'state_123',
        reminderId: 'reminder_123',
        profileId: 'profile_123',
        currentTier: 3,
        startedAt: new Date(),
        lastEscalatedAt: new Date(),
        acknowledgedAt: null,
        acknowledgedBy: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockProfile: EscalationProfile = {
        id: 'profile_123',
        userId: null,
        name: 'Test',
        isPreset: true,
        tiers: [
          { tierNumber: 1, delayMinutes: 0 },
          { tierNumber: 2, delayMinutes: 5 },
          { tierNumber: 3, delayMinutes: 10 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStateRepository.findByReminderId.mockResolvedValue(mockState);
      mockProfileRepository.findById.mockResolvedValue(mockProfile);
      mockStateRepository.update.mockResolvedValue({
        ...mockState,
        status: 'EXPIRED',
      });

      const result = await service.advance('reminder_123');

      expect(result.status).toBe('EXPIRED');
    });

    it('should throw NotFoundError if state does not exist', async () => {
      mockStateRepository.findByReminderId.mockResolvedValue(null);

      await expect(service.advance('nonexistent')).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('acknowledge', () => {
    it('should acknowledge escalation successfully', async () => {
      const mockState: EscalationState = {
        id: 'state_123',
        reminderId: 'reminder_123',
        profileId: 'profile_123',
        currentTier: 1,
        startedAt: new Date(),
        lastEscalatedAt: null,
        acknowledgedAt: null,
        acknowledgedBy: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStateRepository.findByReminderId.mockResolvedValue(mockState);
      mockStateRepository.update.mockResolvedValue({
        ...mockState,
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy: 'user_123',
      });

      await service.acknowledge('reminder_123', 'user_123');

      expect(mockStateRepository.update).toHaveBeenCalledWith('state_123', {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: expect.any(Date),
        acknowledgedBy: 'user_123',
      });
    });
  });

  describe('cancel', () => {
    it('should cancel escalation with completed reason', async () => {
      const mockState: EscalationState = {
        id: 'state_123',
        reminderId: 'reminder_123',
        profileId: 'profile_123',
        currentTier: 1,
        startedAt: new Date(),
        lastEscalatedAt: null,
        acknowledgedAt: null,
        acknowledgedBy: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStateRepository.findByReminderId.mockResolvedValue(mockState);
      mockStateRepository.update.mockResolvedValue({
        ...mockState,
        status: 'COMPLETED',
      });

      await service.cancel('reminder_123', 'completed');

      expect(mockStateRepository.update).toHaveBeenCalledWith('state_123', {
        status: 'COMPLETED',
      });
    });
  });

  describe('findDueForAdvancement', () => {
    it('should return escalations due for advancement', async () => {
      const now = new Date();
      const mockStates: EscalationState[] = [
        {
          id: 'state_1',
          reminderId: 'reminder_1',
          profileId: 'profile_123',
          currentTier: 1,
          startedAt: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
          lastEscalatedAt: null,
          acknowledgedAt: null,
          acknowledgedBy: null,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockProfile: EscalationProfile = {
        id: 'profile_123',
        userId: null,
        name: 'Test',
        isPreset: true,
        tiers: [
          { tierNumber: 1, delayMinutes: 5 }, // 5 minutes delay
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStateRepository.findDueForAdvancement.mockResolvedValue(mockStates);
      mockProfileRepository.findById.mockResolvedValue(mockProfile);

      const result = await service.findDueForAdvancement(10);

      expect(result.length).toBeGreaterThan(0);
    });
  });
});

