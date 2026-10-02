import { createHmac } from 'node:crypto';

import { SmsInboundController } from './sms-inbound.controller';
import { SmsInboundService } from '../domains/sms/sms-inbound.service';

function sign(secret: string, url: string, body: string): string {
  return createHmac('sha256', secret).update(url).update(body).digest('base64');
}

describe('SmsInboundController', () => {
  const secret = 'inbound-secret';
  const publicUrl = 'https://api.escalatingreminders.com/webhooks/sms';
  let prevSecret: string | undefined;

  const inboundService = {
    handle: jest.fn().mockResolvedValue({ twiml: '<Response></Response>' }),
  };

  beforeEach(() => {
    prevSecret = process.env.RELAY_INBOUND_SECRET;
    process.env.RELAY_INBOUND_SECRET = secret;
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (prevSecret === undefined) delete process.env.RELAY_INBOUND_SECRET;
    else process.env.RELAY_INBOUND_SECRET = prevSecret;
  });

  it('accepts valid signature', async () => {
    const controller = new SmsInboundController(inboundService as unknown as SmsInboundService);
    const body = 'From=%2B15125550100&Body=HELP';
    const raw = Buffer.from(body);
    let status = 0;
    let payload = '';
    const res = {
      status(code: number): typeof res {
        status = code;
        return this;
      },
      setHeader: jest.fn(),
      send(data: string): typeof res {
        payload = data;
        return this;
      },
      json: jest.fn(),
    };
    await controller.handle(
      {
        rawBody: raw,
        headers: { 'x-relay-signature': sign(secret, publicUrl, body) },
      } as never,
      res as never,
    );
    expect(status).toBe(200);
    expect(payload).toContain('Response');
  });

  it('rejects signature when body bytes differ from signed payload (re-encoded)', async () => {
    const controller = new SmsInboundController(inboundService as unknown as SmsInboundService);
    const canonical = 'From=%2B15125550100&Body=HELP';
    const reEncoded = 'Body=HELP&From=%2B15125550100';
    const raw = Buffer.from(reEncoded);
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    await controller.handle(
      {
        rawBody: raw,
        headers: { 'x-relay-signature': sign(secret, publicUrl, canonical) },
      } as never,
      res as never,
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(inboundService.handle).not.toHaveBeenCalled();
  });

  it('rejects invalid signature', async () => {
    const controller = new SmsInboundController(inboundService as unknown as SmsInboundService);
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    await controller.handle(
      {
        rawBody: Buffer.from('From=x'),
        headers: { 'x-relay-signature': 'bad' },
      } as never,
      res as never,
    );
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
