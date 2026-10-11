import { Test } from '@nestjs/testing';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { SMS_LEGACY_TRUSTED_CONTACT_REQUEST_TYPE } from '../sms-compliance.constants';
import { SmsConsentRepository } from '../sms-consent.repository';
import { SmsInboundService } from '../sms-inbound.service';
import { SmsMessageLogRepository } from '../sms-message-log.repository';

describe('SmsInboundService', () => {
  const mockConsent = {
    recordOptOut: jest.fn(),
    recordOptOutAllPurposes: jest.fn(),
    clearOptOut: jest.fn(),
    clearOptOutAllPurposes: jest.fn(),
    recordOptIn: jest.fn(),
  };
  const mockMessageLog = {
    findLegacyTrustedContactRequestUserIds: jest.fn(),
  };
  const mockPrisma = {
    trustedContact: { findMany: jest.fn() },
  };

  let service: SmsInboundService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockMessageLog.findLegacyTrustedContactRequestUserIds.mockResolvedValue([]);
    mockPrisma.trustedContact.findMany.mockResolvedValue([]);
    const module = await Test.createTestingModule({
      providers: [
        SmsInboundService,
        { provide: SmsConsentRepository, useValue: mockConsent },
        { provide: SmsMessageLogRepository, useValue: mockMessageLog },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(SmsInboundService);
  });

  it('handles STOP for every purpose, including per-contact consent', async () => {
    const result = await service.handle({ From: '+15125550100', Body: 'stop' });
    expect(mockConsent.recordOptOut).toHaveBeenCalled();
    expect(mockConsent.recordOptOutAllPurposes).toHaveBeenCalledWith('+15125550100');
    expect(result.twiml).toBe('<Response></Response>');
  });

  it('handles START for every purpose', async () => {
    await service.handle({ From: '+15125550100', Body: 'START' });
    expect(mockConsent.clearOptOut).toHaveBeenCalled();
    expect(mockConsent.clearOptOutAllPurposes).toHaveBeenCalledWith('+15125550100');
  });

  it('handles HELP with TwiML', async () => {
    const result = await service.handle({ From: '+15125550100', Body: 'help' });
    expect(result.twiml).toContain('<Message>');
  });

  it('handles OptOutType STOP', async () => {
    await service.handle({ From: '+15125550100', OptOutType: 'STOP' });
    expect(mockConsent.recordOptOut).toHaveBeenCalled();
    expect(mockConsent.recordOptOutAllPurposes).toHaveBeenCalled();
  });

  it('handles OptOutType START (clears opt-out)', async () => {
    await service.handle({ From: '+15125550100', OptOutType: 'START' });
    expect(mockConsent.clearOptOut).toHaveBeenCalled();
    expect(mockConsent.recordOptOut).not.toHaveBeenCalled();
  });

  it('handles OptOutType HELP with TwiML', async () => {
    const result = await service.handle({ From: '+15125550100', OptOutType: 'HELP' });
    expect(result.twiml).toContain('<Message>');
    expect(mockConsent.recordOptOut).not.toHaveBeenCalled();
  });

  it('counts YES only as an answer to a legacy request, for that user\'s contacts', async () => {
    mockMessageLog.findLegacyTrustedContactRequestUserIds.mockResolvedValue(['user_1']);
    mockPrisma.trustedContact.findMany.mockResolvedValue([{ id: 'tc1' }]);

    await service.handle({ From: '+15125550100', Body: 'yes' });

    expect(mockMessageLog.findLegacyTrustedContactRequestUserIds).toHaveBeenCalledWith(
      '+15125550100',
      SMS_LEGACY_TRUSTED_CONTACT_REQUEST_TYPE,
    );
    expect(mockPrisma.trustedContact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: { in: ['user_1'] }, phone: '+15125550100' } }),
    );
    expect(mockConsent.recordOptIn).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: 'trusted-contact:tc1', source: 'reply-yes' }),
    );
  });

  it('ignores a YES nobody asked for', async () => {
    await service.handle({ From: '+15125550100', Body: 'YES' });
    expect(mockConsent.recordOptIn).not.toHaveBeenCalled();
  });
});
