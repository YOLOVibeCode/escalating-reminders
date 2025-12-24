"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMITS = void 0;
exports.getRateLimit = getRateLimit;
exports.getRateLimitWindowSeconds = getRateLimitWindowSeconds;
exports.RATE_LIMITS = {
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
function getRateLimit(tier) {
    return exports.RATE_LIMITS[tier];
}
function getRateLimitWindowSeconds(window) {
    switch (window) {
        case '1h':
            return 3600;
        case '1d':
            return 86400;
        default:
            return 3600;
    }
}
//# sourceMappingURL=rate-limits.js.map