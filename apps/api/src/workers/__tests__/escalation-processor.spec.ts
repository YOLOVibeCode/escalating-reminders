import { Test, TestingModule } from '@nestjs/testing';
import { EscalationProcessor } from '../processors/escalation-processor';
import { EscalationStateService } from '../../domains/escalation/escalation-state.service';
import { EscalationProfileRepository } from '../../domains/escalation/escalation-profile.repository';
import { ReminderRepository } from '../../domains/reminders/reminder.repository';
import { QueueService } from '../../infrastructure/queue/queue.service';
import type { EscalationState, EscalationProfile, Reminder } from '@er/types';

describe('EscalationProcessor', () => {
  let processor: EscalationProcessor;
  let escalationStateService: EscalationStateService;
  let escalationProfileRepository: EscalationProfileRepository;
  let reminderRepository: ReminderRepository;
  let queueService: QueueService;

  const mockEscalationStateService = {
    advance: jest.fn(),
    findDueForAdvancement: jest.fn(),
  };

  const mockEscalationProfileRepository = {
    findById: jest.fn(),
  };

  const mockReminderRepository = {
    findById: jest.fn(),
  };

  const mockQueueService = {
    add: jest.fn(),
    process: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationProcessor,
        {
          provide: EscalationStateService,
          useValue: mockEscalationStateService,
        },
        {
          provide: EscalationProfileRepository,
          useValue: mockEscalationProfileRepository,
        },
        {
          provide: ReminderRepository,
          useValue: mockReminderRepository,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    processor = module.get<EscalationProcessor>(EscalationProcessor);
    escalationStateService = module.get<EscalationStateService>(
      EscalationStateService,
    );
    escalationProfileRepository = module.get<EscalationProfileRepository>(
      EscalationProfileRepository,
    );
    reminderRepository = module.get<ReminderRepository>(ReminderRepository);
    queueService = module.get<QueueService>(QueueService);

    jest.clearAllMocks();
  });

  describe('processEscalationAdvancement', () => {
    const mockReminder: Reminder = {
      id: 'reminder_123',
      userId: 'user_123',
      title: 'Test Reminder',
      description: 'Test',
      importance: 'NORMAL',
      status: 'ACTIVE',
      escalationProfileId: 'profile_123',
      nextTriggerAt: new Date(),
      lastTriggeredAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockEscalationState: EscalationState = {
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
      name: 'Test Profile',
      isPreset: true,
      tiers: [
        {
          tierNumber: 1,
          delayMinutes: 0,
          agentIds: ['webhook'],
          includeTrustedContacts: false,
        },
        {
          tierNumber: 2,
          delayMinutes: 5,
          agentIds: ['webhook', 'email'],
          includeTrustedContacts: false,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should advance escalation and queue notifications', async () => {
      const updatedState: EscalationState = {
        ...mockEscalationState,
        currentTier: 2,
        lastEscalatedAt: new Date(),
      };

      mockEscalationStateService.advance.mockResolvedValue(updatedState);
      mockEscalationProfileRepository.findById.mockResolvedValue(mockProfile);
      mockReminderRepository.findById.mockResolvedValue(mockReminder);
      mockQueueService.add.mockResolvedValue(undefined);

      await processor.processEscalationAdvancement({
        escalationStateId: 'state_123',
        reminderId: 'reminder_123',
      });

      expect(mockEscalationStateService.advance).toHaveBeenCalledWith(
        'state_123',
      );
      expect(mockQueueService.add).toHaveBeenCalledWith(
        'default',
        'notification.send',
        {
          reminderId: 'reminder_123',
          userId: 'user_123',
          escalationTier: 2,
        },
        expect.any(Object),
      );
    });

    it('should queue next advancement if delay exists', async () => {
      const updatedState: EscalationState = {
        ...mockEscalationState,
        currentTier: 1,
        lastEscalatedAt: new Date(),
      };

      mockEscalationStateService.advance.mockResolvedValue(updatedState);
      mockEscalationProfileRepository.findById.mockResolvedValue(mockProfile);
      mockReminderRepository.findById.mockResolvedValue(mockReminder);
      mockQueueService.add.mockResolvedValue(undefined);

      await processor.processEscalationAdvancement({
        escalationStateId: 'state_123',
        reminderId: 'reminder_123',
      });

      // Should queue advancement with delay
      expect(mockQueueService.add).toHaveBeenCalledWith(
        'high-priority',
        'escalation.advance',
        {
          escalationStateId: 'state_123',
          reminderId: 'reminder_123',
        },
        expect.objectContaining({
          delay: 5 * 60 * 1000, // 5 minutes in ms
        }),
      );
    });

    it('should stop if escalation expired', async () => {
      const expiredState: EscalationState = {
        ...mockEscalationState,
        status: 'EXPIRED',
      };

      mockEscalationStateService.advance.mockResolvedValue(expiredState);

      await processor.processEscalationAdvancement({
        escalationStateId: 'state_123',
        reminderId: 'reminder_123',
      });

      expect(mockQueueService.add).not.toHaveBeenCalled();
    });
  });
});

