import type { SubscriptionTier } from '@er/types';
export interface RateLimitConfig {
    requests: number;
    window: '1h' | '1d';
}
export declare const RATE_LIMITS: Record<SubscriptionTier, RateLimitConfig>;
export declare function getRateLimit(tier: SubscriptionTier): RateLimitConfig;
export declare function getRateLimitWindowSeconds(window: '1h' | '1d'): number;
//# sourceMappingURL=rate-limits.d.ts.map