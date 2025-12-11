import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { UserAgentSubscription } from '@er/types';

/**
 * User agent subscription repository.
 * Handles database operations for user agent subscriptions.
 * Implements ISP - only subscription-related data access operations.
 */
@Injectable()
export class UserAgentSubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all subscriptions for a user.
   */
  async findByUser(userId: string): Promise<UserAgentSubscription[]> {
    return this.prisma.userAgentSubscription.findMany({
      where: { userId },
      include: {
        agentDefinition: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find subscription by ID.
   */
  async findById(id: string): Promise<UserAgentSubscription | null> {
    return this.prisma.userAgentSubscription.findUnique({
      where: { id },
      include: {
        agentDefinition: true,
      },
    });
  }

  /**
   * Create a new subscription.
   */
  async create(data: {
    userId: string;
    agentDefinitionId: string;
    isEnabled: boolean;
    configuration: unknown;
    webhookSecret?: string;
  }): Promise<UserAgentSubscription> {
    return this.prisma.userAgentSubscription.create({
      data,
      include: {
        agentDefinition: true,
      },
    });
  }

  /**
   * Update a subscription.
   */
  async update(
    id: string,
    data: {
      isEnabled?: boolean;
      configuration?: unknown;
      webhookSecret?: string;
      lastTestedAt?: Date;
      lastTestResult?: string;
    },
  ): Promise<UserAgentSubscription> {
    return this.prisma.userAgentSubscription.update({
      where: { id },
      data,
      include: {
        agentDefinition: true,
      },
    });
  }

  /**
   * Delete a subscription.
   */
  async delete(id: string): Promise<void> {
    await this.prisma.userAgentSubscription.delete({
      where: { id },
    });
  }

  /**
   * Count subscriptions for a user.
   */
  async countByUser(userId: string): Promise<number> {
    return this.prisma.userAgentSubscription.count({
      where: { userId },
    });
  }

  /**
   * Find subscription by user and agent type.
   */
  async findByUserAndAgentType(
    userId: string,
    agentType: string,
  ): Promise<UserAgentSubscription | null> {
    const subscriptions = await this.prisma.userAgentSubscription.findMany({
      where: {
        userId,
        agentDefinition: {
          type: agentType,
        },
      },
      include: {
        agentDefinition: true,
      },
      take: 1,
    });

    return subscriptions[0] || null;
  }
}

