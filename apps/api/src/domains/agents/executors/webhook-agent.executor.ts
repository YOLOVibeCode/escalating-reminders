import { Injectable, Logger } from '@nestjs/common';
import type { IAgentExecutor } from '@er/interfaces';
import type {
  NotificationPayload,
  AgentCommand,
  SendResult,
  CommandResult,
  UserAgentSubscription,
} from '@er/types';
import { generateWebhookSignature } from '@er/utils';

/**
 * Webhook agent executor.
 * Sends notifications via HTTP POST to user-configured webhook URLs.
 */
@Injectable()
export class WebhookAgentExecutor implements IAgentExecutor {
  readonly agentType = 'webhook';
  private readonly logger = new Logger(WebhookAgentExecutor.name);

  async send(
    subscription: UserAgentSubscription,
    payload: NotificationPayload,
  ): Promise<SendResult> {
    const config = subscription.configuration as {
      url?: string;
      method?: string;
      headers?: Record<string, string>;
    };

    if (!config?.url) {
      return {
        success: false,
        error: 'Webhook URL not configured',
      };
    }

    try {
      const webhookUrl = config.url as string;
      const method = (config.method || 'POST').toUpperCase();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'EscalatingReminders/1.0',
        ...(config.headers || {}),
      };

      // Sign payload with webhook secret if available
      const body = {
        notificationId: payload.notificationId,
        reminderId: payload.reminderId,
        title: payload.title,
        message: payload.message,
        escalationTier: payload.escalationTier,
        importance: payload.importance,
        actions: payload.actions,
        actionsUrl: payload.actionsUrl,
        metadata: payload.metadata,
        timestamp: new Date().toISOString(),
      };

      if (subscription.webhookSecret) {
        const signature = generateWebhookSignature(
          JSON.stringify(body),
          subscription.webhookSecret,
        );
        headers['X-Webhook-Signature'] = signature;
      }

      // Make HTTP request
      const response = await fetch(webhookUrl, {
        method,
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        this.logger.warn(
          `Webhook request failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
        return {
          success: false,
          error: `Webhook returned ${response.status}: ${errorText}`,
        };
      }

      const messageId = response.headers.get('X-Message-Id') || `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.logger.log(
        `Webhook notification sent successfully: ${payload.notificationId} -> ${webhookUrl}`,
      );

      return {
        success: true,
        messageId,
        deliveredAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error sending webhook notification: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleCommand(
    subscription: UserAgentSubscription,
    command: AgentCommand,
  ): Promise<CommandResult> {
    // Webhooks can receive commands via callback URLs
    // For now, we'll just log it - actual command handling will be done
    // by the webhook endpoint that receives the callback
    this.logger.log(
      `Webhook command received: ${command.action} for reminder ${command.reminderId}`,
    );

    return {
      success: true,
      message: `Command ${command.action} received via webhook`,
    };
  }

  async test(subscription: UserAgentSubscription): Promise<{
    success: boolean;
    message: string;
    deliveryTime?: number;
  }> {
    const config = subscription.configuration as { url?: string };

    if (!config?.url) {
      return {
        success: false,
        message: 'Webhook URL not configured',
      };
    }

    const startTime = Date.now();
    const testPayload: NotificationPayload = {
      notificationId: `test_${Date.now()}`,
      userId: subscription.userId,
      reminderId: 'test_reminder',
      title: 'Test Notification',
      message: 'This is a test notification from Escalating Reminders',
      escalationTier: 1,
      importance: 'normal',
      actions: [],
      metadata: { test: true },
    };

    const result = await this.send(subscription, testPayload);
    const deliveryTime = Date.now() - startTime;

    if (result.success) {
      return {
        success: true,
        message: `Test webhook sent successfully to ${config.url}`,
        deliveryTime,
      };
    } else {
      return {
        success: false,
        message: `Test webhook failed: ${result.error}`,
        deliveryTime,
      };
    }
  }
}

