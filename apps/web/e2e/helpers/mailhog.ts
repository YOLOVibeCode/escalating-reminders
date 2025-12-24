/**
 * MailHog helpers for E2E tests.
 * Uses MailHog HTTP API (UI port) to assert outbound email delivery.
 */

const MAILHOG_BASE_URL = process.env.MAILHOG_BASE_URL || 'http://localhost:3810';

type MailHogMessage = {
  Content?: {
    Headers?: Record<string, string[]>;
    Body?: string;
  };
  Raw?: {
    To?: string[];
  };
};

export async function getMailHogMessages(): Promise<MailHogMessage[]> {
  try {
    const res = await fetch(`${MAILHOG_BASE_URL}/api/v2/messages`);
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: MailHogMessage[] };
    return data.items || [];
  } catch {
    return [];
  }
}

export async function isMailHogAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${MAILHOG_BASE_URL}/api/v2/messages`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearMailHog(): Promise<void> {
  // MailHog supports v1 delete endpoint.
  await fetch(`${MAILHOG_BASE_URL}/api/v1/messages`, { method: 'DELETE' }).catch(() => {});
}

function getHeader(msg: MailHogMessage, name: string): string {
  const v = msg.Content?.Headers?.[name];
  return Array.isArray(v) && v.length > 0 ? String(v[0]) : '';
}

function messageHasRecipient(msg: MailHogMessage, recipient: string): boolean {
  const toRaw = msg.Raw?.To || [];
  return toRaw.some((t) => t.toLowerCase().includes(recipient.toLowerCase()));
}

export async function waitForEmail(options: {
  to: string;
  subjectIncludes?: string;
  bodyIncludes?: string | string[];
  timeoutMs?: number;
}): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const res = await fetch(`${MAILHOG_BASE_URL}/api/v2/messages`);
    if (res.ok) {
      const data = (await res.json()) as { items?: MailHogMessage[] };
      const items = data.items || [];
        const match = items.find((msg) => {
        if (!messageHasRecipient(msg, options.to)) return false;
        if (options.subjectIncludes) {
          const subject = getHeader(msg, 'Subject');
          if (!subject.includes(options.subjectIncludes)) return false;
        }
        if (options.bodyIncludes) {
          const body = msg.Content?.Body || '';
          const needles = Array.isArray(options.bodyIncludes)
            ? options.bodyIncludes
            : [options.bodyIncludes];
          for (const n of needles) {
            if (!body.includes(n)) return false;
          }
        }
        return true;
      });

      if (match) return;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(
    `Timed out waiting for email to=${options.to}` +
      (options.subjectIncludes ? ` subject~=${options.subjectIncludes}` : '') +
      (options.bodyIncludes
        ? ` body~=${Array.isArray(options.bodyIncludes) ? options.bodyIncludes.join(' && ') : options.bodyIncludes}`
        : ''),
  );
}

