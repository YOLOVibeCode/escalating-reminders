import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { NotificationLog } from '@er/types';

/**
 * Notification repository.
 * Handles database operations for notification logs.
 * Implements ISP - only notification log data access operations.
 */
@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a notification log entry.
   */
  async create(data: {
    userId: string;
    reminderId: string;
    agentType: string;
    tier: number;
    status: string;
    metadata?: unknown;
    sentAt?: Date;
    deliveredAt?: Date;
    failureReason?: string;
  }): Promise<NotificationLog> {
    return this.prisma.notificationLog.create({
      data: {
        userId: data.userId,
        reminderId: data.reminderId,
        agentType: data.agentType,
        tier: data.tier,
        status: data.status,
        metadata: data.metadata || {},
        sentAt: data.sentAt,
        deliveredAt: data.deliveredAt,
        failureReason: data.failureReason,
      },
    });
  }

  /**
   * Update a notification log entry.
   */
  async update(
    id: string,
    data: {
      status?: string;
      sentAt?: Date;
      deliveredAt?: Date;
      failureReason?: string;
      metadata?: unknown;
    },
  ): Promise<NotificationLog> {
    return this.prisma.notificationLog.update({
      where: { id },
      data,
    });
  }

  /**
   * Find notifications by reminder ID.
   */
  async findByReminderId(reminderId: string): Promise<NotificationLog[]> {
    return this.prisma.notificationLog.findMany({
      where: { reminderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find notification by ID.
   */
  async findById(id: string): Promise<NotificationLog | null> {
    return this.prisma.notificationLog.findUnique({
      where: { id },
    });
  }
}

