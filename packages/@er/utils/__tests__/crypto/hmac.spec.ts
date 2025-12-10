import { generateWebhookSignature, verifyWebhookSignature } from '../../src/crypto/hmac';

describe('HMAC', () => {
  const secret = 'test-secret-key';
  const payload = { event: 'reminder.triggered', reminderId: 'rem_123' };

  describe('generateWebhookSignature', () => {
    it('should generate signature for object payload', () => {
      const signature = generateWebhookSignature(payload, secret);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64); // SHA256 hex = 64 chars
    });

    it('should generate signature for string payload', () => {
      const payloadString = JSON.stringify(payload);
      const signature = generateWebhookSignature(payloadString, secret);
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
    });

    it('should generate different signatures for different secrets', () => {
      const sig1 = generateWebhookSignature(payload, 'secret1');
      const sig2 = generateWebhookSignature(payload, 'secret2');
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify correct signature', () => {
      const signature = generateWebhookSignature(payload, secret);
      const isValid = verifyWebhookSignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect signature', () => {
      const signature = generateWebhookSignature(payload, secret);
      const isValid = verifyWebhookSignature(payload, signature, 'wrong-secret');
      expect(isValid).toBe(false);
    });

    it('should reject tampered payload', () => {
      const signature = generateWebhookSignature(payload, secret);
      const tamperedPayload = { ...payload, reminderId: 'rem_456' };
      const isValid = verifyWebhookSignature(tamperedPayload, signature, secret);
      expect(isValid).toBe(false);
    });
  });
});

