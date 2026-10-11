import { randomBytes } from 'node:crypto';

import type { TrustedContact } from '@er/types';
import { Injectable, Logger } from '@nestjs/common';

import { TrustedContactRepository } from './trusted-contact.repository';
import { NotFoundError, ForbiddenError, ValidationError } from '../../common/exceptions';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { GuardedSmsSendService } from '../sms/guarded-sms-send.service';
import { parseToE164 } from '../sms/phone.util';
import {
  SMS_TRUSTED_CONTACT_CONSENT_TEXT_VERSION,
  buildTrustedContactOptInConfirmationBody,
  buildTrustedContactOptInLabel,
  trustedContactSmsPurpose,
} from '../sms/sms-compliance.constants';
import { SmsConsentRepository } from '../sms/sms-consent.repository';

export interface ICreateTrustedContactInput {
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  notifyViaSms?: boolean;
}

/**
 * EMAIL_ONLY: no texts requested. INVITED: the user wants texts for this contact and has a link to
 * send them; nothing is texted until the contact opts in. OPTED_IN: the contact checked the box on
 * the opt-in page (or answered a legacy YES request). OPTED_OUT: the contact replied STOP.
 */
export type TrustedContactSmsStatus = 'EMAIL_ONLY' | 'INVITED' | 'OPTED_IN' | 'OPTED_OUT';

export type TrustedContactView = TrustedContact & { smsStatus: TrustedContactSmsStatus };

export interface ITrustedContactOptInView {
  inviterName: string;
  contactName: string;
  /** Last four digits of the number the user entered, if any; the contact types the full number. */
  phoneLastFour: string | null;
  optedIn: boolean;
  consentLabel: string;
  consentTextVersion: string;
}

export interface IAcceptOptInInput {
  phone?: string;
  consent?: boolean;
}

@Injectable()
export class TrustedContactService {
  private readonly logger = new Logger(TrustedContactService.name);

  constructor(
    private readonly repository: TrustedContactRepository,
    private readonly guardedSmsSend: GuardedSmsSendService,
    private readonly smsConsentRepository: SmsConsentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async list(userId: string): Promise<TrustedContactView[]> {
    const contacts = await this.repository.findByUserId(userId);
    return Promise.all(contacts.map((contact) => this.withStatus(contact)));
  }

  /** Adding a contact never texts them. Asking for texts creates a link the user sends them. */
  async create(userId: string, input: ICreateTrustedContactInput): Promise<TrustedContactView> {
    const phone =
      input.phone !== undefined && input.phone !== '' ? parseToE164(input.phone) : null;
    const wantsSms = input.notifyViaSms === true;
    const contact = await this.repository.create({
      userId,
      name: input.name.trim(),
      email:
        input.email !== undefined && input.email.trim() !== '' ? input.email.trim() : null,
      phone,
      relationship: input.relationship.trim(),
      notificationPreferences: { email: true, sms: wantsSms },
      smsOptInToken: wantsSms ? newOptInToken() : null,
    });
    return this.withStatus(contact);
  }

  async update(
    userId: string,
    id: string,
    input: Partial<ICreateTrustedContactInput>,
  ): Promise<TrustedContactView> {
    const existing = await this.repository.findById(id);
    if (existing === null) {
      throw new NotFoundError(`Trusted contact ${id} not found`);
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Not allowed to update this contact');
    }

    const phone =
      input.phone !== undefined
        ? input.phone !== ''
          ? parseToE164(input.phone)
          : null
        : existing.phone;

    const updatePayload: Partial<{
      name: string;
      email: string | null;
      phone: string | null;
      relationship: string;
      notificationPreferences: { email: boolean; sms: boolean };
      smsOptInToken: string | null;
    }> = {};

    if (input.name !== undefined) updatePayload.name = input.name.trim();
    if (input.email !== undefined) {
      updatePayload.email =
        input.email.trim() !== '' ? input.email.trim() : null;
    }
    if (input.phone !== undefined) updatePayload.phone = phone;
    if (input.relationship !== undefined) updatePayload.relationship = input.relationship.trim();
    if (input.notifyViaSms !== undefined) {
      updatePayload.notificationPreferences = { email: true, sms: input.notifyViaSms };
      if (!input.notifyViaSms) {
        updatePayload.smsOptInToken = null;
      } else if (existing.smsOptInToken === null) {
        updatePayload.smsOptInToken = newOptInToken();
      }
    }

    const updated = await this.repository.update(id, updatePayload);
    return this.withStatus(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (existing === null) {
      throw new NotFoundError(`Trusted contact ${id} not found`);
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('Not allowed to delete this contact');
    }
    await this.repository.delete(id);
  }

  /** What the public opt-in page shows. Unknown or withdrawn links look the same: not found. */
  async getOptIn(token: string): Promise<ITrustedContactOptInView> {
    const contact = await this.findInvitedContact(token);
    const inviterName = await this.inviterName(contact.userId);
    const optedIn =
      contact.phone !== null &&
      (await this.smsConsentRepository.hasActiveConsent(
        contact.phone,
        trustedContactSmsPurpose(contact.id),
      ));
    return {
      inviterName,
      contactName: contact.name,
      phoneLastFour: contact.phone !== null ? contact.phone.slice(-4) : null,
      optedIn,
      consentLabel: buildTrustedContactOptInLabel(inviterName),
      consentTextVersion: SMS_TRUSTED_CONTACT_CONSENT_TEXT_VERSION,
    };
  }

  /**
   * The contact checks the box on the opt-in page. Consent is recorded for this contact only
   * (purpose `trusted-contact:<id>`) with time, IP, user agent and wording version, then one
   * confirmation text goes out.
   */
  async acceptOptIn(
    token: string,
    input: IAcceptOptInInput,
    context: { ip?: string; userAgent?: string } = {},
  ): Promise<{ status: 'OPTED_IN' }> {
    if (input.consent !== true) {
      throw new ValidationError('Check the box to get texts. A number alone is not consent.');
    }
    const contact = await this.findInvitedContact(token);

    let phone: string;
    try {
      phone = parseToE164(input.phone ?? '');
    } catch {
      throw new ValidationError('Enter a valid US or Canada mobile number.');
    }
    const inviterName = await this.inviterName(contact.userId);
    if (contact.phone !== null && contact.phone !== phone) {
      throw new ValidationError(
        `That number does not match the one ${inviterName} entered. Ask them to update it.`,
      );
    }
    if (contact.phone === null) {
      await this.repository.update(contact.id, { phone });
    }

    const consentInput: {
      phone: string;
      purpose: string;
      consentTextVersion: string;
      source: string;
      consentedAt: Date;
      ip?: string;
      userAgent?: string;
    } = {
      phone,
      purpose: trustedContactSmsPurpose(contact.id),
      consentTextVersion: SMS_TRUSTED_CONTACT_CONSENT_TEXT_VERSION,
      source: '/contact-optin',
      consentedAt: new Date(),
    };
    if (context.ip !== undefined && context.ip !== '') consentInput.ip = context.ip;
    if (context.userAgent !== undefined && context.userAgent !== '') {
      consentInput.userAgent = context.userAgent;
    }
    await this.smsConsentRepository.recordOptIn(consentInput);

    try {
      await this.guardedSmsSend.send({
        phone,
        body: buildTrustedContactOptInConfirmationBody(inviterName),
        purpose: trustedContactSmsPurpose(contact.id),
        metadata: { type: 'trusted-contact-opt-in-confirmation', trustedContactId: contact.id },
      });
    } catch (error) {
      // Consent stands even if the confirmation text fails (for example the number replied STOP before).
      this.logger.warn(
        `Opt-in confirmation text failed for contact ${contact.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return { status: 'OPTED_IN' };
  }

  private async findInvitedContact(token: string): Promise<TrustedContact> {
    const contact =
      token.length >= 16 ? await this.repository.findByOptInToken(token) : null;
    const prefs = contact?.notificationPreferences as { sms?: boolean } | undefined;
    if (contact === null || prefs?.sms !== true) {
      throw new NotFoundError('This link is not valid any more. Ask the person who sent it for a new one.');
    }
    return contact;
  }

  private async inviterName(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    const name = user?.profile?.displayName.trim();
    return name !== undefined && name !== '' ? name : 'Someone';
  }

  private async withStatus(contact: TrustedContact): Promise<TrustedContactView> {
    const prefs = contact.notificationPreferences as { sms?: boolean };
    if (prefs.sms !== true) {
      return { ...contact, smsStatus: 'EMAIL_ONLY' };
    }
    if (contact.phone === null) {
      return { ...contact, smsStatus: 'INVITED' };
    }
    const consent = await this.smsConsentRepository.findByPhoneAndPurpose(
      contact.phone,
      trustedContactSmsPurpose(contact.id),
    );
    if (consent?.consentedAt && !consent.revokedAt) {
      return { ...contact, smsStatus: 'OPTED_IN' };
    }
    if (consent?.revokedAt) {
      return { ...contact, smsStatus: 'OPTED_OUT' };
    }
    return { ...contact, smsStatus: 'INVITED' };
  }
}

function newOptInToken(): string {
  return randomBytes(18).toString('base64url');
}
