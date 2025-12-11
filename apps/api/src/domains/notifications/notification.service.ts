import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { ReminderRepository } from '../reminders/reminder.repository';
import { EscalationProfileRepository } from '../escalation/escalation-profile.repository';
import { AgentExecutionService } from '../agents/agent-execution.service';
import { NotFoundError } from '../../common/exceptions';
import type {
  INotificationService,
  NotificationPayload,
} from '@er/interfaces';
import type { NotificationLog } from '@er/types';
import { v4 as uuid } from 'uuid';

/**
 * Notification service.
 * Implements INotificationService interface.
 * Orchestrates notification sending via agents.
 */
@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly reminderRepository: ReminderRepository,
    private readonly escalationProfileRepository: EscalationProfileRepository,
    private readonly agentExecutionService: AgentExecutionService,
  ) {}

  async sendTierNotifications(
    reminderId: string,
    userId: string,
    tier: number,
  ): Promise<NotificationLog[]> {
    this.logger.log(
      `Sending tier ${tier} notifications for reminder ${reminderId}`,
    );

    // 1. Get reminder details
    const reminder = await this.reminderRepository.findById(reminderId);
    if (!reminder) {
      throw new NotFoundError(`Reminder with ID ${reminderId} not found`);
    }

    // 2. Get escalation profile
    const profile = await this.escalationProfileRepository.findById(
      reminder.escalationProfileId,
    );
    if (!profile) {
      throw new NotFoundError(
        `Escalation profile with ID ${reminder.escalationProfileId} not found`,
      );
    }

    // 3. Get tier configuration
    const tiers = profile.tiers as Array<{
      tierNumber: number;
      agentIds: string[];
      includeTrustedContacts: boolean;
      message?: string;
    }>;

    const tierConfig = tiers.find((t) => t.tierNumber === tier);
    if (!tierConfig) {
      this.logger.warn(
        `Tier ${tier} not found in escalation profile ${profile.id}`,
      );
      return [];
    }

    // 4. Send notifications via each agent in this tier
    const notificationLogs: NotificationLog[] = [];

    for (const agentType of tierConfig.agentIds) {
      try {
        const notificationId = `notif_${uuid()}`;
        const payload: NotificationPayload = {
          notificationId,
          userId,
          reminderId,
          title: reminder.title,
          message:
            tierConfig.message ||
            reminder.description ||
            reminder.title,
          escalationTier: tier,
          importance: reminder.importance,
          actions: ['snooze', 'dismiss', 'complete'],
          metadata: {
            reminderId: reminder.id,
            escalationTier: tier,
          },
        };

        // 5. Execute agent
        const sendResult = await this.agentExecutionService.execute(
          agentType,
          userId,
          payload,
        );

        // 6. Log notification
        const notificationLog = await this.notificationRepository.create({
          userId,
          reminderId,
          agentType,
          tier,
          status: sendResult.success ? 'DELIVERED' : 'FAILED',
          metadata: payload as unknown,
          sentAt: new Date(),
          deliveredAt: sendResult.deliveredAt,
          failureReason: sendResult.error,
        });

        notificationLogs.push(notificationLog);

        if (sendResult.success) {
          this.logger.log(
            `Notification sent successfully via ${agentType} for reminder ${reminderId}, tier ${tier}`,
          );
        } else {
          this.logger.warn(
            `Notification failed via ${agentType} for reminder ${reminderId}, tier ${tier}: ${sendResult.error}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error sending notification via ${agentType} for reminder ${reminderId}: ${error instanceof Error ? error.message : String(error)}`,
        );

        // Log failed notification
        const notificationLog = await this.notificationRepository.create({
          userId,
          reminderId,
          agentType,
          tier,
          status: 'FAILED',
          metadata: {},
          sentAt: new Date(),
          failureReason: error instanceof Error ? error.message : 'Unknown error',
        });

        notificationLogs.push(notificationLog);
      }
    }

    return notificationLogs;
  }

  async sendNotification(
    userId: string,
    reminderId: string,
    agentType: string,
    payload: NotificationPayload,
  ): Promise<NotificationLog> {
    this.logger.log(
      `Sending notification via ${agentType} for reminder ${reminderId}`,
    );

    // 1. Execute agent
    const sendResult = await this.agentExecutionService.execute(
      agentType,
      userId,
      payload,
    );

    // 2. Log notification
    const notificationLog = await this.notificationRepository.create({
      userId,
      reminderId,
      agentType,
      tier: payload.escalationTier,
      status: sendResult.success ? 'DELIVERED' : 'FAILED',
      metadata: payload as unknown,
      sentAt: new Date(),
      deliveredAt: sendResult.deliveredAt,
      failureReason: sendResult.error,
    });

    if (!sendResult.success) {
      throw new NotFoundError(
        `Failed to send notification via ${agentType}: ${sendResult.error}`,
      );
    }

    return notificationLog;
  }

  async markAsDelivered(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(
      notificationId,
    );
    if (!notification) {
      throw new NotFoundError(
        `Notification with ID ${notificationId} not found`,
      );
    }

    await this.notificationRepository.update(notificationId, {
      status: 'DELIVERED',
      deliveredAt: new Date(),
    });
  }
}

