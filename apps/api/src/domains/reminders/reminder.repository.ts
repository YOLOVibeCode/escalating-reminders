import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { Reminder, ReminderFilters, PaginatedResult } from '@er/types';
import type {
  IReminderRepository,
  ReminderCreateData,
  ReminderUpdateData,
} from '@er/interfaces';

/**
 * Reminder repository.
 * Handles database operations for reminders.
 * Implements ISP - only reminder-related data access operations.
 */
@Injectable()
export class ReminderRepository implements IReminderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ReminderCreateData): Promise<Reminder> {
    return this.prisma.reminder.create({
      data,
    });
  }

  async findById(id: string): Promise<Reminder | null> {
    return this.prisma.reminder.findUnique({
      where: { id },
    });
  }

  async findByUserId(
    userId: string,
    filters: ReminderFilters,
  ): Promise<PaginatedResult<Reminder>> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Record<string, unknown> = { userId };
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.importance) {
      where.importance = filters.importance;
    }

    // Get items and total count
    const [items, totalItems] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.reminder.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  async update(id: string, data: ReminderUpdateData): Promise<Reminder> {
    return this.prisma.reminder.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.reminder.delete({
      where: { id },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.reminder.count({
      where: { userId },
    });
  }

  async findDueForTrigger(limit: number): Promise<Reminder[]> {
    const now = new Date();
    return this.prisma.reminder.findMany({
      where: {
        status: 'ACTIVE',
        nextTriggerAt: {
          lte: now,
        },
      },
      take: limit,
      orderBy: { nextTriggerAt: 'asc' },
    });
  }
}

