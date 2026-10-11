import { Test } from '@nestjs/testing';

import { NotFoundError, ValidationError } from '../../../common/exceptions';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { GuardedSmsSendService } from '../../sms/guarded-sms-send.service';
import {
  SMS_TRUSTED_CONTACT_CONSENT_TEXT_VERSION,
  buildTrustedContactOptInLabel,
} from '../../sms/sms-compliance.constants';
import { SmsConsentRepository } from '../../sms/sms-consent.repository';
import { TrustedContactRepository } from '../trusted-contact.repository';
import { TrustedContactService } from '../trusted-contact.service';

const TOKEN = 'tok_0123456789abcdefghij';

function contactRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'tc1',
    userId: 'user_1',
    name: 'Pat',
    email: null,
    phone: '+15125550199',
    relationship: 'friend',
    notificationPreferences: { email: true, sms: true },
    smsOptInToken: TOKEN,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('TrustedContactService', () => {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByOptInToken: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByUserId: jest.fn(),
  };
  const guardedSmsSend = { send: jest.fn() };
  const consent = {
    hasActiveConsent: jest.fn(),
    findByPhoneAndPurpose: jest.fn(),
    recordOptIn: jest.fn(),
  };
  const prisma = {
    user: { findUnique: jest.fn() },
  };

  let service: TrustedContactService;

  beforeEach(async () => {
    jest.clearAllMocks();
    consent.findByPhoneAndPurpose.mockResolvedValue(null);
    consent.hasActiveConsent.mockResolvedValue(false);
    prisma.user.findUnique.mockResolvedValue({
      email: 'owner@example.com',
      profile: { displayName: 'Jordan' },
    });
    guardedSmsSend.send.mockResolvedValue({});
    const module = await Test.createTestingModule({
      providers: [
        TrustedContactService,
        { provide: TrustedContactRepository, useValue: repository },
        { provide: GuardedSmsSendService, useValue: guardedSmsSend },
        { provide: SmsConsentRepository, useValue: consent },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(TrustedContactService);
  });

  describe('create', () => {
    it('never texts the contact, and gives the user an opt-in link token when texts are wanted', async () => {
      repository.create.mockImplementation((data: Record<string, unknown>) =>
        Promise.resolve(contactRow(data)),
      );

      const created = await service.create('user_1', {
        name: 'Pat',
        phone: '(512) 555-0199',
        relationship: 'friend',
        notifyViaSms: true,
      });

      expect(guardedSmsSend.send).not.toHaveBeenCalled();
      const data = (repository.create.mock.calls as unknown[][])[0][0] as {
        phone: string;
        smsOptInToken: string;
        notificationPreferences: { sms: boolean };
      };
      expect(data.phone).toBe('+15125550199');
      expect(data.notificationPreferences.sms).toBe(true);
      expect(data.smsOptInToken.length).toBeGreaterThanOrEqual(16);
      expect(created.smsStatus).toBe('INVITED');
    });

    it('creates no link and stays email-only when texts are not wanted', async () => {
      repository.create.mockImplementation((data: Record<string, unknown>) =>
        Promise.resolve(contactRow(data)),
      );

      const created = await service.create('user_1', { name: 'Pat', relationship: 'friend' });

      expect(guardedSmsSend.send).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ smsOptInToken: null }),
      );
      expect(created.smsStatus).toBe('EMAIL_ONLY');
    });
  });

  describe('update', () => {
    it('does not text a changed phone number', async () => {
      repository.findById.mockResolvedValue(contactRow());
      repository.update.mockImplementation((_id: string, data: Record<string, unknown>) =>
        Promise.resolve(contactRow(data)),
      );

      await service.update('user_1', 'tc1', { phone: '+15125550123' });

      expect(guardedSmsSend.send).not.toHaveBeenCalled();
    });

    it('withdraws the link when texts are turned off', async () => {
      repository.findById.mockResolvedValue(contactRow());
      repository.update.mockImplementation((_id: string, data: Record<string, unknown>) =>
        Promise.resolve(contactRow(data)),
      );

      await service.update('user_1', 'tc1', { notifyViaSms: false });

      expect(repository.update).toHaveBeenCalledWith(
        'tc1',
        expect.objectContaining({ smsOptInToken: null }),
      );
    });
  });

  describe('list status', () => {
    it('reports opted in, opted out, and invited from per-contact consent', async () => {
      repository.findByUserId.mockResolvedValue([
        contactRow({ id: 'a' }),
        contactRow({ id: 'b' }),
        contactRow({ id: 'c' }),
        contactRow({ id: 'd', notificationPreferences: { email: true, sms: false } }),
      ]);
      consent.findByPhoneAndPurpose.mockImplementation((_phone: string, purpose: string) => {
        if (purpose === 'trusted-contact:a') return Promise.resolve({ consentedAt: new Date(), revokedAt: null });
        if (purpose === 'trusted-contact:b') return Promise.resolve({ consentedAt: new Date(), revokedAt: new Date() });
        return Promise.resolve(null);
      });

      const rows = await service.list('user_1');

      expect(rows.map((r) => r.smsStatus)).toEqual(['OPTED_IN', 'OPTED_OUT', 'INVITED', 'EMAIL_ONLY']);
    });
  });

  describe('opt-in page', () => {
    it('shows who invited the contact and the exact unchecked-box wording', async () => {
      repository.findByOptInToken.mockResolvedValue(contactRow());

      const view = await service.getOptIn(TOKEN);

      expect(view).toEqual(
        expect.objectContaining({
          inviterName: 'Jordan',
          contactName: 'Pat',
          phoneLastFour: '0199',
          optedIn: false,
          consentLabel: buildTrustedContactOptInLabel('Jordan'),
          consentTextVersion: SMS_TRUSTED_CONTACT_CONSENT_TEXT_VERSION,
        }),
      );
    });

    it('treats an unknown or withdrawn link as not found', async () => {
      repository.findByOptInToken.mockResolvedValue(null);
      await expect(service.getOptIn(TOKEN)).rejects.toBeInstanceOf(NotFoundError);

      repository.findByOptInToken.mockResolvedValue(
        contactRow({ notificationPreferences: { email: true, sms: false } }),
      );
      await expect(service.getOptIn(TOKEN)).rejects.toBeInstanceOf(NotFoundError);
    });

    it('records consent for this contact only, with time, IP, user agent and wording version, then confirms by text', async () => {
      repository.findByOptInToken.mockResolvedValue(contactRow());

      const result = await service.acceptOptIn(
        TOKEN,
        { phone: '512-555-0199', consent: true },
        { ip: '203.0.113.9', userAgent: 'jest' },
      );

      expect(result).toEqual({ status: 'OPTED_IN' });
      expect(consent.recordOptIn).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+15125550199',
          purpose: 'trusted-contact:tc1',
          consentTextVersion: SMS_TRUSTED_CONTACT_CONSENT_TEXT_VERSION,
          source: '/contact-optin',
          ip: '203.0.113.9',
          userAgent: 'jest',
          consentedAt: expect.any(Date) as Date,
        }),
      );
      expect(guardedSmsSend.send).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+15125550199',
          purpose: 'trusted-contact:tc1',
          body: expect.stringContaining('STOP to opt out') as string,
        }),
      );
    });

    it('refuses without the box checked and records nothing', async () => {
      repository.findByOptInToken.mockResolvedValue(contactRow());

      await expect(
        service.acceptOptIn(TOKEN, { phone: '+15125550199', consent: false }),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(consent.recordOptIn).not.toHaveBeenCalled();
      expect(guardedSmsSend.send).not.toHaveBeenCalled();
    });

    it('refuses a number that does not match the one the user entered', async () => {
      repository.findByOptInToken.mockResolvedValue(contactRow());

      await expect(
        service.acceptOptIn(TOKEN, { phone: '+15125550123', consent: true }),
      ).rejects.toThrow('does not match');
      expect(consent.recordOptIn).not.toHaveBeenCalled();
    });

    it('saves the number the contact enters when the user left it blank', async () => {
      repository.findByOptInToken.mockResolvedValue(contactRow({ phone: null }));

      await service.acceptOptIn(TOKEN, { phone: '+15125550123', consent: true });

      expect(repository.update).toHaveBeenCalledWith('tc1', { phone: '+15125550123' });
      expect(consent.recordOptIn).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '+15125550123', purpose: 'trusted-contact:tc1' }),
      );
    });

    it('keeps the consent when the confirmation text fails', async () => {
      repository.findByOptInToken.mockResolvedValue(contactRow());
      guardedSmsSend.send.mockRejectedValue(new Error('stopped'));

      await expect(
        service.acceptOptIn(TOKEN, { phone: '+15125550199', consent: true }),
      ).resolves.toEqual({ status: 'OPTED_IN' });
      expect(consent.recordOptIn).toHaveBeenCalled();
    });
  });
});
