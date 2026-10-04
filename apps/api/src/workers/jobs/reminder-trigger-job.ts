import { Injectable, Logger } from '@nestjs/common';
import { ReminderRepository } from '../../domains/reminders/reminder.repository';
import { QueueService } from '../../infrastructure/queue/queue.service';

/**
 * Reminder trigger job.
 * Finds reminders due for triggering and queues them for processing.
 */
@Injectable()
export class ReminderTriggerJob {
  private readonly logger = new Logger(ReminderTriggerJob.name);

  constructor(
    private readonly reminderRepository: ReminderRepository,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Find due reminders and queue them for processing.
   * This runs every minute via cron.
   */
  async execute(): Promise<void> {
    this.logger.log('Checking for due reminders...');

    try {
      // Find reminders due for triggering (limit 100 per run)
      const dueReminders = await this.reminderRepository.findDueForTrigger(100);

      if (dueReminders.length === 0) {
        this.logger.debug('No reminders due for triggering');
        return;
      }

      this.logger.log(`Found ${dueReminders.length} reminder(s) due for triggering`);

      // Queue each reminder for processing
      for (const reminder of dueReminders) {
        // Consume this occurrence before queueing, so the next scheduler pass does not fire it
        // again, and wake a snoozed reminder so the processor sees it ACTIVE.
        // Schedules are not persisted yet, so every reminder is effectively one-shot.
        await this.reminderRepository.update(reminder.id, {
          status: 'ACTIVE',
          nextTriggerAt: null,
          lastTriggeredAt: new Date(),
        });

        try {
          await this.queueService.add(
            'high-priority',
            'reminder.trigger',
            {
              reminderId: reminder.id,
              userId: reminder.userId,
              title: reminder.title,
              importance: reminder.importance,
              escalationProfileId: reminder.escalationProfileId,
              triggeredAt: new Date(),
            },
            {
              attempts: 3,
              backoffDelay: 2000,
            },
          );
        } catch (error) {
          // Put the occurrence back so the next pass retries it.
          await this.reminderRepository.update(reminder.id, {
            status: reminder.status,
            nextTriggerAt: reminder.nextTriggerAt,
          });
          throw error;
        }

        this.logger.debug(`Queued reminder ${reminder.id} for triggering`);
      }

      this.logger.log(`Successfully queued ${dueReminders.length} reminder(s)`);
    } catch (error) {
      this.logger.error('Error processing reminder trigger job:', error);
      throw error;
    }
  }
}
