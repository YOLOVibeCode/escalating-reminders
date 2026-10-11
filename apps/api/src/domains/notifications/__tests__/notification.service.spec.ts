import type { NotificationPayload } from '@er/interfaces';
import type {
  Reminder,
  EscalationProfile,
} from '@er/types';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AgentExecutionService } from '../../agents/agent-execution.service';
import { EscalationProfileRepository } from '../../escalation/escalation-profile.repository';
import { ReminderRepository } from '../../reminders/reminder.repository';
import { GuardedSmsSendService } from '../../sms/guarded-sms-send.service';
import { SmsConsentRepository } from '../../sms/sms-consent.repository';
import { NotificationRepository } from '../notification.repository';
import { NotificationService } from '../notification.service';


describe('NotificationService', () => {
  let service: NotificationService;

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
    trustedContact: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockGuardedSmsSend = {
    send: jest.fn(),
  };

  const mockSmsConsentRepository = {
    hasActiveConsent: jest.fn().mockResolvedValue(false),
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
        {
          provide: GuardedSmsSendService,
          useValue: mockGuardedSmsSend,
        },
        {
          provide: SmsConsentRepository,
          useValue: mockSmsConsentRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);

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
      const payload: NotificationPayload = {
        notificationId: 'notif_123',
        userId: 'user_123',
        reminderId: 'reminder_123',
        title: 'Test',
        message: 'Test message',
        escalationTier: 1,
        importance: 'MEDIUM',
        actions: [],
        metadata: {},
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
        payload,
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
        expect.objectContaining({
          status: 'DELIVERED',
        }),
      );
      const updateCalls = mockNotificationRepository.update.mock.calls as [
        string,
        { deliveredAt?: Date },
      ][];
      const updateArg = updateCalls[0]?.[1];
      expect(updateArg?.deliveredAt).toBeInstanceOf(Date);
    });
  });

  describe('trusted contact texts', () => {
    const reminder = {
      id: 'reminder_9',
      userId: 'user_123',
      title: 'Pay rent',
      description: null,
      importance: 'HIGH',
      status: 'ACTIVE',
      escalationProfileId: 'profile_tc',
      nextTriggerAt: new Date(),
      lastTriggeredAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const profile = {
      id: 'profile_tc',
      userId: 'user_123',
      name: 'Contacts at tier 2',
      isPreset: false,
      tiers: [{ tierNumber: 2, delayMinutes: 0, agentIds: [], includeTrustedContacts: true }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('texts only contacts who opted in for this user, naming the user and ending with STOP', async () => {
      mockReminderRepository.findById.mockResolvedValue(reminder);
      mockEscalationProfileRepository.findById.mockResolvedValue(profile);
      mockPrisma.trustedContact.findMany.mockResolvedValueOnce([
        { id: 'tc_ok', phone: '+15125550101', notificationPreferences: { email: true, sms: true } },
        { id: 'tc_invited', phone: '+15125550102', notificationPreferences: { email: true, sms: true } },
        { id: 'tc_email', phone: '+15125550103', notificationPreferences: { email: true, sms: false } },
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({ profile: { displayName: 'Jordan' } });
      mockSmsConsentRepository.hasActiveConsent.mockImplementation((_phone: string, purpose: string) =>
        Promise.resolve(purpose === 'trusted-contact:tc_ok'),
      );
      mockGuardedSmsSend.send.mockResolvedValue({});

      await service.sendTierNotifications('reminder_9', 'user_123', 2);

      expect(mockGuardedSmsSend.send).toHaveBeenCalledTimes(1);
      const sent = (mockGuardedSmsSend.send.mock.calls as unknown[][])[0][0] as { phone: string; purpose: string; body: string };
      expect(sent.phone).toBe('+15125550101');
      expect(sent.purpose).toBe('trusted-contact:tc_ok');
      expect(sent.body).toBe("Jordan's reminder is still open (tier 2): Pay rent. Reply STOP to opt out.");
      expect(`Escalating Reminders: ${sent.body}`.length).toBeLessThanOrEqual(160);
    });
  });
});

