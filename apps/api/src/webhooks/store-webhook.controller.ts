import { Controller, Post, Req, Res, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createWebhookHandler } from '../lib/store-client';

@Controller('webhooks/store')
export class StoreWebhookController {
  @Post()
  @HttpCode(200)
  async handle(@Req() req: Request & { rawBody?: Buffer }, @Res() res: Response): Promise<void> {
    const secret = (process.env.RELAY_WEBHOOK_SECRET ?? '').trim();
    const callbackUrl = (process.env.STORE_WEBHOOK_URL ?? process.env.RELAY_WEBHOOK_NOTIFICATION_URL ?? '').trim();
    if (!secret || !callbackUrl) {
      res.status(503).json({ error: 'Webhook secret not configured' });
      return;
    }
    const handler = createWebhookHandler({
      secret,
      callbackUrl,
      on: {
        '*': async () => undefined,
      },
    });
    const body = req.rawBody ?? (typeof req.body === 'string' || Buffer.isBuffer(req.body) ? req.body : undefined);
    if (body === undefined) {
      res.status(500).json({ ok: false, code: 'RAW_BODY_REQUIRED' });
      return;
    }
    const out = await handler.handle({ body, headers: req.headers });
    res.status(out.status).json(out.body);
  }
}
