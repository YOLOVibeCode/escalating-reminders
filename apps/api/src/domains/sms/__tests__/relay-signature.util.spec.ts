import { computeRelaySignature, verifyRelayInboundSignature } from '../relay-signature.util';

describe('relay-signature.util', () => {
  const secret = 'test-secret';
  const url = 'https://api.escalatingreminders.com/webhooks/sms';
  const body = 'From=%2B15551234567&Body=STOP';

  it('verifies a valid signature', () => {
    const sig = computeRelaySignature(secret, url, body);
    expect(verifyRelayInboundSignature(secret, url, body, sig)).toBe(true);
  });

  it('rejects missing header', () => {
    expect(verifyRelayInboundSignature(secret, url, body, undefined)).toBe(false);
  });

  it('rejects tampered body', () => {
    const sig = computeRelaySignature(secret, url, body);
    expect(verifyRelayInboundSignature(secret, url, `${body}x`, sig)).toBe(false);
  });

  it('rejects wrong public URL', () => {
    const sig = computeRelaySignature(secret, url, body);
    expect(verifyRelayInboundSignature(secret, 'https://wrong.example/webhooks/sms', body, sig)).toBe(
      false,
    );
  });
});
