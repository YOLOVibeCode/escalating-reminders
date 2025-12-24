import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationRepository } from './notification.repository';
import { ReminderRepository } from '../reminders/reminder.repository';
import { EscalationProfileRepository } from '../escalation/escalation-profile.repository';
import { AgentExecutionService } from '../agents/agent-execution.service';
import { NotFoundError } from '../../common/exceptions';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type {
  INotificationService,
  NotificationPayload,
} from '@er/interfaces';
import type { NotificationLog, NotificationStatus } from '@er/types';
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
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getUsageSuspensionWindowDays(): number {
    const raw = this.configService.get<string>('USAGE_SUSPENSION_WINDOW_DAYS') || '3';
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 3;
  }

  private getUsageSuspensionAllowancePerWindow(): number {
    const raw = this.configService.get<string>('USAGE_SUSPENSION_ALLOWANCE_PER_WINDOW') || '3';
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 3;
  }

  private getWindowStart(now: Date): { windowStart: Date; nextResetAt: Date } {
    const days = this.getUsageSuspensionWindowDays();
    const windowMs = days * 24 * 60 * 60 * 1000;
    const nowMs = now.getTime();
    const startMs = Math.floor(nowMs / windowMs) * windowMs;
    return {
      windowStart: new Date(startMs),
      nextResetAt: new Date(startMs + windowMs),
    };
  }

  private async evaluateDeliveryPolicy(userId: string): Promise<
    | { allowed: true; mode: 'ACTIVE' }
    | { allowed: true; mode: 'USAGE_SUSPENDED'; windowStart: Date; nextResetAt: Date }
    | { allowed: false; reason: 'DELIVERY_DISABLED' }
    | { allowed: false; reason: 'USAGE_SUSPENDED_LIMIT_REACHED'; nextResetAt: Date }
  > {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        deliveryState: true,
        usageSuspendedUntil: true,
      },
    });

    // If we can't resolve a subscription, don't block delivery (shouldn't happen in normal flows).
    if (!subscription) return { allowed: true, mode: 'ACTIVE' };

    if (subscription.deliveryState === 'DELIVERY_DISABLED') {
      return { allowed: false, reason: 'DELIVERY_DISABLED' };
    }

    if (subscription.deliveryState === 'USAGE_SUSPENDED') {
      const now = new Date();
      if (subscription.usageSuspendedUntil && subscription.usageSuspendedUntil <= now) {
        // Suspension window has elapsed; automatically return to ACTIVE.
        await this.prisma.subscription.update({
          where: { userId },
          data: {
            deliveryState: 'ACTIVE',
            usageSuspendedAt: null,
            usageSuspendedUntil: null,
            usageSuspensionReason: null,
          },
        });
        return { allowed: true, mode: 'ACTIVE' };
      }

      const { windowStart, nextResetAt } = this.getWindowStart(now);
      const allowance = this.getUsageSuspensionAllowancePerWindow();
      if (allowance === 0) {
        return { allowed: false, reason: 'USAGE_SUSPENDED_LIMIT_REACHED', nextResetAt };
      }

      const usage = await this.prisma.deliveryWindowUsage.findUnique({
        where: {
          userId_windowStart: {
            userId,
            windowStart,
          },
        },
        select: { usedCount: true },
      });
      const usedCount = usage?.usedCount ?? 0;

      if (usedCount >= allowance) {
        return { allowed: false, reason: 'USAGE_SUSPENDED_LIMIT_REACHED', nextResetAt };
      }

      return { allowed: true, mode: 'USAGE_SUSPENDED', windowStart, nextResetAt };
    }

    return { allowed: true, mode: 'ACTIVE' };
  }

  private async incrementSuspendedDeliveryUsage(userId: string, windowStart: Date): Promise<void> {
    await this.prisma.deliveryWindowUsage.upsert({
      where: {
        userId_windowStart: {
          userId,
          windowStart,
        },
      },
      create: {
        userId,
        windowStart,
        usedCount: 1,
      },
      update: {
        usedCount: { increment: 1 },
      },
    });
  }

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
        // Enforce delivery policy (disabled vs usage-suspended allowance)
        const policy = await this.evaluateDeliveryPolicy(userId);
        if (!policy.allowed) {
          const failureReason =
            policy.reason === 'DELIVERY_DISABLED'
              ? 'Delivery disabled for this account'
              : `Usage suspended: allowance reached (resets at ${policy.nextResetAt.toISOString()})`;

          const blockedLog = await this.notificationRepository.create({
            userId,
            reminderId,
            agentType,
            tier,
            status: 'FAILED' as NotificationStatus,
            metadata: {
              blocked: true,
              reason: policy.reason,
              ...(policy.reason === 'USAGE_SUSPENDED_LIMIT_REACHED'
                ? { nextResetAt: policy.nextResetAt.toISOString() }
                : {}),
            } as unknown,
            sentAt: new Date(),
            failureReason,
          });
          notificationLogs.push(blockedLog);
          continue;
        }

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

        if (sendResult.success && policy.mode === 'USAGE_SUSPENDED') {
          await this.incrementSuspendedDeliveryUsage(userId, policy.windowStart);
        }

        // 6. Log notification
        const notificationLog = await this.notificationRepository.create({
          userId,
          reminderId,
          agentType,
          tier,
          status: (sendResult.success ? 'DELIVERED' : 'FAILED') as NotificationStatus,
          metadata: payload as unknown,
          sentAt: new Date(),
          ...(sendResult.deliveredAt ? { deliveredAt: sendResult.deliveredAt } : {}),
          ...(sendResult.error ? { failureReason: sendResult.error } : {}),
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
          status: 'FAILED' as NotificationStatus,
          metadata: {},
          sentAt: new Date(),
          ...(error instanceof Error ? { failureReason: error.message } : { failureReason: 'Unknown error' }),
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

    const policy = await this.evaluateDeliveryPolicy(userId);
    if (!policy.allowed) {
      const failureReason =
        policy.reason === 'DELIVERY_DISABLED'
          ? 'Delivery disabled for this account'
          : `Usage suspended: allowance reached (resets at ${policy.nextResetAt.toISOString()})`;

      const blockedLog = await this.notificationRepository.create({
        userId,
        reminderId,
        agentType,
        tier: payload.escalationTier,
        status: 'FAILED' as NotificationStatus,
        metadata: {
          blocked: true,
          reason: policy.reason,
          ...(policy.reason === 'USAGE_SUSPENDED_LIMIT_REACHED'
            ? { nextResetAt: policy.nextResetAt.toISOString() }
            : {}),
        } as unknown,
        sentAt: new Date(),
        failureReason,
      });
      return blockedLog;
    }

    // 1. Execute agent
    const sendResult = await this.agentExecutionService.execute(
      agentType,
      userId,
      payload,
    );

    if (sendResult.success && policy.mode === 'USAGE_SUSPENDED') {
      await this.incrementSuspendedDeliveryUsage(userId, policy.windowStart);
    }

    // 2. Log notification
    const notificationLog = await this.notificationRepository.create({
      userId,
      reminderId,
      agentType,
      tier: payload.escalationTier,
      status: (sendResult.success ? 'DELIVERED' : 'FAILED') as NotificationStatus,
      metadata: payload as unknown,
      sentAt: new Date(),
      ...(sendResult.deliveredAt ? { deliveredAt: sendResult.deliveredAt } : {}),
      ...(sendResult.error ? { failureReason: sendResult.error } : {}),
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
      status: 'DELIVERED' as NotificationStatus,
      deliveredAt: new Date(),
    });
  }
}

