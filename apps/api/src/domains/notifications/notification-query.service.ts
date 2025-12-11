/**
 * Notification query service.
 * Handles querying notification logs.
 * Separated per ISP - query operations are distinct from sending.
 */

import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { NotFoundError, ForbiddenError } from '../../common/exceptions';
import type { NotificationLog, PaginatedResult } from '@er/types';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface NotificationFilters {
  reminderId?: string;
  status?: string;
  agentType?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Notification query service.
 * Handles querying notification logs.
 */
@Injectable()
export class NotificationQueryService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    userId: string,
    filters: NotificationFilters = {},
  ): Promise<PaginatedResult<NotificationLog>> {
    const { reminderId, status, agentType, page = 1, pageSize = 20 } = filters;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (reminderId) where.reminderId = reminderId;
    if (status) where.status = status;
    if (agentType) where.agentType = agentType;

    const [items, totalItems] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificationLog.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      items: items as NotificationLog[],
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  async findById(userId: string, notificationId: string): Promise<NotificationLog> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError(`Notification with ID ${notificationId} not found`);
    }
    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this notification');
    }
    return notification;
  }
}


