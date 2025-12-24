import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../notification.service';
import { NotificationRepository } from '../notification.repository';
import { ReminderRepository } from '../../reminders/reminder.repository';
import { EscalationProfileRepository } from '../../escalation/escalation-profile.repository';
import { AgentExecutionService } from '../../agents/agent-execution.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  Reminder,
  EscalationProfile,
} from '@er/types';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: NotificationRepository;
  let reminderRepository: ReminderRepository;
  let escalationProfileRepository: EscalationProfileRepository;
  let agentExecutionService: AgentExecutionService;

  const mockNotificationRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findByReminderId: jest.fn(),
    findById: jest.fn(),
  };

  const mockReminderRepository = {
    findById: jest.fn(),
  };

  const mockEscalationProfileRepository = {
    findById: jest.fn(),
  };

  const mockAgentExecutionService = {
    execute: jest.fn(),
  };

  const mockPrisma = {
    subscription: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    deliveryWindowUsage: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationRepository,
          useValue: mockNotificationRepository,
        },
        {
          provide: ReminderRepository,
          useValue: mockReminderRepository,
        },
        {
          provide: EscalationProfileRepository,
          useValue: mockEscalationProfileRepository,
        },
        {
          provide: AgentExecutionService,
          useValue: mockAgentExecutionService,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get<NotificationRepository>(
      NotificationRepository,
    );
    reminderRepository = module.get<ReminderRepository>(ReminderRepository);
    escalationProfileRepository = module.get<EscalationProfileRepository>(
      EscalationProfileRepository,
    );
    agentExecutionService = module.get<AgentExecutionService>(
      AgentExecutionService,
    );

    jest.clearAllMocks();

    // Default delivery policy: ACTIVE (no blocking, no throttling)
    mockPrisma.subscription.findUnique.mockResolvedValue({
      deliveryState: 'ACTIVE',
      usageSuspendedUntil: null,
    });
    mockConfigService.get.mockReturnValue(undefined);
  });

  describe('sendTierNotifications', () => {
    const mockReminder: Reminder = {
      id: 'reminder_123',
      userId: 'user_123',
      title: 'Test Reminder',
      description: 'Test',
      importance: 'MEDIUM',
      status: 'ACTIVE',
      escalationProfileId: 'profile_123',
      nextTriggerAt: new Date(),
      lastTriggeredAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockEscalationProfile: EscalationProfile = {
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
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should send notifications for all agents in tier', async () => {
      mockReminderRepository.findById.mockResolvedValue(mockReminder);
      mockEscalationProfileRepository.findById.mockResolvedValue(
        mockEscalationProfile,
      );
      mockAgentExecutionService.execute.mockResolvedValue({
        success: true,
        messageId: 'msg_123',
        deliveredAt: new Date(),
      });
      mockNotificationRepository.create.mockResolvedValue({
        id: 'notif_123',
        userId: 'user_123',
        reminderId: 'reminder_123',
        escalationStateId: null,
        agentType: 'webhook',
        tier: 1,
        status: 'DELIVERED',
        sentAt: new Date(),
        deliveredAt: new Date(),
        failureReason: null,
        metadata: {},
        createdAt: new Date(),
      });

      const result = await service.sendTierNotifications(
        'reminder_123',
        'user_123',
        1,
      );

      expect(result).toHaveLength(1);
      expect(mockAgentExecutionService.execute).toHaveBeenCalledWith(
        'webhook',
        'user_123',
        expect.objectContaining({
          reminderId: 'reminder_123',
          escalationTier: 1,
        }),
      );
    });

    it('should handle agent execution failures gracefully', async () => {
      mockReminderRepository.findById.mockResolvedValue(mockReminder);
      mockEscalationProfileRepository.findById.mockResolvedValue(
        mockEscalationProfile,
      );
      mockAgentExecutionService.execute.mockResolvedValue({
        success: false,
        error: 'Agent execution failed',
      });
      mockNotificationRepository.create.mockResolvedValue({
        id: 'notif_123',
        userId: 'user_123',
        reminderId: 'reminder_123',
        escalationStateId: null,
        agentType: 'webhook',
        tier: 1,
        status: 'FAILED',
        sentAt: new Date(),
        deliveredAt: null,
        failureReason: 'Agent execution failed',
        metadata: {},
        createdAt: new Date(),
      });

      const result = await service.sendTierNotifications(
        'reminder_123',
        'user_123',
        1,
      );

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('FAILED');
    });
  });

  describe('sendNotification', () => {
    it('should send a single notification via agent', async () => {
      const payload = {
        notificationId: 'notif_123',
        userId: 'user_123',
        reminderId: 'reminder_123',
        title: 'Test',
        message: 'Test message',
        escalationTier: 1,
        importance: 'MEDIUM',
        actions: [],
      };

      mockAgentExecutionService.execute.mockResolvedValue({
        success: true,
        messageId: 'msg_123',
        deliveredAt: new Date(),
      });
      mockNotificationRepository.create.mockResolvedValue({
        id: 'notif_123',
        userId: 'user_123',
        reminderId: 'reminder_123',
        escalationStateId: null,
        agentType: 'webhook',
        tier: 1,
        status: 'DELIVERED',
        sentAt: new Date(),
        deliveredAt: new Date(),
        failureReason: null,
        metadata: {},
        createdAt: new Date(),
      });

      const result = await service.sendNotification(
        'user_123',
        'reminder_123',
        'webhook',
        payload as any,
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('DELIVERED');
    });
  });

  describe('markAsDelivered', () => {
    it('should mark notification as delivered', async () => {
      mockNotificationRepository.findById.mockResolvedValue({
        id: 'notif_123',
        userId: 'user_123',
        reminderId: 'reminder_123',
        escalationStateId: null,
        agentType: 'webhook',
        tier: 1,
        status: 'PENDING',
        sentAt: null,
        deliveredAt: null,
        failureReason: null,
        metadata: {},
        createdAt: new Date(),
      });
      mockNotificationRepository.update.mockResolvedValue({
        id: 'notif_123',
        userId: 'user_123',
        reminderId: 'reminder_123',
        escalationStateId: null,
        agentType: 'webhook',
        tier: 1,
        status: 'DELIVERED',
        sentAt: new Date(),
        deliveredAt: new Date(),
        failureReason: null,
        metadata: {},
        createdAt: new Date(),
      });

      await service.markAsDelivered('notif_123');

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        'notif_123',
        {
          status: 'DELIVERED',
          deliveredAt: expect.any(Date),
        },
      );
    });
  });
});

