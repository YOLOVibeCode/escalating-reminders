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
      const escalationState = await this.escalationStateService.start(
        reminder.id,
        reminder.escalationProfileId,
      );

      // Get escalation profile to determine tier 1 delay
      const profile = await this.escalationProfileRepository.findById(
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

      // Queue escalation advancement job if there's a next tier
      if (profile) {
        const tiers = profile.tiers as Array<{
          tierNumber: number;
          delayMinutes: number;
        }>;

        const tier2Config = tiers.find((t) => t.tierNumber === 2);

        if (tier2Config) {
          // Use tier 2's delayMinutes (delay before sending tier 2)
          const delayMs = tier2Config.delayMinutes * 60 * 1000;

          if (delayMs > 0) {
            this.logger.log(
              `Queueing escalation advancement for reminder ${reminder.id} in ${tier2Config.delayMinutes} minutes`,
            );

            await this.queueService.add(
              'high-priority',
              'escalation.advance',
              {
                escalationStateId: escalationState.id,
                reminderId: reminder.id,
              },
              {
                delay: delayMs,
                attempts: 3,
              },
            );
          } else {
            // No delay, queue immediately (will be processed after tier 1 notifications)
            this.logger.log(
              `Queueing immediate escalation advancement for reminder ${reminder.id}`,
            );

            await this.queueService.add(
              'high-priority',
              'escalation.advance',
              {
                escalationStateId: escalationState.id,
                reminderId: reminder.id,
              },
              {
                attempts: 3,
              },
            );
          }
        }
      }

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

