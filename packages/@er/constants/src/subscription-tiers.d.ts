import type { SubscriptionTier } from '@er/types';
export interface SubscriptionTierConfig {
    id: SubscriptionTier;
    name: string;
    price: number;
    limits: SubscriptionLimits;
}
export interface SubscriptionLimits {
    maxReminders: number;
    maxAgents: number;
    maxTrustedContacts: number;
    emailWatchers: boolean;
    calendarSync: boolean;
    socialEscalation: boolean;
    sharedReminders?: boolean;
}
export declare const SUBSCRIPTION_TIERS: {
    readonly FREE: {
        readonly id: SubscriptionTier;
        readonly name: "Free";
        readonly price: 0;
        readonly limits: {
            readonly maxReminders: 3;
            readonly maxAgents: 1;
            readonly maxTrustedContacts: 0;
            readonly emailWatchers: false;
            readonly calendarSync: false;
            readonly socialEscalation: false;
        };
    };
    readonly PERSONAL: {
        readonly id: SubscriptionTier;
        readonly name: "Personal";
        readonly price: 500;
        readonly limits: {
            readonly maxReminders: 20;
            readonly maxAgents: 5;
            readonly maxTrustedContacts: 2;
            readonly emailWatchers: true;
            readonly calendarSync: true;
            readonly socialEscalation: false;
        };
    };
    readonly PRO: {
        readonly id: SubscriptionTier;
        readonly name: "Pro";
        readonly price: 1500;
        readonly limits: {
            readonly maxReminders: -1;
            readonly maxAgents: -1;
            readonly maxTrustedContacts: 10;
            readonly emailWatchers: true;
            readonly calendarSync: true;
            readonly socialEscalation: true;
        };
    };
    readonly FAMILY: {
        readonly id: SubscriptionTier;
        readonly name: "Family";
        readonly price: 2500;
        readonly limits: {
            readonly maxReminders: -1;
            readonly maxAgents: -1;
            readonly maxTrustedContacts: 20;
            readonly emailWatchers: true;
            readonly calendarSync: true;
            readonly socialEscalation: true;
            readonly sharedReminders: true;
        };
    };
};
export type SubscriptionTierId = keyof typeof SUBSCRIPTION_TIERS;
export declare function getSubscriptionTier(tier: SubscriptionTier): SubscriptionTierConfig;
export declare function tierMeetsRequirement(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean;
//# sourceMappingURL=subscription-tiers.d.ts.map