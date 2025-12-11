import { Test, TestingModule } from '@nestjs/testing';
import { WebhookAgentExecutor } from '../executors/webhook-agent.executor';
import type { UserAgentSubscription, NotificationPayload } from '@er/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('WebhookAgentExecutor', () => {
  let executor: WebhookAgentExecutor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookAgentExecutor],
    }).compile();

    executor = module.get<WebhookAgentExecutor>(WebhookAgentExecutor);
    jest.clearAllMocks();
  });

  describe('send', () => {
    const mockSubscription: UserAgentSubscription = {
      id: 'sub_1',
      userId: 'user_123',
      agentDefinitionId: 'agent_1',
      isEnabled: true,
      configuration: {
        url: 'https://example.com/webhook',
        method: 'POST',
      },
      webhookSecret: 'test_secret',
      lastTestedAt: null,
      lastTestResult: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPayload: NotificationPayload = {
      notificationId: 'notif_123',
      userId: 'user_123',
      reminderId: 'reminder_123',
      title: 'Test Reminder',
      message: 'This is a test',
      escalationTier: 1,
      importance: 'normal',
      actions: [],
    };

    it('should send webhook successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['X-Message-Id', 'msg_123']]),
      });

      const result = await executor.send(mockSubscription, mockPayload);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should include webhook signature when secret is available', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
      });

      await executor.send(mockSubscription, mockPayload);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers;

      expect(headers['X-Webhook-Signature']).toBeDefined();
    });

    it('should return error when webhook URL is not configured', async () => {
      const subscriptionWithoutUrl = {
        ...mockSubscription,
        configuration: {},
      };

      const result = await executor.send(subscriptionWithoutUrl, mockPayload);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Webhook URL not configured');
    });

    it('should return error when webhook request fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: jest.fn().mockResolvedValue('Server error'),
      });

      const result = await executor.send(mockSubscription, mockPayload);

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );

      const result = await executor.send(mockSubscription, mockPayload);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('test', () => {
    const mockSubscription: UserAgentSubscription = {
      id: 'sub_1',
      userId: 'user_123',
      agentDefinitionId: 'agent_1',
      isEnabled: true,
      configuration: {
        url: 'https://example.com/webhook',
      },
      webhookSecret: null,
      lastTestedAt: null,
      lastTestResult: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should send test notification successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map(),
      });

      const result = await executor.test(mockSubscription);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Test webhook sent successfully');
      expect(result.deliveryTime).toBeDefined();
    });

    it('should return error when URL is not configured', async () => {
      const subscriptionWithoutUrl = {
        ...mockSubscription,
        configuration: {},
      };

      const result = await executor.test(subscriptionWithoutUrl);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Webhook URL not configured');
    });
  });
});

