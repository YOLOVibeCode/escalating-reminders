import { Injectable, Logger } from '@nestjs/common';
import { QueueService } from '../../infrastructure/queue/queue.service';
import { EscalationStateService } from '../../domains/escalation/escalation-state.service';

/**
 * Escalation advancement job.
 * Finds escalations due for advancement and queues them.
 */
@Injectable()
export class EscalationAdvancementJob {
  private readonly logger = new Logger(EscalationAdvancementJob.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly escalationStateService: EscalationStateService,
  ) {}

  /**
   * Execute the escalation advancement job.
   * Finds escalations due for advancement and queues them.
   */
  async execute(): Promise<void> {
    this.logger.log('Checking for escalations due for advancement...');

    try {
      // Find escalations due for advancement (up to 50 per run)
      const dueEscalations = await this.escalationStateService.findDueForAdvancement(50);

      if (dueEscalations.length === 0) {
        this.logger.debug('No escalations due for advancement');
        return;
      }

      // Queue advancement jobs
      for (const escalation of dueEscalations) {
        this.logger.log(
          `Queueing escalation.advance job for reminder: ${escalation.reminderId}`,
        );

        await this.queueService.add(
          'high-priority',
          'escalation.advance',
          {
            escalationStateId: escalation.id,
            reminderId: escalation.reminderId,
          },
          {
            attempts: 3,
            backoffDelay: 2000,
          },
        );
      }

      this.logger.log(`Queued ${dueEscalations.length} escalation.advance jobs.`);
    } catch (error) {
      this.logger.error('Error in escalation advancement job:', error);
      throw error;
    }
  }
}

