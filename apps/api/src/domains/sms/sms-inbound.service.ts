import { Injectable } from '@nestjs/common';

import { parseToE164 } from './phone.util';
import {
  SMS_CONSENT_TEXT_VERSION,
  SMS_HELP_KEYWORDS,
  SMS_PURPOSE,
  SMS_START_KEYWORDS,
  SMS_STOP_KEYWORDS,
  SMS_YES_KEYWORD,
  buildSmsHelpReplyBody,
} from './sms-compliance.constants';
import { SmsConsentRepository } from './sms-consent.repository';

export interface IInboundSmsFields {
  From?: string;
  Body?: string;
  OptOutType?: string;
}

export interface IInboundSmsResult {
  twiml: string;
}

@Injectable()
export class SmsInboundService {
  constructor(private readonly consentRepository: SmsConsentRepository) {}

  async handle(fields: IInboundSmsFields): Promise<IInboundSmsResult> {
    const fromRaw = fields.From ?? '';
    const phone = parseToE164(fromRaw);
    const body = (fields.Body ?? '').trim();
    const bodyUpper = body.toUpperCase();
    const optOutType = (fields.OptOutType ?? '').toUpperCase();

    const stopKeywords: readonly string[] = SMS_STOP_KEYWORDS;
    const startKeywords: readonly string[] = SMS_START_KEYWORDS;
    const helpKeywords: readonly string[] = SMS_HELP_KEYWORDS;

    if (optOutType === 'STOP' || stopKeywords.includes(bodyUpper)) {
      await this.consentRepository.recordOptOut(phone, SMS_PURPOSE);
      return { twiml: '<Response></Response>' };
    }

    if (optOutType === 'START' || startKeywords.includes(bodyUpper)) {
      await this.consentRepository.clearOptOut(phone, SMS_PURPOSE);
      return { twiml: '<Response></Response>' };
    }

    if (optOutType === 'HELP' || helpKeywords.includes(bodyUpper)) {
      const helpBody = buildSmsHelpReplyBody();
      return {
        twiml: `<Response><Message>${this.escapeXml(helpBody)}</Message></Response>`,
      };
    }

    if (bodyUpper === SMS_YES_KEYWORD) {
      await this.consentRepository.recordOptIn({
        phone,
        purpose: SMS_PURPOSE,
        consentTextVersion: SMS_CONSENT_TEXT_VERSION,
        source: 'reply-yes',
        consentedAt: new Date(),
      });
      return { twiml: '<Response></Response>' };
    }

    return { twiml: '<Response></Response>' };
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
