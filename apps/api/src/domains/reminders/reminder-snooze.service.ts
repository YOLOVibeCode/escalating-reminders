/**
 * Reminder snooze service.
 * Implements IReminderSnoozeService interface.
 * Handles reminder snooze operations.
 */

import { Injectable } from '@nestjs/common';
import { ReminderRepository } from './reminder.repository';
import { parseNaturalLanguageDateTime } from '@er/utils';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/exceptions';
import type { IReminderSnoozeService } from '@er/interfaces';
import type { ReminderSnooze } from '@er/types';
import { PrismaService } from '../../infrastructure/database/prisma.service';

/**
 * Reminder snooze service.
 * Implements IReminderSnoozeService interface.
 */
@Injectable()
export class ReminderSnoozeService implements IReminderSnoozeService {
  constructor(
    private readonly reminderRepository: ReminderRepository,
    private readonly prisma: PrismaService,
  ) {}

  async snooze(userId: string, reminderId: string, duration: string): Promise<ReminderSnooze> {
    // 1. Verify reminder exists and user owns it
    const reminder = await this.reminderRepository.findById(reminderId);
    if (!reminder) {
      throw new NotFoundError(`Reminder with ID ${reminderId} not found`);
    }
    if (reminder.userId !== userId) {
      throw new ForbiddenError('You do not have permission to snooze this reminder');
    }

    // 2. Parse natural language duration
    const parsed = parseNaturalLanguageDateTime(duration);
    if (!parsed || !parsed.isValid || !parsed.date) {
      throw new ValidationError(`Unable to parse duration: "${duration}"`);
    }

    const snoozeUntil = parsed.date;

    // 3. Create snooze record
    const snooze = await this.prisma.reminderSnooze.create({
      data: {
        reminderId,
        snoozeUntil,
        originalInput: duration,
        reason: null,
      },
    });

    // 4. Update reminder status and nextTriggerAt
    await this.reminderRepository.update(reminderId, {
      status: 'SNOOZED',
      nextTriggerAt: snoozeUntil,
    });

    return snooze as ReminderSnooze;
  }

  async cancelSnooze(userId: string, reminderId: string): Promise<void> {
    // 1. Verify reminder exists and user owns it
    const reminder = await this.reminderRepository.findById(reminderId);
    if (!reminder) {
      throw new NotFoundError(`Reminder with ID ${reminderId} not found`);
    }
    if (reminder.userId !== userId) {
      throw new ForbiddenError('You do not have permission to cancel snooze for this reminder');
    }

    // 2. Find active snooze
    const snooze = await this.prisma.reminderSnooze.findFirst({
      where: {
        reminderId,
        snoozeUntil: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!snooze) {
      throw new NotFoundError(`No active snooze found for reminder ${reminderId}`);
    }

    // 3. Delete snooze record
    await this.prisma.reminderSnooze.delete({
      where: { id: snooze.id },
    });

    // 4. Update reminder status back to ACTIVE
    // Note: nextTriggerAt should be recalculated based on schedule
    // For now, we'll set it to a reasonable default
    await this.reminderRepository.update(reminderId, {
      status: 'ACTIVE',
      // TODO: Recalculate nextTriggerAt based on schedule
    });
  }
}

