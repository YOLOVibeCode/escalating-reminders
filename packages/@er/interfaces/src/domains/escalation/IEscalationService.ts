import type { EscalationProfile, EscalationState } from '@er/types';

/**
 * Service interface for escalation profile operations.
 * Follows ISP - only profile management methods.
 */
export interface IEscalationProfileService {
  /**
   * Find all available profiles (user's + presets).
   */
  findAll(userId: string): Promise<EscalationProfile[]>;

  /**
   * Find a profile by ID.
   * @throws {NotFoundError} If profile doesn't exist
   */
  findById(profileId: string): Promise<EscalationProfile>;

  /**
   * Create a custom escalation profile.
   * @throws {ValidationError} If profile is invalid
   * @throws {QuotaExceededError} If user exceeds custom profile limit
   */
  create(userId: string, data: CreateEscalationProfileDto): Promise<EscalationProfile>;

  /**
   * Update a custom escalation profile.
   * @throws {NotFoundError} If profile doesn't exist
   * @throws {ForbiddenError} If user doesn't own profile
   */
  update(userId: string, profileId: string, data: UpdateEscalationProfileDto): Promise<EscalationProfile>;

  /**
   * Delete a custom escalation profile.
   * @throws {NotFoundError} If profile doesn't exist
   * @throws {ForbiddenError} If user doesn't own profile
   */
  delete(userId: string, profileId: string): Promise<void>;
}

/**
 * Service interface for escalation state management.
 * Separated per ISP - state management is distinct from profile management.
 */
export interface IEscalationStateService {
  /**
   * Start escalation for a reminder.
   */
  start(reminderId: string, profileId: string): Promise<EscalationState>;

  /**
   * Advance escalation to next tier.
   * @throws {NotFoundError} If escalation state doesn't exist
   */
  advance(escalationStateId: string): Promise<EscalationState>;

  /**
   * Acknowledge escalation (stop it).
   * @throws {NotFoundError} If escalation state doesn't exist
   */
  acknowledge(escalationStateId: string, acknowledgedBy: string): Promise<void>;

  /**
   * Cancel escalation (due to completion, snooze, etc.).
   * @throws {NotFoundError} If escalation state doesn't exist
   */
  cancel(escalationStateId: string, reason: EscalationCancelReason): Promise<void>;

  /**
   * Find active escalations due for advancement.
   */
  findDueForAdvancement(limit: number): Promise<EscalationState[]>;
}

export interface CreateEscalationProfileDto {
  name: string;
  description?: string;
  tiers: EscalationTier[];
}

export interface UpdateEscalationProfileDto {
  name?: string;
  description?: string;
  tiers?: EscalationTier[];
}

export interface EscalationTier {
  tierNumber: number;
  delayMinutes: number;
  agentIds: string[];
  includeTrustedContacts: boolean;
  message?: string;
}

export type EscalationCancelReason = 'acknowledged' | 'completed' | 'snoozed' | 'deleted';

