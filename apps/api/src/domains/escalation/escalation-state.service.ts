import { Injectable } from '@nestjs/common';
import { EscalationStateRepository } from './escalation-state.repository';
import { EscalationProfileRepository } from './escalation-profile.repository';
import { NotFoundError } from '../../common/exceptions';
import type { IEscalationStateService } from '@er/interfaces';
import type { EscalationState, EscalationCancelReason } from '@er/types';

/**
 * Escalation state service.
 * Implements IEscalationStateService interface.
 * Handles escalation state business logic.
 */
@Injectable()
export class EscalationStateService implements IEscalationStateService {
  constructor(
    private readonly stateRepository: EscalationStateRepository,
    private readonly profileRepository: EscalationProfileRepository,
  ) {}

  async start(reminderId: string, profileId: string): Promise<EscalationState> {
    // Verify profile exists
    const profile = await this.profileRepository.findById(profileId);
    if (!profile) {
      throw new NotFoundError(`Escalation profile with ID ${profileId} not found`);
    }

    // Check if escalation already exists
    const existing = await this.stateRepository.findByReminderId(reminderId);
    if (existing) {
      return existing;
    }

    // Create new escalation state (starts at tier 1)
    return this.stateRepository.create({
      reminderId,
      profileId,
      currentTier: 1,
      startedAt: new Date(),
      status: 'ACTIVE',
    });
  }

  async advance(escalationStateId: string): Promise<EscalationState> {
    // Find state by reminder ID (since stateId is reminderId)
    const state = await this.stateRepository.findByReminderId(escalationStateId);
    if (!state) {
      throw new NotFoundError(
        `Escalation state for reminder ${escalationStateId} not found`,
      );
    }

    // Get profile to check max tiers
    const profile = await this.profileRepository.findById(state.profileId);
    if (!profile) {
      throw new NotFoundError(`Escalation profile not found`);
    }

    const tiers = profile.tiers as Array<{ tierNumber: number }>;
    const maxTier = Math.max(...tiers.map((t) => t.tierNumber));

    // Check if already at max tier
    if (state.currentTier >= maxTier) {
      // Mark as expired
      return this.stateRepository.update(state.id, {
        status: 'EXPIRED',
      });
    }

    // Advance to next tier
    return this.stateRepository.update(state.id, {
      currentTier: state.currentTier + 1,
      lastEscalatedAt: new Date(),
    });
  }

  async acknowledge(
    escalationStateId: string,
    acknowledgedBy: string,
  ): Promise<void> {
    const state = await this.stateRepository.findByReminderId(escalationStateId);
    if (!state) {
      throw new NotFoundError(
        `Escalation state for reminder ${escalationStateId} not found`,
      );
    }

    await this.stateRepository.update(state.id, {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
      acknowledgedBy,
    });
  }

  async cancel(
    escalationStateId: string,
    reason: EscalationCancelReason,
  ): Promise<void> {
    const state = await this.stateRepository.findByReminderId(escalationStateId);
    if (!state) {
      throw new NotFoundError(
        `Escalation state for reminder ${escalationStateId} not found`,
      );
    }

    let status: string;
    switch (reason) {
      case 'completed':
        status = 'COMPLETED';
        break;
      case 'acknowledged':
        status = 'ACKNOWLEDGED';
        break;
      case 'snoozed':
      case 'deleted':
        status = 'ACTIVE'; // Keep active, will be cleaned up
        break;
      default:
        status = 'ACTIVE';
    }

    await this.stateRepository.update(state.id, {
      status,
    });
  }

  async findDueForAdvancement(limit: number): Promise<EscalationState[]> {
    // Get all active escalations
    const states = await this.stateRepository.findDueForAdvancement(limit);

    // Filter by actual tier delay (business logic)
    const now = new Date();
    const dueStates: EscalationState[] = [];

    for (const state of states) {
      const profile = await this.profileRepository.findById(state.profileId);
      if (!profile) continue;

      const tiers = profile.tiers as Array<{
        tierNumber: number;
        delayMinutes: number;
      }>;

      const currentTierConfig = tiers.find(
        (t) => t.tierNumber === state.currentTier,
      );
      if (!currentTierConfig) continue;

      // Calculate when this tier should advance
      const lastEscalatedAt = state.lastEscalatedAt || state.startedAt;
      const advanceAt = new Date(
        lastEscalatedAt.getTime() + currentTierConfig.delayMinutes * 60 * 1000,
      );

      if (advanceAt <= now) {
        dueStates.push(state);
      }
    }

    return dueStates;
  }
}

