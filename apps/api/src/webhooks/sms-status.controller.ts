import { Controller, Post, Req, Res, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';

import { parseToE164 } from '../domains/sms/phone.util';
import { authorizeRelayInbound } from '../domains/sms/relay-inbound-auth';
import { SMS_DEFAULT_STATUS_WEBHOOK_URL, SMS_PURPOSE } from '../domains/sms/sms-compliance.constants';
import { SmsConsentRepository } from '../domains/sms/sms-consent.repository';
import { SmsMessageLogRepository } from '../domains/sms/sms-message-log.repository';

function parseTwilioFormBody(raw: Buffer): Record<string, string> {
  const params = new URLSearchParams(raw.toString('utf8'));
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

@Controller('webhooks/sms-status')
export class SmsStatusController {
  constructor(
    private readonly messageLogRepository: SmsMessageLogRepository,
    private readonly consentRepository: SmsConsentRepository,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(@Req() req: Request & { rawBody?: Buffer }, @Res() res: Response): Promise<void> {
    const publicUrl =
      (process.env.SMS_STATUS_WEBHOOK_URL ?? SMS_DEFAULT_STATUS_WEBHOOK_URL).trim();
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
    const messageSid = fields.MessageSid;
    const messageStatus = fields.MessageStatus;
    const errorCode = fields.ErrorCode;

    if (messageSid !== undefined && messageSid !== '') {
      const statusUpdate: { messageStatus?: string; errorCode?: string } = {};
      if (messageStatus !== undefined) statusUpdate.messageStatus = messageStatus;
      if (errorCode !== undefined) statusUpdate.errorCode = errorCode;
      await this.messageLogRepository.updateByMessageSid(messageSid, statusUpdate);
    }

    if (errorCode === '21610' && fields.To !== undefined && fields.To !== '') {
      try {
        const phone = parseToE164(fields.To);
        await this.consentRepository.recordOptOut(phone, SMS_PURPOSE);
      } catch {
        // ignore invalid phone on status callback
      }
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  }
}
