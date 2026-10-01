import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SMS_BRAND, SMS_PURPOSE, SMS_RELAY_SEND_URL } from './sms-compliance.constants';
import { SmsConsentRepository } from './sms-consent.repository';
import { SmsMessageLogRepository } from './sms-message-log.repository';

export type GuardedSmsSendOptions = {
  phone: string;
  body: string;
  purpose?: string;
  allowWithoutConsent?: 'double-opt-in-confirmation';
  metadata?: Record<string, unknown>;
};

type RelayErrorBody = {
  error?: boolean;
  code?: number;
  message?: string;
  sid?: string;
};

@Injectable()
export class GuardedSmsSendService {
  private readonly logger = new Logger(GuardedSmsSendService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly consentRepository: SmsConsentRepository,
    private readonly messageLogRepository: SmsMessageLogRepository,
  ) {}

  private getRelayApiKey(): string {
    const key =
      this.configService.get<string>('NOCTUSOFT_API_KEY') ||
      this.configService.get<string>('NOCTUSOFT_RELAY_API_KEY') ||
      '';
    return key.trim();
  }

  private prefixBrand(body: string): string {
    const prefix = `${SMS_BRAND}: `;
    if (body.startsWith(SMS_BRAND)) {
      return body;
    }
    return `${prefix}${body}`;
  }

  /** Single entry point for outbound SMS via the Noctusoft relay. */
  async send(options: GuardedSmsSendOptions): Promise<{ messageSid?: string }> {
    const purpose = options.purpose ?? SMS_PURPOSE;
    const phone = options.phone;
    const brandedBody = this.prefixBrand(options.body);

    if (options.allowWithoutConsent !== 'double-opt-in-confirmation') {
      const allowed = await this.consentRepository.hasActiveConsent(phone, purpose);
      if (!allowed) {
        throw new Error(`SMS consent not active for ${phone}`);
      }
    }

    const apiKey = this.getRelayApiKey();
    if (!apiKey) {
      throw new Error('NOCTUSOFT_API_KEY is not configured');
    }

    const response = await fetch(SMS_RELAY_SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: phone, body: brandedBody }),
    });

    let parsed: RelayErrorBody & { sid?: string } = {};
    const text = await response.text();
    try {
      parsed = JSON.parse(text) as RelayErrorBody;
    } catch {
      parsed = { message: text };
    }

    const messageSid =
      typeof parsed.sid === 'string'
        ? parsed.sid
        : typeof (parsed as { MessageSid?: string }).MessageSid === 'string'
          ? (parsed as { MessageSid: string }).MessageSid
          : undefined;

    const logInput: {
      phone: string;
      body: string;
      relayHttpStatus: number;
      relayErrorCode?: number;
      relayErrorMessage?: string;
      twilioMessageSid?: string;
      metadata?: Record<string, unknown>;
    } = {
      phone,
      body: brandedBody,
      relayHttpStatus: response.status,
    };
    if (parsed.code !== undefined) logInput.relayErrorCode = parsed.code;
    if (parsed.message !== undefined) logInput.relayErrorMessage = parsed.message;
    if (messageSid !== undefined) logInput.twilioMessageSid = messageSid;
    if (options.metadata !== undefined) logInput.metadata = options.metadata;
    await this.messageLogRepository.create(logInput);

    if (!response.ok) {
      if (parsed.code === 21610) {
        await this.consentRepository.recordOptOutAllPurposes(phone);
      }
      const msg = parsed.message || `SMS relay failed with status ${response.status}`;
      this.logger.error(`SMS send failed for ${phone}: ${msg}`);
      throw new Error(msg);
    }

    if (messageSid) {
      return { messageSid };
    }
    return {};
  }
}
