import type { NotificationPayload } from '@er/interfaces';
import type { UserAgentSubscription } from '@er/types';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { GuardedSmsSendService } from '../../sms/guarded-sms-send.service';
import { SmsAgentExecutor } from '../executors/sms-agent.executor';

describe('SmsAgentExecutor', () => {
  let executor: SmsAgentExecutor;
  const prisma = {
    user: { findUnique: jest.fn() },
  };
  const guardedSmsSend = { send: jest.fn() };

  const subscription: UserAgentSubscription = {
    id: 'sub_sms',
    userId: 'user_1',
    agentDefinitionId: 'agent_sms',
    isEnabled: true,
    configuration: {},
    webhookSecret: null,
    lastTestedAt: null,
    lastTestResult: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const payload: NotificationPayload = {
    notificationId: 'n1',
    userId: 'user_1',
    reminderId: 'r1',
    title: 'Reminder',
    message: 'Please acknowledge',
    escalationTier: 1,
    importance: 'HIGH',
    actions: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsAgentExecutor,
        { provide: PrismaService, useValue: prisma },
        { provide: GuardedSmsSendService, useValue: guardedSmsSend },
      ],
    }).compile();
    executor = module.get(SmsAgentExecutor);
  });

  it('sends via guarded service when user has phone', async () => {
    prisma.user.findUnique.mockResolvedValue({ phone: '+15125550100' });
    guardedSmsSend.send.mockResolvedValue({ messageSid: 'SM123' });

    const result = await executor.send(subscription, payload);

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('SM123');
    expect(guardedSmsSend.send).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '+15125550100',
        body: 'Reminder\nPlease acknowledge',
      }),
    );
  });

  it('returns error when user has no phone', async () => {
    prisma.user.findUnique.mockResolvedValue({ phone: null });

    const result = await executor.send(subscription, payload);

    expect(result.success).toBe(false);
    expect(guardedSmsSend.send).not.toHaveBeenCalled();
  });

  it('handleCommand defers to inbound webhook', async () => {
    const result = await executor.handleCommand(subscription, {
      userId: 'user_1',
      action: 'snooze',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('inbound webhook');
  });
});
