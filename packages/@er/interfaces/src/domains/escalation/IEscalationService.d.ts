import type { EscalationProfile, EscalationState } from '@er/types';
export interface IEscalationProfileService {
    findAll(userId: string): Promise<EscalationProfile[]>;
    findById(profileId: string): Promise<EscalationProfile>;
    create(userId: string, data: CreateEscalationProfileDto): Promise<EscalationProfile>;
    update(userId: string, profileId: string, data: UpdateEscalationProfileDto): Promise<EscalationProfile>;
    delete(userId: string, profileId: string): Promise<void>;
}
export interface IEscalationStateService {
    start(reminderId: string, profileId: string): Promise<EscalationState>;
    advance(escalationStateId: string): Promise<EscalationState>;
    acknowledge(escalationStateId: string, acknowledgedBy: string): Promise<void>;
    cancel(escalationStateId: string, reason: EscalationCancelReason): Promise<void>;
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
//# sourceMappingURL=IEscalationService.d.ts.map