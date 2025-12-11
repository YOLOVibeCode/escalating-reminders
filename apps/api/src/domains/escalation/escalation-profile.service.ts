import { Injectable } from '@nestjs/common';
import { EscalationProfileRepository } from './escalation-profile.repository';
import { AuthRepository } from '../auth/auth.repository';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/exceptions';
import type { IEscalationProfileService } from '@er/interfaces';
import type {
  EscalationProfile,
  CreateEscalationProfileDto,
  UpdateEscalationProfileDto,
  EscalationTier,
} from '@er/types';

/**
 * Escalation profile service.
 * Implements IEscalationProfileService interface.
 * Handles escalation profile business logic.
 */
@Injectable()
export class EscalationProfileService implements IEscalationProfileService {
  constructor(
    private readonly repository: EscalationProfileRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async findAll(userId: string): Promise<EscalationProfile[]> {
    return this.repository.findAll(userId);
  }

  async findById(profileId: string): Promise<EscalationProfile> {
    const profile = await this.repository.findById(profileId);

    if (!profile) {
      throw new NotFoundError(
        `Escalation profile with ID ${profileId} not found`,
      );
    }

    return profile;
  }

  async create(
    userId: string,
    data: CreateEscalationProfileDto,
  ): Promise<EscalationProfile> {
    // Validate tiers
    if (!data.tiers || data.tiers.length === 0) {
      throw new ValidationError('Escalation profile must have at least one tier');
    }

    // Validate tier numbers are sequential starting from 1
    const tierNumbers = data.tiers.map((t) => t.tierNumber).sort((a, b) => a - b);
    for (let i = 0; i < tierNumbers.length; i++) {
      if (tierNumbers[i] !== i + 1) {
        throw new ValidationError(
          'Tier numbers must be sequential starting from 1',
        );
      }
    }

    // Validate each tier
    for (const tier of data.tiers) {
      if (tier.delayMinutes < 0) {
        throw new ValidationError('Tier delayMinutes must be >= 0');
      }
      if (!tier.agentIds || tier.agentIds.length === 0) {
        throw new ValidationError('Tier must have at least one agent');
      }
    }

    // Check user exists
    const user = await this.authRepository.findByIdWithSubscription(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Create profile
    return this.repository.create({
      userId,
      name: data.name,
      description: data.description,
      isPreset: false,
      tiers: data.tiers as unknown,
    });
  }

  async update(
    userId: string,
    profileId: string,
    data: UpdateEscalationProfileDto,
  ): Promise<EscalationProfile> {
    // Check ownership
    const profile = await this.findById(profileId);

    if (profile.userId !== userId) {
      throw new ForbiddenError(
        'You do not have permission to update this profile',
      );
    }

    if (profile.isPreset) {
      throw new ForbiddenError('Cannot update preset profiles');
    }

    // Validate tiers if provided
    if (data.tiers) {
      if (data.tiers.length === 0) {
        throw new ValidationError('Escalation profile must have at least one tier');
      }

      const tierNumbers = data.tiers.map((t) => t.tierNumber).sort((a, b) => a - b);
      for (let i = 0; i < tierNumbers.length; i++) {
        if (tierNumbers[i] !== i + 1) {
          throw new ValidationError(
            'Tier numbers must be sequential starting from 1',
          );
        }
      }
    }

    // Update profile
    return this.repository.update(profileId, {
      name: data.name,
      description: data.description,
      tiers: data.tiers as unknown,
    });
  }

  async delete(userId: string, profileId: string): Promise<void> {
    // Check ownership
    const profile = await this.findById(profileId);

    if (profile.userId !== userId) {
      throw new ForbiddenError(
        'You do not have permission to delete this profile',
      );
    }

    if (profile.isPreset) {
      throw new ForbiddenError('Cannot delete preset profiles');
    }

    // Delete profile
    await this.repository.delete(profileId);
  }
}

