import type {
  IAgentExecutor,
  NotificationPayload,
  AgentCommand,
  SendResult,
  CommandResult,
} from '@er/interfaces';
import type { UserAgentSubscription } from '@er/types';
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { GuardedSmsSendService } from '../../sms/guarded-sms-send.service';
import { parseToE164 } from '../../sms/phone.util';

@Injectable()
export class SmsAgentExecutor implements IAgentExecutor {
  readonly agentType = 'sms';
  private readonly logger = new Logger(SmsAgentExecutor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly guardedSmsSend: GuardedSmsSendService,
  ) {}

  async send(subscription: UserAgentSubscription, payload: NotificationPayload): Promise<SendResult> {
    const startedAt = Date.now();
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: subscription.userId },
        select: { phone: true },
      });

      const rawPhone = user?.phone;
      if (rawPhone === null || rawPhone === undefined || rawPhone === '') {
        return { success: false, error: 'User phone not found' };
      }

      const phone = parseToE164(rawPhone);
      const text = `${payload.title}\n${payload.message}`;

      const result = await this.guardedSmsSend.send({
        phone,
        body: text,
        metadata: {
          notificationId: payload.notificationId,
          reminderId: payload.reminderId,
          userId: subscription.userId,
        },
      });

      this.logger.log(`SMS sent to ${phone} in ${Date.now() - startedAt}ms`);
      const sendResult: SendResult = {
        success: true,
        deliveredAt: new Date(),
      };
      if (result.messageSid !== undefined && result.messageSid !== '') {
        sendResult.messageId = result.messageSid;
      }
      return sendResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`SMS send failed: ${message}`);
      return { success: false, error: message };
    }
  }

  handleCommand(
    _subscription: UserAgentSubscription,
    _command: AgentCommand,
  ): Promise<CommandResult> {
    return Promise.resolve({
      success: false,
      error: 'SMS commands are handled via the inbound webhook',
    });
  }

  async test(subscription: UserAgentSubscription): Promise<{
    success: boolean;
    message: string;
    deliveryTime?: number;
  }> {
    const startedAt = Date.now();
    const payload: NotificationPayload = {
      notificationId: `test_${Date.now()}`,
      userId: subscription.userId,
      reminderId: 'test',
      title: 'Test SMS Notification',
      message: 'This is a test SMS from Escalating Reminders.',
      escalationTier: 0,
      importance: 'LOW',
      actions: [],
      metadata: { test: true },
    };

    const result = await this.send(subscription, payload);
    const deliveryTime = Date.now() - startedAt;
    return result.success
      ? { success: true, message: 'Test SMS sent successfully', deliveryTime }
      : { success: false, message: result.error ?? 'Test SMS failed', deliveryTime };
  }
}
