import { Test } from '@nestjs/testing';

import { SmsConsentRepository } from '../sms-consent.repository';
import { SmsInboundService } from '../sms-inbound.service';

describe('SmsInboundService', () => {
  const mockConsent = {
    recordOptOut: jest.fn(),
    clearOptOut: jest.fn(),
    recordOptIn: jest.fn(),
  };

  let service: SmsInboundService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SmsInboundService,
        { provide: SmsConsentRepository, useValue: mockConsent },
      ],
    }).compile();
    service = module.get(SmsInboundService);
  });

  it('handles STOP', async () => {
    const result = await service.handle({ From: '+15125550100', Body: 'stop' });
    expect(mockConsent.recordOptOut).toHaveBeenCalled();
    expect(result.twiml).toBe('<Response></Response>');
  });

  it('handles START', async () => {
    await service.handle({ From: '+15125550100', Body: 'START' });
    expect(mockConsent.clearOptOut).toHaveBeenCalled();
  });

  it('handles HELP with TwiML', async () => {
    const result = await service.handle({ From: '+15125550100', Body: 'help' });
    expect(result.twiml).toContain('<Message>');
  });

  it('handles OptOutType STOP', async () => {
    await service.handle({ From: '+15125550100', OptOutType: 'STOP' });
    expect(mockConsent.recordOptOut).toHaveBeenCalled();
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

  it('handles YES opt-in', async () => {
    await service.handle({ From: '+15125550100', Body: 'yes' });
    expect(mockConsent.recordOptIn).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'reply-yes' }),
    );
  });
});
