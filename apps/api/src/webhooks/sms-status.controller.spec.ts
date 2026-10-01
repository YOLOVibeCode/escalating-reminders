import { createHmac } from 'node:crypto';
import { SmsStatusController } from './sms-status.controller';
import { SmsMessageLogRepository } from '../domains/sms/sms-message-log.repository';
import { SmsConsentRepository } from '../domains/sms/sms-consent.repository';

function sign(secret: string, url: string, body: string): string {
  return createHmac('sha256', secret).update(url).update(body).digest('base64');
}

describe('SmsStatusController', () => {
  const secret = 'status-secret';
  const publicUrl = 'https://api.escalatingreminders.com/webhooks/sms-status';

  const messageLog = { updateByMessageSid: jest.fn().mockResolvedValue({}) };
  const consent = { recordOptOut: jest.fn() };

  beforeEach(() => {
    process.env.RELAY_INBOUND_SECRET = secret;
    jest.clearAllMocks();
  });

  it('records opt-out on error 21610', async () => {
    const controller = new SmsStatusController(
      messageLog as unknown as SmsMessageLogRepository,
      consent as unknown as SmsConsentRepository,
    );
    const body = 'MessageSid=SM123&MessageStatus=failed&ErrorCode=21610&To=%2B15125550100';
    const res = {
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      send: jest.fn(),
      json: jest.fn(),
    };
    await controller.handle(
      {
        rawBody: Buffer.from(body),
        headers: { 'x-relay-signature': sign(secret, publicUrl, body) },
      } as never,
      res as never,
    );
    expect(consent.recordOptOut).toHaveBeenCalled();
    expect(messageLog.updateByMessageSid).toHaveBeenCalledWith('SM123', expect.any(Object));
  });
});
