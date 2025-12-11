/**
 * Reminder completion service.
 * Implements IReminderCompletionService interface.
 * Handles reminder completion and acknowledgment operations.
 */

import { Injectable } from '@nestjs/common';
import { ReminderRepository } from './reminder.repository';
import { EscalationStateService } from '../escalation/escalation-state.service';
import { NotFoundError, ForbiddenError } from '../../common/exceptions';
import type { IReminderCompletionService } from '@er/interfaces';
import type { CompletionSource } from '@er/types';
import { PrismaService } from '../../infrastructure/database/prisma.service';

/**
 * Reminder completion service.
 * Implements IReminderCompletionService interface.
 */
@Injectable()
export class ReminderCompletionService implements IReminderCompletionService {
  constructor(
    private readonly reminderRepository: ReminderRepository,
    private readonly escalationStateService: EscalationStateService,
    private readonly prisma: PrismaService,
  ) {}

  async complete(userId: string, reminderId: string, source: CompletionSource): Promise<void> {
    // 1. Verify reminder exists and user owns it
    const reminder = await this.reminderRepository.findById(reminderId);
    if (!reminder) {
      throw new NotFoundError(`Reminder with ID ${reminderId} not found`);
    }
    if (reminder.userId !== userId) {
      throw new ForbiddenError('You do not have permission to complete this reminder');
    }

    // 2. Update reminder status
    await this.reminderRepository.update(reminderId, {
      status: 'COMPLETED',
      completedAt: new Date(),
    });

    // 3. Update escalation state if it exists
    const escalationState = await this.prisma.escalationState.findUnique({
      where: { reminderId },
    });

    if (escalationState && escalationState.status === 'ACTIVE') {
      await this.prisma.escalationState.update({
        where: { reminderId },
        data: {
          status: 'COMPLETED',
        },
      });
    }
  }

  async acknowledge(userId: string, reminderId: string): Promise<void> {
    // 1. Verify reminder exists and user owns it
    const reminder = await this.reminderRepository.findById(reminderId);
    if (!reminder) {
      throw new NotFoundError(`Reminder with ID ${reminderId} not found`);
    }
    if (reminder.userId !== userId) {
      throw new ForbiddenError('You do not have permission to acknowledge this reminder');
    }

    // 2. Update escalation state to acknowledged
    const escalationState = await this.prisma.escalationState.findUnique({
      where: { reminderId },
    });

    if (escalationState && escalationState.status === 'ACTIVE') {
      await this.prisma.escalationState.update({
        where: { reminderId },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
        },
      });
    }
  }
}


