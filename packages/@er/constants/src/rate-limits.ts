import type { SubscriptionTier } from '@er/types';

/**
 * Rate limits per subscription tier.
 */
export interface RateLimitConfig {
  requests: number;
  window: '1h' | '1d';
}

export const RATE_LIMITS: Record<SubscriptionTier, RateLimitConfig> = {
  FREE: {
    requests: 100,
    window: '1h',
  },
  PERSONAL: {
    requests: 1000,
    window: '1h',
  },
  PRO: {
    requests: 10000,
    window: '1h',
  },
  FAMILY: {
    requests: 10000,
    window: '1h',
  },
};

/**
 * Get rate limit for a subscription tier.
 */
export function getRateLimit(tier: SubscriptionTier): RateLimitConfig {
  return RATE_LIMITS[tier];
}

/**
 * Convert rate limit window to seconds.
 */
export function getRateLimitWindowSeconds(window: '1h' | '1d'): number {
  switch (window) {
    case '1h':
      return 3600;
    case '1d':
      return 86400;
    default:
      return 3600;
  }
}

