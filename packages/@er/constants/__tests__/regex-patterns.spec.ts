import {
  isValidEmail,
  isValidPhoneUS,
  isValidUUID,
  isValidTimezone,
  isValidCron,
  isValidWebhookUrl,
} from '../src/regex-patterns';

describe('RegexPatterns', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('isValidPhoneUS', () => {
    it('should validate correct US phone numbers', () => {
      expect(isValidPhoneUS('+15551234567')).toBe(true);
      expect(isValidPhoneUS('+12025551234')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhoneUS('5551234567')).toBe(false);
      expect(isValidPhoneUS('+1555123456')).toBe(false); // too short
      expect(isValidPhoneUS('+155512345678')).toBe(false); // too long
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
    });
  });

  describe('isValidTimezone', () => {
    it('should validate correct timezones', () => {
      expect(isValidTimezone('America/New_York')).toBe(true);
      expect(isValidTimezone('Europe/London')).toBe(true);
    });

    it('should reject invalid timezones', () => {
      expect(isValidTimezone('Invalid')).toBe(false);
      expect(isValidTimezone('America')).toBe(false);
    });
  });

  describe('isValidCron', () => {
    it('should validate correct cron expressions', () => {
      expect(isValidCron('0 9 * * *')).toBe(true); // 9am daily
      expect(isValidCron('*/5 * * * *')).toBe(true); // every 5 minutes
    });

    it('should reject invalid cron expressions', () => {
      expect(isValidCron('invalid')).toBe(false);
      expect(isValidCron('99 99 * * *')).toBe(false); // invalid numbers
    });
  });

  describe('isValidWebhookUrl', () => {
    it('should validate correct webhook URLs', () => {
      expect(isValidWebhookUrl('https://example.com/webhook')).toBe(true);
      expect(isValidWebhookUrl('http://localhost:3000/webhook')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidWebhookUrl('not-a-url')).toBe(false);
      expect(isValidWebhookUrl('ftp://example.com')).toBe(false);
    });
  });
});

