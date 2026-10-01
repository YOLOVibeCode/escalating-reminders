import { Controller, Post, Req, Res, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SMS_DEFAULT_INBOUND_WEBHOOK_URL } from '../domains/sms/sms-compliance.constants';
import { authorizeRelayInbound } from '../domains/sms/relay-inbound-auth';
import { SmsInboundService } from '../domains/sms/sms-inbound.service';

function parseTwilioFormBody(raw: Buffer): Record<string, string> {
  const params = new URLSearchParams(raw.toString('utf8'));
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

@Controller('webhooks/sms')
export class SmsInboundController {
  constructor(private readonly inboundService: SmsInboundService) {}

  @Post()
  @HttpCode(200)
  async handle(@Req() req: Request & { rawBody?: Buffer }, @Res() res: Response): Promise<void> {
    const publicUrl =
      (process.env.SMS_INBOUND_WEBHOOK_URL ?? SMS_DEFAULT_INBOUND_WEBHOOK_URL).trim();
    const rawBody = req.rawBody;
    const auth = authorizeRelayInbound(
      publicUrl,
      rawBody,
      req.headers['x-relay-signature'] as string | undefined,
    );
    if (!auth.ok) {
      res.status(auth.status).json({ error: auth.message });
      return;
    }

    const bodyBuffer = rawBody ?? Buffer.from('');
    const fields = parseTwilioFormBody(bodyBuffer);
    const inboundFields: {
      From?: string;
      Body?: string;
      OptOutType?: string;
    } = {};
    if (fields.From !== undefined) inboundFields.From = fields.From;
    if (fields.Body !== undefined) inboundFields.Body = fields.Body;
    if (fields.OptOutType !== undefined) inboundFields.OptOutType = fields.OptOutType;

    const result = await this.inboundService.handle(inboundFields);

    res.status(200);
    res.setHeader('Content-Type', 'text/xml');
    res.send(result.twiml);
  }
}
