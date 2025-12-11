import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../../domains/notifications/notification.service';

/**
 * Notification processor.
 * Processes notification sending jobs from the queue.
 */
@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Process a notification send job.
   * This is called by the worker when a notification.send job is processed.
   */
  async processNotificationSend(data: {
    reminderId: string;
    userId: string;
    escalationTier: number;
  }): Promise<void> {
    this.logger.log(
      `Processing notification send: reminder=${data.reminderId}, tier=${data.escalationTier}`,
    );

    try {
      // Send notifications for this escalation tier
      const notificationLogs = await this.notificationService.sendTierNotifications(
        data.reminderId,
        data.userId,
        data.escalationTier,
      );

      this.logger.log(
        `Sent ${notificationLogs.length} notifications for reminder ${data.reminderId}, tier ${data.escalationTier}`,
      );

      // Log results
      const successCount = notificationLogs.filter(
        (log) => log.status === 'DELIVERED',
      ).length;
      const failureCount = notificationLogs.length - successCount;

      if (failureCount > 0) {
        this.logger.warn(
          `${failureCount} notification(s) failed for reminder ${data.reminderId}, tier ${data.escalationTier}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing notification send for reminder ${data.reminderId}, tier ${data.escalationTier}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}

