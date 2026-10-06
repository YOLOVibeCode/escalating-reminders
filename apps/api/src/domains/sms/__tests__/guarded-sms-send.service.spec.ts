import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { GuardedSmsSendService } from '../guarded-sms-send.service';
import { SmsConsentRepository } from '../sms-consent.repository';
import { SmsMessageLogRepository } from '../sms-message-log.repository';

describe('GuardedSmsSendService', () => {
  const mockConsent = {
    hasActiveConsent: jest.fn(),
    recordOptOutAllPurposes: jest.fn(),
  };
  const mockLog = {
    create: jest.fn().mockResolvedValue({ id: 'log-1' }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    process.env.NOCTUSOFT_API_KEY = 'test-key';
    delete process.env.APP_ENV;
  });

  async function createService(): Promise<GuardedSmsSendService> {
    const module = await Test.createTestingModule({
      providers: [
        GuardedSmsSendService,
        { provide: SmsConsentRepository, useValue: mockConsent },
        { provide: SmsMessageLogRepository, useValue: mockLog },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => process.env[key] },
        },
      ],
    }).compile();
    return module.get(GuardedSmsSendService);
  }

  it('refuses send without consent', async () => {
    mockConsent.hasActiveConsent.mockResolvedValue(false);
    const service = await createService();
    await expect(
      service.send({ phone: '+15125550100', body: 'Hello' }),
    ).rejects.toThrow('SMS consent not active');
  });

  it('rejects body that exceeds single-segment limit after brand prefix', async () => {
    mockConsent.hasActiveConsent.mockResolvedValue(true);
    const service = await createService();
    const longBody = 'x'.repeat(200);
    await expect(service.send({ phone: '+15125550100', body: longBody })).rejects.toThrow(
      /single-segment/,
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('records opt-out on relay code 21610', async () => {
    mockConsent.hasActiveConsent.mockResolvedValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ error: true, code: 21610, message: 'stopped' })),
    });
    const service = await createService();
    await expect(
      service.send({ phone: '+15125550100', body: 'Hello' }),
    ).rejects.toThrow('stopped');
    expect(mockConsent.recordOptOutAllPurposes).toHaveBeenCalledWith('+15125550100');
  });

  describe('X-App-Env', () => {
    const okRelay = (): void => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ sid: 'SM1' })),
      });
    };
    const sentEnv = (): string =>
      ((global.fetch as jest.Mock).mock.calls[0][1] as { headers: Record<string, string> }).headers['X-App-Env'];

    it('tells the relay which environment is sending', async () => {
      process.env.APP_ENV = 'uat';
      mockConsent.hasActiveConsent.mockResolvedValue(true);
      okRelay();
      const service = await createService();
      await service.send({ phone: '+15125550100', body: 'Hello' });
      expect(sentEnv()).toBe('uat');
    });

    it('defaults to dev, which the relay captures, when APP_ENV is unset', async () => {
      mockConsent.hasActiveConsent.mockResolvedValue(true);
      okRelay();
      const service = await createService();
      await service.send({ phone: '+15125550100', body: 'Hello' });
      expect(sentEnv()).toBe('dev');
    });
  });
});
