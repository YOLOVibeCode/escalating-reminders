import type { SubscriptionTier } from '@er/types';

/**
 * Subscription tier configuration.
 * Single source of truth for tier limits and pricing.
 */
export interface SubscriptionTierConfig {
  id: SubscriptionTier;
  name: string;
  price: number; // in cents
  limits: SubscriptionLimits;
}

export interface SubscriptionLimits {
  maxReminders: number; // -1 for unlimited
  maxAgents: number; // -1 for unlimited
  maxTrustedContacts: number; // -1 for unlimited
  emailWatchers: boolean;
  calendarSync: boolean;
  socialEscalation: boolean;
  sharedReminders?: boolean;
}

export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'FREE' as SubscriptionTier,
    name: 'Free',
    price: 0,
    limits: {
      maxReminders: 3,
      maxAgents: 1,
      maxTrustedContacts: 0,
      emailWatchers: false,
      calendarSync: false,
      socialEscalation: false,
    },
  },
  PERSONAL: {
    id: 'PERSONAL' as SubscriptionTier,
    name: 'Personal',
    price: 500, // $5.00
    limits: {
      maxReminders: 20,
      maxAgents: 5,
      maxTrustedContacts: 2,
      emailWatchers: true,
      calendarSync: true,
      socialEscalation: false,
    },
  },
  PRO: {
    id: 'PRO' as SubscriptionTier,
    name: 'Pro',
    price: 1500, // $15.00
    limits: {
      maxReminders: -1, // unlimited
      maxAgents: -1, // unlimited
      maxTrustedContacts: 10,
      emailWatchers: true,
      calendarSync: true,
      socialEscalation: true,
    },
  },
  FAMILY: {
    id: 'FAMILY' as SubscriptionTier,
    name: 'Family',
    price: 2500, // $25.00
    limits: {
      maxReminders: -1, // unlimited
      maxAgents: -1, // unlimited
      maxTrustedContacts: 20,
      emailWatchers: true,
      calendarSync: true,
      socialEscalation: true,
      sharedReminders: true,
    },
  },
} as const satisfies Record<string, SubscriptionTierConfig>;

export type SubscriptionTierId = keyof typeof SUBSCRIPTION_TIERS;

/**
 * Get subscription tier configuration by ID.
 */
export function getSubscriptionTier(tier: SubscriptionTier): SubscriptionTierConfig {
  const config = SUBSCRIPTION_TIERS[tier];
  if (!config) {
    throw new Error(`Invalid subscription tier: ${tier}`);
  }
  return config;
}

/**
 * Check if a tier meets or exceeds a required tier.
 */
export function tierMeetsRequirement(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier,
): boolean {
  const tierOrder: SubscriptionTier[] = ['FREE', 'PERSONAL', 'PRO', 'FAMILY'];
  const userIndex = tierOrder.indexOf(userTier);
  const requiredIndex = tierOrder.indexOf(requiredTier);
  return userIndex >= requiredIndex;
}

