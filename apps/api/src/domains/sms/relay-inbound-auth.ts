import { verifyRelayInboundSignature } from './relay-signature.util';

export type RelayInboundAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; message: string };

/** Validate relay signature and secret configuration for inbound webhooks. */
export function authorizeRelayInbound(
  publicUrl: string,
  rawBody: Buffer | undefined,
  signatureHeader: string | undefined,
): RelayInboundAuthResult {
  const secret = (process.env.RELAY_INBOUND_SECRET ?? '').trim();
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  if (!secret) {
    if (nodeEnv === 'production') {
      return { ok: false, status: 503, message: 'Relay inbound secret not configured' };
    }
    return { ok: true };
  }

  if (!rawBody) {
    return { ok: false, status: 401, message: 'Missing request body' };
  }

  const valid = verifyRelayInboundSignature(secret, publicUrl, rawBody, signatureHeader);
  if (!valid) {
    return { ok: false, status: 401, message: 'Invalid relay signature' };
  }

  return { ok: true };
}
