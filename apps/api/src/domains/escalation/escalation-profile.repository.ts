import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { EscalationProfile } from '@er/types';

/**
 * Escalation profile repository.
 * Handles database operations for escalation profiles.
 * Implements ISP - only profile-related data access operations.
 */
@Injectable()
export class EscalationProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all profiles available to a user (user's custom + system presets).
   */
  async findAll(userId: string): Promise<EscalationProfile[]> {
    return this.prisma.escalationProfile.findMany({
      where: {
        OR: [{ userId }, { isPreset: true }],
      },
      orderBy: [{ isPreset: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Find profile by ID.
   */
  async findById(id: string): Promise<EscalationProfile | null> {
    return this.prisma.escalationProfile.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new escalation profile.
   */
  async create(data: {
    userId: string;
    name: string;
    description?: string;
    isPreset: boolean;
    tiers: unknown;
  }): Promise<EscalationProfile> {
    return this.prisma.escalationProfile.create({
      data: {
        userId: data.userId,
        name: data.name,
        ...(data.description !== undefined ? { description: data.description } : {}),
        isPreset: data.isPreset,
        tiers: data.tiers as any,
      },
    });
  }

  /**
   * Update an escalation profile.
   */
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      tiers?: unknown;
    },
  ): Promise<EscalationProfile> {
    return this.prisma.escalationProfile.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.tiers !== undefined ? { tiers: data.tiers as any } : {}),
      },
    });
  }

  /**
   * Delete an escalation profile.
   */
  async delete(id: string): Promise<void> {
    await this.prisma.escalationProfile.delete({
      where: { id },
    });
  }

  /**
   * Count custom profiles for a user.
   */
  async countByUser(userId: string): Promise<number> {
    const profiles = await this.prisma.escalationProfile.findMany({
      where: { userId, isPreset: false },
      select: { id: true },
    });
    return profiles.length;
  }
}

