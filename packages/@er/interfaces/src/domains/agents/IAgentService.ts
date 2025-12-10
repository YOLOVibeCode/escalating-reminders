import type { AgentDefinition, UserAgentSubscription } from '@er/types';

/**
 * Service interface for agent definition operations.
 * Follows ISP - only agent catalog methods.
 */
export interface IAgentDefinitionService {
  /**
   * Find all available agents.
   */
  findAll(userId?: string): Promise<AgentDefinition[]>;

  /**
   * Find an agent by type.
   * @throws {NotFoundError} If agent doesn't exist
   */
  findByType(agentType: string): Promise<AgentDefinition>;
}

/**
 * Service interface for user agent subscriptions.
 * Separated per ISP - subscriptions are distinct from definitions.
 */
export interface IUserAgentSubscriptionService {
  /**
   * Find all subscriptions for a user.
   */
  findByUser(userId: string): Promise<UserAgentSubscription[]>;

  /**
   * Subscribe to an agent.
   * @throws {ValidationError} If configuration is invalid
   * @throws {QuotaExceededError} If user exceeds agent limit
   */
  subscribe(
    userId: string,
    agentDefinitionId: string,
    configuration: Record<string, unknown>,
  ): Promise<UserAgentSubscription>;

  /**
   * Update agent subscription configuration.
   * @throws {NotFoundError} If subscription doesn't exist
   */
  update(
    userId: string,
    subscriptionId: string,
    configuration: Record<string, unknown>,
  ): Promise<UserAgentSubscription>;

  /**
   * Unsubscribe from an agent.
   * @throws {NotFoundError} If subscription doesn't exist
   */
  unsubscribe(userId: string, subscriptionId: string): Promise<void>;

  /**
   * Test agent configuration.
   * @throws {NotFoundError} If subscription doesn't exist
   */
  test(userId: string, subscriptionId: string): Promise<TestResult>;
}

/**
 * Service interface for agent execution.
 * Separated per ISP - execution is distinct from subscription management.
 */
export interface IAgentExecutionService {
  /**
   * Execute an agent to send a notification.
   */
  execute(
    agentType: string,
    userId: string,
    payload: NotificationPayload,
  ): Promise<SendResult>;

  /**
   * Handle a command from an agent (e.g., SMS reply).
   */
  handleCommand(
    agentType: string,
    userId: string,
    command: AgentCommand,
  ): Promise<CommandResult>;
}

export interface NotificationPayload {
  notificationId: string;
  userId: string;
  reminderId: string;
  title: string;
  message: string;
  escalationTier: number;
  importance: string;
  actions: string[];
  actionsUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentCommand {
  userId: string;
  reminderId?: string;
  action: 'snooze' | 'dismiss' | 'complete';
  data?: Record<string, unknown>;
  rawInput?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  deliveredAt?: Date;
  error?: string;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  deliveryTime?: number;
}

