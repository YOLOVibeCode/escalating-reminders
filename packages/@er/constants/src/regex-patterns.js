"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGEX_PATTERNS = void 0;
exports.isValidEmail = isValidEmail;
exports.isValidPhoneUS = isValidPhoneUS;
exports.isValidUUID = isValidUUID;
exports.isValidTimezone = isValidTimezone;
exports.isValidCron = isValidCron;
exports.isValidWebhookUrl = isValidWebhookUrl;
exports.REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_US: /^\+1[2-9]\d{2}[2-9]\d{2}\d{4}$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    TIMEZONE: /^[A-Za-z_]+\/[A-Za-z_]+$/,
    CRON: /^(\*|([0-9]|[1-5][0-9])|\*\/([0-9]|[1-5][0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|[12][0-9]|3[01])|\*\/([1-9]|[12][0-9]|3[01])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
    API_KEY_PREFIX: /^esk_(live|test)_/,
    WEBHOOK_URL: /^https?:\/\/.+/,
};
function isValidEmail(email) {
    return exports.REGEX_PATTERNS.EMAIL.test(email);
}
function isValidPhoneUS(phone) {
    return exports.REGEX_PATTERNS.PHONE_US.test(phone);
}
function isValidUUID(uuid) {
    return exports.REGEX_PATTERNS.UUID.test(uuid);
}
function isValidTimezone(timezone) {
    return exports.REGEX_PATTERNS.TIMEZONE.test(timezone);
}
function isValidCron(cron) {
    return exports.REGEX_PATTERNS.CRON.test(cron);
}
function isValidWebhookUrl(url) {
    return exports.REGEX_PATTERNS.WEBHOOK_URL.test(url);
}
//# sourceMappingURL=regex-patterns.js.map