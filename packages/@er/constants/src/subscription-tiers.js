"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_TIERS = void 0;
exports.getSubscriptionTier = getSubscriptionTier;
exports.tierMeetsRequirement = tierMeetsRequirement;
exports.SUBSCRIPTION_TIERS = {
    FREE: {
        id: 'FREE',
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
        id: 'PERSONAL',
        name: 'Personal',
        price: 500,
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
        id: 'PRO',
        name: 'Pro',
        price: 1500,
        limits: {
            maxReminders: -1,
            maxAgents: -1,
            maxTrustedContacts: 10,
            emailWatchers: true,
            calendarSync: true,
            socialEscalation: true,
        },
    },
    FAMILY: {
        id: 'FAMILY',
        name: 'Family',
        price: 2500,
        limits: {
            maxReminders: -1,
            maxAgents: -1,
            maxTrustedContacts: 20,
            emailWatchers: true,
            calendarSync: true,
            socialEscalation: true,
            sharedReminders: true,
        },
    },
};
function getSubscriptionTier(tier) {
    const config = exports.SUBSCRIPTION_TIERS[tier];
    if (!config) {
        throw new Error(`Invalid subscription tier: ${tier}`);
    }
    return config;
}
function tierMeetsRequirement(userTier, requiredTier) {
    const tierOrder = ['FREE', 'PERSONAL', 'PRO', 'FAMILY'];
    const userIndex = tierOrder.indexOf(userTier);
    const requiredIndex = tierOrder.indexOf(requiredTier);
    return userIndex >= requiredIndex;
}
//# sourceMappingURL=subscription-tiers.js.map