import { createHmac } from 'crypto';

/**
 * Generate HMAC-SHA256 signature for webhook payloads.
 */
export function generateWebhookSignature(
  payload: string | object,
  secret: string,
): string {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const hmac = createHmac('sha256', secret);
  hmac.update(payloadString);
  return hmac.digest('hex');
}

/**
 * Verify HMAC-SHA256 signature for webhook payloads.
 */
export function verifyWebhookSignature(
  payload: string | object,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return signature === expectedSignature;
}

