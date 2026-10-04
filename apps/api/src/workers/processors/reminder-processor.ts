import { Injectable, Logger } from '@nestjs/common';
import { ReminderRepository } from '../../domains/reminders/reminder.repository';
import { EscalationStateService } from '../../domains/escalation/escalation-state.service';
import { EscalationProfileRepository } from '../../domains/escalation/escalation-profile.repository';
import { EventBusService } from '../../infrastructure/events/event-bus.service';
import { QueueService } from '../../infrastructure/queue/queue.service';

/**
 * Reminder processor.
 * Processes reminder trigger jobs from the queue.
 */
@Injectable()
export class ReminderProcessor {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(
    private readonly reminderRepository: ReminderRepository,
    private readonly escalationStateService: EscalationStateService,
    private readonly escalationProfileRepository: EscalationProfileRepository,
    private readonly eventBus: EventBusService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Process a reminder trigger job.
   * This is called by the worker when a reminder.trigger job is processed.
   */
  async processReminderTrigger(data: {
    reminderId: string;
    userId: string;
    title: string;
    importance: string;
    escalationProfileId: string;
    triggeredAt: Date;
  }): Promise<void> {
    this.logger.log(`Processing reminder trigger: ${data.reminderId}`);

    try {
      // Verify reminder still exists and is active
      const reminder = await this.reminderRepository.findById(data.reminderId);

      if (!reminder) {
        this.logger.warn(`Reminder ${data.reminderId} not found, skipping`);
        return;
      }

      if (reminder.status !== 'ACTIVE') {
        this.logger.warn(
          `Reminder ${data.reminderId} is not ACTIVE (status: ${reminder.status}), skipping`,
        );
        return;
      }

      // Start escalation if not already started
      await this.escalationStateService.start(
        reminder.id,
        reminder.escalationProfileId,
      );

      // Emit reminder.triggered event
      await this.eventBus.publish({
        type: 'reminder.triggered',
        payload: {
          reminderId: reminder.id,
          userId: reminder.userId,
          title: reminder.title,
          importance: reminder.importance,
          escalationProfileId: reminder.escalationProfileId,
          triggeredAt: new Date(),
        },
        metadata: {
          eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          source: 'ReminderProcessor',
        },
      });

      // Queue notification job (tier 1 - first notification)
      await this.queueService.add(
        'default',
        'notification.send',
        {
          reminderId: reminder.id,
          userId: reminder.userId,
          escalationTier: 1,
        },
        {
          attempts: 3,
          backoffDelay: 2000,
        },
      );

      // Tier 2 onward is queued by EscalationAdvancementJob once each tier's delay has passed.

      this.logger.log(`Successfully processed reminder trigger: ${data.reminderId}`);
    } catch (error) {
      this.logger.error(
        `Error processing reminder trigger ${data.reminderId}:`,
        error,
      );
      throw error;
    }
  }
}

