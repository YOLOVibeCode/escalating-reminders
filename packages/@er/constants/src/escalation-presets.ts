import type { EscalationTier } from '@er/interfaces';

/**
 * Preset escalation profiles.
 * These are seeded into the database on initialization.
 */
export interface EscalationPreset {
  id: string;
  name: string;
  description: string;
  tiers: EscalationTier[];
}

export const ESCALATION_PRESETS: EscalationPreset[] = [
  {
    id: 'esc_preset_gentle',
    name: 'Gentle',
    description: 'Gradual escalation over hours. Good for low-stakes reminders.',
    tiers: [
      {
        tierNumber: 1,
        delayMinutes: 0,
        agentIds: ['email'],
        includeTrustedContacts: false,
      },
      {
        tierNumber: 2,
        delayMinutes: 60,
        agentIds: ['email', 'push'],
        includeTrustedContacts: false,
      },
      {
        tierNumber: 3,
        delayMinutes: 180,
        agentIds: ['email', 'push', 'sms'],
        includeTrustedContacts: false,
      },
    ],
  },
  {
    id: 'esc_preset_urgent',
    name: 'Urgent',
    description: 'Rapid escalation within minutes. For time-sensitive tasks.',
    tiers: [
      {
        tierNumber: 1,
        delayMinutes: 0,
        agentIds: ['email', 'sms'],
        includeTrustedContacts: false,
      },
      {
        tierNumber: 2,
        delayMinutes: 5,
        agentIds: ['email', 'sms', 'push'],
        includeTrustedContacts: false,
      },
      {
        tierNumber: 3,
        delayMinutes: 15,
        agentIds: ['email', 'sms', 'push'],
        includeTrustedContacts: false,
      },
      {
        tierNumber: 4,
        delayMinutes: 30,
        agentIds: ['email', 'sms', 'push'],
        includeTrustedContacts: true,
      },
    ],
  },
  {
    id: 'esc_preset_critical',
    name: 'Critical',
    description: 'Immediate multi-channel with social escalation. For health/safety.',
    tiers: [
      {
        tierNumber: 1,
        delayMinutes: 0,
        agentIds: ['email', 'sms', 'push'],
        includeTrustedContacts: false,
      },
      {
        tierNumber: 2,
        delayMinutes: 2,
        agentIds: ['email', 'sms', 'push'],
        includeTrustedContacts: true,
      },
      {
        tierNumber: 3,
        delayMinutes: 5,
        agentIds: ['email', 'sms', 'push'],
        includeTrustedContacts: true,
      },
      {
        tierNumber: 4,
        delayMinutes: 10,
        agentIds: ['email', 'sms', 'push'],
        includeTrustedContacts: true,
      },
      {
        tierNumber: 5,
        delayMinutes: 15,
        agentIds: ['email', 'sms', 'push'],
        includeTrustedContacts: true,
      },
    ],
  },
] as const;

/**
 * Get preset by ID.
 */
export function getEscalationPreset(presetId: string): EscalationPreset | undefined {
  return ESCALATION_PRESETS.find((preset) => preset.id === presetId);
}

