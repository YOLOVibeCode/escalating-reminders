import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { EscalationState, EscalationStatus } from '@er/types';

/**
 * Escalation state repository.
 * Handles database operations for escalation states.
 * Implements ISP - only state-related data access operations.
 */
@Injectable()
export class EscalationStateRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new escalation state.
   */
  async create(data: {
    reminderId: string;
    profileId: string;
    currentTier: number;
    startedAt: Date;
    status: EscalationStatus;
  }): Promise<EscalationState> {
    return this.prisma.escalationState.create({
      data: {
        reminderId: data.reminderId,
        profileId: data.profileId,
        currentTier: data.currentTier,
        startedAt: data.startedAt,
        status: data.status,
      },
    });
  }

  /**
   * Find escalation state by reminder ID.
   */
  async findByReminderId(reminderId: string): Promise<EscalationState | null> {
    return this.prisma.escalationState.findUnique({
      where: { reminderId },
    });
  }

  /**
   * Update an escalation state.
   */
  async update(
    id: string,
    data: {
      currentTier?: number;
      lastEscalatedAt?: Date;
      acknowledgedAt?: Date;
      acknowledgedBy?: string;
      status?: EscalationStatus;
    },
  ): Promise<EscalationState> {
    return this.prisma.escalationState.update({
      where: { id },
      data: {
        ...(data.currentTier !== undefined ? { currentTier: data.currentTier } : {}),
        ...(data.lastEscalatedAt !== undefined ? { lastEscalatedAt: data.lastEscalatedAt } : {}),
        ...(data.acknowledgedAt !== undefined ? { acknowledgedAt: data.acknowledgedAt } : {}),
        ...(data.acknowledgedBy !== undefined ? { acknowledgedBy: data.acknowledgedBy } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
  }

  /**
   * Find active escalation states due for advancement.
   * Note: Actual tier delay checking is done in the service layer.
   */
  async findDueForAdvancement(limit: number): Promise<EscalationState[]> {
    return this.prisma.escalationState.findMany({
      where: {
        status: 'ACTIVE' as EscalationStatus,
      },
      take: limit,
      orderBy: { lastEscalatedAt: 'asc' },
    });
  }

  /**
   * Delete escalation state (used when reminder is completed/deleted).
   */
  async delete(id: string): Promise<void> {
    await this.prisma.escalationState.delete({
      where: { id },
    });
  }
}

