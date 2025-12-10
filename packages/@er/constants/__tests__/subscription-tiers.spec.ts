import { SUBSCRIPTION_TIERS, getSubscriptionTier, tierMeetsRequirement } from '../src/subscription-tiers';
import type { SubscriptionTier } from '@er/types';

describe('SubscriptionTiers', () => {
  describe('SUBSCRIPTION_TIERS', () => {
    it('should have all tier configurations', () => {
      expect(SUBSCRIPTION_TIERS.FREE).toBeDefined();
      expect(SUBSCRIPTION_TIERS.PERSONAL).toBeDefined();
      expect(SUBSCRIPTION_TIERS.PRO).toBeDefined();
      expect(SUBSCRIPTION_TIERS.FAMILY).toBeDefined();
    });

    it('should have correct FREE tier limits', () => {
      const free = SUBSCRIPTION_TIERS.FREE;
      expect(free.price).toBe(0);
      expect(free.limits.maxReminders).toBe(3);
      expect(free.limits.maxAgents).toBe(1);
      expect(free.limits.maxTrustedContacts).toBe(0);
      expect(free.limits.emailWatchers).toBe(false);
      expect(free.limits.calendarSync).toBe(false);
      expect(free.limits.socialEscalation).toBe(false);
    });

    it('should have correct PRO tier limits', () => {
      const pro = SUBSCRIPTION_TIERS.PRO;
      expect(pro.price).toBe(1500);
      expect(pro.limits.maxReminders).toBe(-1); // unlimited
      expect(pro.limits.maxAgents).toBe(-1); // unlimited
      expect(pro.limits.maxTrustedContacts).toBe(10);
      expect(pro.limits.emailWatchers).toBe(true);
      expect(pro.limits.calendarSync).toBe(true);
      expect(pro.limits.socialEscalation).toBe(true);
    });
  });

  describe('getSubscriptionTier', () => {
    it('should return tier configuration for valid tier', () => {
      const tier = getSubscriptionTier('FREE');
      expect(tier.id).toBe('FREE');
      expect(tier.name).toBe('Free');
    });

    it('should throw error for invalid tier', () => {
      expect(() => getSubscriptionTier('INVALID' as SubscriptionTier)).toThrow(
        'Invalid subscription tier: INVALID',
      );
    });
  });

  describe('tierMeetsRequirement', () => {
    it('should return true when user tier meets requirement', () => {
      expect(tierMeetsRequirement('PRO', 'PERSONAL')).toBe(true);
      expect(tierMeetsRequirement('PRO', 'PRO')).toBe(true);
      expect(tierMeetsRequirement('FAMILY', 'PRO')).toBe(true);
    });

    it('should return false when user tier does not meet requirement', () => {
      expect(tierMeetsRequirement('FREE', 'PERSONAL')).toBe(false);
      expect(tierMeetsRequirement('PERSONAL', 'PRO')).toBe(false);
    });
  });
});

