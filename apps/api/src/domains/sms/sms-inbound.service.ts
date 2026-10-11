import { Injectable } from '@nestjs/common';

import { parseToE164 } from './phone.util';
import {
  SMS_CONSENT_TEXT_VERSION,
  SMS_HELP_KEYWORDS,
  SMS_LEGACY_TRUSTED_CONTACT_REQUEST_TYPE,
  SMS_PURPOSE,
  SMS_START_KEYWORDS,
  SMS_STOP_KEYWORDS,
  SMS_YES_KEYWORD,
  buildSmsHelpReplyBody,
  trustedContactSmsPurpose,
} from './sms-compliance.constants';
import { SmsConsentRepository } from './sms-consent.repository';
import { SmsMessageLogRepository } from './sms-message-log.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

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
  constructor(
    private readonly consentRepository: SmsConsentRepository,
    private readonly messageLogRepository: SmsMessageLogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async handle(fields: IInboundSmsFields): Promise<IInboundSmsResult> {
    const fromRaw = fields.From ?? '';
    const phone = parseToE164(fromRaw);
    const body = (fields.Body ?? '').trim();
    const bodyUpper = body.toUpperCase();
    const optOutType = (fields.OptOutType ?? '').toUpperCase();

    const stopKeywords: readonly string[] = SMS_STOP_KEYWORDS;
    const startKeywords: readonly string[] = SMS_START_KEYWORDS;
    const helpKeywords: readonly string[] = SMS_HELP_KEYWORDS;

    // STOP and START apply to everything this number gets from us, including the
    // per-contact consent a trusted contact gave on the opt-in page.
    if (optOutType === 'STOP' || stopKeywords.includes(bodyUpper)) {
      await this.consentRepository.recordOptOut(phone, SMS_PURPOSE);
      await this.consentRepository.recordOptOutAllPurposes(phone);
      return { twiml: '<Response></Response>' };
    }

    if (optOutType === 'START' || startKeywords.includes(bodyUpper)) {
      await this.consentRepository.clearOptOut(phone, SMS_PURPOSE);
      await this.consentRepository.clearOptOutAllPurposes(phone);
      return { twiml: '<Response></Response>' };
    }

    if (optOutType === 'HELP' || helpKeywords.includes(bodyUpper)) {
      const helpBody = buildSmsHelpReplyBody();
      return {
        twiml: `<Response><Message>${this.escapeXml(helpBody)}</Message></Response>`,
      };
    }

    if (bodyUpper === SMS_YES_KEYWORD) {
      await this.recordLegacyTrustedContactYes(phone);
      return { twiml: '<Response></Response>' };
    }

    return { twiml: '<Response></Response>' };
  }

  /**
   * Trusted contacts now opt in on a page; nobody is asked to reply YES any more. A YES still
   * counts when it answers a request we sent before that change: it opts this number in for the
   * contacts of the users who sent that request, and nothing else. A YES with no such request is
   * not consent.
   */
  private async recordLegacyTrustedContactYes(phone: string): Promise<void> {
    const userIds = await this.messageLogRepository.findLegacyTrustedContactRequestUserIds(
      phone,
      SMS_LEGACY_TRUSTED_CONTACT_REQUEST_TYPE,
    );
    if (userIds.length === 0) {
      return;
    }
    const contacts = await this.prisma.trustedContact.findMany({
      where: { userId: { in: userIds }, phone },
      select: { id: true },
    });
    for (const contact of contacts) {
      await this.consentRepository.recordOptIn({
        phone,
        purpose: trustedContactSmsPurpose(contact.id),
        consentTextVersion: SMS_CONSENT_TEXT_VERSION,
        source: 'reply-yes',
        consentedAt: new Date(),
      });
    }
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
