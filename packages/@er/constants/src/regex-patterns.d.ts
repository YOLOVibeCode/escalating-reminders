export declare const REGEX_PATTERNS: {
    readonly EMAIL: RegExp;
    readonly PHONE_US: RegExp;
    readonly UUID: RegExp;
    readonly TIMEZONE: RegExp;
    readonly CRON: RegExp;
    readonly API_KEY_PREFIX: RegExp;
    readonly WEBHOOK_URL: RegExp;
};
export declare function isValidEmail(email: string): boolean;
export declare function isValidPhoneUS(phone: string): boolean;
export declare function isValidUUID(uuid: string): boolean;
export declare function isValidTimezone(timezone: string): boolean;
export declare function isValidCron(cron: string): boolean;
export declare function isValidWebhookUrl(url: string): boolean;
//# sourceMappingURL=regex-patterns.d.ts.map