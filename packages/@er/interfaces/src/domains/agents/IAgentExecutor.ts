import type { UserAgentSubscription } from '@er/types';
import type { NotificationPayload, AgentCommand, SendResult, CommandResult } from './IAgentService';

/**
 * Interface for agent executors.
 * Each agent type (email, SMS, webhook, push) implements this interface.
 * Follows ISP - only execution methods.
 */
export interface IAgentExecutor {
  /**
   * Agent type identifier (e.g., 'email', 'sms', 'webhook', 'push').
   */
  readonly agentType: string;

  /**
   * Send a notification via this agent.
   * @param subscription User's agent subscription with configuration
   * @param payload Notification payload
   * @returns Send result with success status and message ID
   */
  send(
    subscription: UserAgentSubscription,
    payload: NotificationPayload,
  ): Promise<SendResult>;

  /**
   * Handle a command from the agent (e.g., SMS reply, webhook callback).
   * @param subscription User's agent subscription
   * @param command Command from agent
   * @returns Command result
   */
  handleCommand(
    subscription: UserAgentSubscription,
    command: AgentCommand,
  ): Promise<CommandResult>;

  /**
   * Test the agent configuration.
   * @param subscription User's agent subscription
   * @returns Test result
   */
  test(subscription: UserAgentSubscription): Promise<{
    success: boolean;
    message: string;
    deliveryTime?: number;
  }>;
}

