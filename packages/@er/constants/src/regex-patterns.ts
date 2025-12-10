/**
 * Common regex patterns used across the application.
 */
export const REGEX_PATTERNS = {
  // Email validation
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Phone number (US format)
  PHONE_US: /^\+1[2-9]\d{2}[2-9]\d{2}\d{4}$/,

  // UUID v4
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  // IANA timezone
  TIMEZONE: /^[A-Za-z_]+\/[A-Za-z_]+$/,

  // Cron expression (basic validation)
  CRON: /^(\*|([0-9]|[1-5][0-9])|\*\/([0-9]|[1-5][0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|[12][0-9]|3[01])|\*\/([1-9]|[12][0-9]|3[01])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,

  // API key prefix (esk_live_...)
  API_KEY_PREFIX: /^esk_(live|test)_/,

  // Webhook URL
  WEBHOOK_URL: /^https?:\/\/.+/,
} as const;

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return REGEX_PATTERNS.EMAIL.test(email);
}

/**
 * Validate US phone number format.
 */
export function isValidPhoneUS(phone: string): boolean {
  return REGEX_PATTERNS.PHONE_US.test(phone);
}

/**
 * Validate UUID v4 format.
 */
export function isValidUUID(uuid: string): boolean {
  return REGEX_PATTERNS.UUID.test(uuid);
}

/**
 * Validate IANA timezone format.
 */
export function isValidTimezone(timezone: string): boolean {
  return REGEX_PATTERNS.TIMEZONE.test(timezone);
}

/**
 * Validate cron expression format.
 */
export function isValidCron(cron: string): boolean {
  return REGEX_PATTERNS.CRON.test(cron);
}

/**
 * Validate webhook URL format.
 */
export function isValidWebhookUrl(url: string): boolean {
  return REGEX_PATTERNS.WEBHOOK_URL.test(url);
}

