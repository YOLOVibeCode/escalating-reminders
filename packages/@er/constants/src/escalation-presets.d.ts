import type { EscalationTier } from '@er/interfaces';
export interface EscalationPreset {
    id: string;
    name: string;
    description: string;
    tiers: EscalationTier[];
}
export declare const ESCALATION_PRESETS: EscalationPreset[];
export declare function getEscalationPreset(presetId: string): EscalationPreset | undefined;
//# sourceMappingURL=escalation-presets.d.ts.map