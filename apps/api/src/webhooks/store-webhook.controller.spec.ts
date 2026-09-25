import { createHmac } from 'node:crypto';
import { StoreWebhookController } from './store-webhook.controller';

function signed(secret: string, callbackUrl: string, event: Record<string, unknown>) {
  const body = JSON.stringify(event);
  return {
    body,
    headers: {
      'x-noctusoft-signature': createHmac('sha256', secret).update(body).digest('hex'),
      'x-relay-signature': createHmac('sha256', secret).update(callbackUrl).update(body).digest('base64'),
    },
  };
}

describe('StoreWebhookController', () => {
  const secret = 'test-secret';
  const callbackUrl = 'https://api.example/v1/webhooks/store';
  let prevSecret: string | undefined;
  let prevUrl: string | undefined;

  beforeEach(() => {
    prevSecret = process.env.RELAY_WEBHOOK_SECRET;
    prevUrl = process.env.STORE_WEBHOOK_URL;
    process.env.RELAY_WEBHOOK_SECRET = secret;
    process.env.STORE_WEBHOOK_URL = callbackUrl;
  });

  afterEach(() => {
    if (prevSecret === undefined) delete process.env.RELAY_WEBHOOK_SECRET;
    else process.env.RELAY_WEBHOOK_SECRET = prevSecret;
    if (prevUrl === undefined) delete process.env.STORE_WEBHOOK_URL;
    else process.env.STORE_WEBHOOK_URL = prevUrl;
  });

  it('accepts a signed event v1 body', async () => {
    const controller = new StoreWebhookController();
    const { body, headers } = signed(secret, callbackUrl, {
      id: 'rel_evt_1',
      type: 'subscription.started',
      version: 1,
      store: 'escalating-reminders',
    });
    let status = 0;
    let json: unknown;
    const res = {
      status(code: number) {
        status = code;
        return this;
      },
      json(payload: unknown) {
        json = payload;
        return this;
      },
    };
    await controller.handle(
      { rawBody: Buffer.from(body), headers, body: JSON.parse(body) } as never,
      res as never,
    );
    expect(status).toBe(200);
    expect(json).toEqual({ ok: true, handled: true });
  });

  it('rejects a bad signature', async () => {
    const controller = new StoreWebhookController();
    let status = 0;
    const res = {
      status(code: number) {
        status = code;
        return this;
      },
      json() {
        return this;
      },
    };
    await controller.handle(
      {
        rawBody: Buffer.from('{"id":"x"}'),
        headers: { 'x-noctusoft-signature': 'deadbeef' },
        body: { id: 'x' },
      } as never,
      res as never,
    );
    expect(status).toBe(401);
  });
});
