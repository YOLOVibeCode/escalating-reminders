/**
 * Webhook receiver helpers for E2E tests.
 * Requires `apps/web/e2e/webhook-receiver/server.js` to be running.
 */

const WEBHOOK_RECEIVER_BASE_URL =
  process.env.WEBHOOK_RECEIVER_BASE_URL || 'http://localhost:3812';

export type WebhookReceivedEvent = {
  receivedAt: string;
  headers: Record<string, string | string[] | undefined>;
  body: any;
  rawBody: string;
};

export async function resetWebhookReceiver(): Promise<void> {
  await fetch(`${WEBHOOK_RECEIVER_BASE_URL}/reset`, { method: 'POST' }).catch(
    () => {},
  );
}

export async function getWebhookEvents(): Promise<WebhookReceivedEvent[]> {
  const res = await fetch(`${WEBHOOK_RECEIVER_BASE_URL}/events`);
  if (!res.ok) return [];
  const json = (await res.json()) as { ok: boolean; events?: WebhookReceivedEvent[] };
  return json.events || [];
}

export async function waitForWebhookEvent(options: {
  predicate: (evt: WebhookReceivedEvent) => boolean;
  timeoutMs?: number;
}): Promise<WebhookReceivedEvent> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const events = await getWebhookEvents();
    const match = events.find(options.predicate);
    if (match) return match;
    await new Promise((r) => setTimeout(r, 250));
  }

  throw new Error('Timed out waiting for webhook event');
}

