/**
 * Security utilities for webhook signature verification.
 * 
 * Implements HMAC-SHA256 signature verification as per the Agent Specification.
 */

import * as crypto from 'crypto';

const SIGNATURE_PREFIX = 'sha256=';

/**
 * Verifies the webhook signature.
 * 
 * @param payload - Raw JSON body string
 * @param signature - Value of X-Webhook-Signature header
 * @param secret - Your webhook secret
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !signature.startsWith(SIGNATURE_PREFIX)) {
    console.error('Invalid signature format');
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = SIGNATURE_PREFIX + hmac.digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Generates a webhook signature (for testing purposes).
 * 
 * @param payload - JSON payload string
 * @param secret - Webhook secret
 * @returns Signature string with sha256= prefix
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return SIGNATURE_PREFIX + hmac.digest('hex');
}


