import { Injectable, Logger } from '@nestjs/common';
import { EscalationStateService } from '../../domains/escalation/escalation-state.service';
import { EscalationProfileRepository } from '../../domains/escalation/escalation-profile.repository';
import { ReminderRepository } from '../../domains/reminders/reminder.repository';
import { QueueService } from '../../infrastructure/queue/queue.service';
import type { EscalationState, EscalationProfile } from '@er/types';

/**
 * Escalation processor.
 * Processes escalation advancement jobs from the queue.
 * Advances escalations to the next tier and queues notifications.
 */
@Injectable()
export class EscalationProcessor {
  private readonly logger = new Logger(EscalationProcessor.name);

  constructor(
    private readonly escalationStateService: EscalationStateService,
    private readonly escalationProfileRepository: EscalationProfileRepository,
    private readonly reminderRepository: ReminderRepository,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Process escalation advancement.
   * This is called by the worker when an escalation.advance job is processed.
   */
  async processEscalationAdvancement(data: {
    escalationStateId: string;
    reminderId: string;
  }): Promise<void> {
    this.logger.log(
      `Processing escalation advancement: state=${data.escalationStateId}, reminder=${data.reminderId}`,
    );

    try {
      // 1. Advance escalation to next tier
      const updatedState = await this.escalationStateService.advance(
        data.escalationStateId,
      );

      // 2. Check if escalation expired (reached max tier)
      if (updatedState.status === 'EXPIRED') {
        this.logger.log(
          `Escalation expired for reminder ${data.reminderId} - reached maximum tier`,
        );
        return;
      }

      // 3. Get escalation profile to determine next tier agents
      const profile = await this.escalationProfileRepository.findById(
        updatedState.profileId,
      );
      if (!profile) {
        this.logger.error(
          `Escalation profile ${updatedState.profileId} not found`,
        );
        return;
      }

      const tiers = profile.tiers as Array<{
        tierNumber: number;
        agentIds: string[];
        delayMinutes: number;
      }>;

      const nextTierConfig = tiers.find(
        (t) => t.tierNumber === updatedState.currentTier,
      );

      if (!nextTierConfig) {
        this.logger.warn(
          `Tier ${updatedState.currentTier} not found in profile ${profile.id}`,
        );
        return;
      }

      // 4. Get reminder to get userId
      const reminder = await this.reminderRepository.findById(data.reminderId);
      if (!reminder) {
        this.logger.error(`Reminder ${data.reminderId} not found`);
        return;
      }

      // 5. Queue notification job for next tier
      this.logger.log(
        `Queueing notifications for reminder ${data.reminderId}, tier ${updatedState.currentTier}`,
      );

      await this.queueService.add(
        'default',
        'notification.send',
        {
          reminderId: data.reminderId,
          userId: reminder.userId,
          escalationTier: updatedState.currentTier,
        },
        {
          attempts: 3,
          backoffDelay: 2000,
        },
      );

      // 6. If there's a delay before next tier, queue advancement job
      const nextTier = tiers.find(
        (t) => t.tierNumber === updatedState.currentTier + 1,
      );

      if (nextTier && nextTier.delayMinutes > 0) {
        const delayMs = nextTier.delayMinutes * 60 * 1000;
        this.logger.log(
          `Queueing escalation advancement for reminder ${data.reminderId} in ${nextTier.delayMinutes} minutes`,
        );

        await this.queueService.add(
          'high-priority',
          'escalation.advance',
          {
            escalationStateId: updatedState.id,
            reminderId: data.reminderId,
          },
          {
            delay: delayMs,
            attempts: 3,
          },
        );
      } else if (nextTier) {
        // No delay, advance immediately
        this.logger.log(
          `No delay for next tier, queueing immediate advancement for reminder ${data.reminderId}`,
        );

        await this.queueService.add(
          'high-priority',
          'escalation.advance',
          {
            escalationStateId: updatedState.id,
            reminderId: data.reminderId,
          },
          {
            attempts: 3,
          },
        );
      } else {
        this.logger.log(
          `No more tiers for reminder ${data.reminderId} - escalation completed`,
        );
      }

      this.logger.log(
        `Successfully processed escalation advancement for reminder ${data.reminderId}, now at tier ${updatedState.currentTier}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing escalation advancement for reminder ${data.reminderId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}

