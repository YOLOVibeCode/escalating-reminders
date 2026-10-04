import { createHmac, timingSafeEqual } from 'node:crypto';

/** Verify Noctusoft relay x-relay-signature for inbound webhooks. */
export function computeRelaySignature(
  secret: string,
  publicUrl: string,
  rawBody: Buffer | string,
): string {
  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  return createHmac('sha256', secret).update(publicUrl).update(body).digest('base64');
}

export function verifyRelayInboundSignature(
  secret: string,
  publicUrl: string,
  rawBody: Buffer | string,
  header: string | undefined,
): boolean {
  if (header === undefined || header.trim().length === 0) {
    return false;
  }
  const expected = computeRelaySignature(secret, publicUrl, rawBody);
  const received = header.trim();
  if (expected.length !== received.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}
