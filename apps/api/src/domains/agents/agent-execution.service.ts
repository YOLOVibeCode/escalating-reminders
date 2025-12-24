import { Injectable, Logger, Inject } from '@nestjs/common';
import { UserAgentSubscriptionRepository } from './user-agent-subscription.repository';
import type {
  IAgentExecutionService,
  IAgentExecutor,
  NotificationPayload,
  AgentCommand,
  SendResult,
  CommandResult,
} from '@er/interfaces';
import type { UserAgentSubscription } from '@er/types';

/**
 * Agent execution service.
 * Implements IAgentExecutionService interface.
 * Uses a registry of agent executors to route execution to the correct implementation.
 */
@Injectable()
export class AgentExecutionService implements IAgentExecutionService {
  private readonly logger = new Logger(AgentExecutionService.name);
  private readonly executors = new Map<string, IAgentExecutor>();

  constructor(
    private readonly subscriptionRepository: UserAgentSubscriptionRepository,
    @Inject('AGENT_EXECUTORS') private readonly injectedExecutors: IAgentExecutor[] = [],
  ) {
    // Register injected executors
    if (injectedExecutors && injectedExecutors.length > 0) {
      for (const executor of injectedExecutors) {
        this.registerExecutor(executor);
      }
    }
  }

  /**
   * Register an agent executor.
   * Called automatically for injected executors, or can be called manually.
   */
  registerExecutor(executor: IAgentExecutor): void {
    if (this.executors.has(executor.agentType)) {
      this.logger.warn(
        `Agent executor for type ${executor.agentType} already registered. Overwriting.`,
      );
    }
    this.executors.set(executor.agentType, executor);
    this.logger.log(`Registered agent executor: ${executor.agentType}`);
  }

  /**
   * Get executor for agent type.
   */
  private getExecutor(agentType: string): IAgentExecutor | null {
    return this.executors.get(agentType) || null;
  }

  async execute(
    agentType: string,
    userId: string,
    payload: NotificationPayload,
  ): Promise<SendResult> {
    this.logger.log(
      `Executing agent ${agentType} for user ${userId}, notification ${payload.notificationId}`,
    );

    // 1. Find user's subscription for this agent
    const subscription =
      await this.subscriptionRepository.findByUserAndAgentType(
        userId,
        agentType,
      );

    if (!subscription || !subscription.isEnabled) {
      return {
        success: false,
        error: `User ${userId} is not subscribed to agent ${agentType} or subscription is disabled`,
      };
    }

    // 2. Get executor for this agent type
    const executor = this.getExecutor(agentType);
    if (!executor) {
      this.logger.error(
        `No executor registered for agent type: ${agentType}. Available types: ${Array.from(this.executors.keys()).join(', ')}`,
      );
      return {
        success: false,
        error: `Agent type ${agentType} is not supported or executor not registered`,
      };
    }

    // 3. Execute via the agent executor
    try {
      return await executor.send(subscription, payload);
    } catch (error) {
      this.logger.error(
        `Error executing agent ${agentType}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async handleCommand(
    agentType: string,
    userId: string,
    command: AgentCommand,
  ): Promise<CommandResult> {
    this.logger.log(
      `Handling command ${command.action} from agent ${agentType} for user ${userId}`,
    );

    // 1. Find user's subscription for this agent
    const subscription =
      await this.subscriptionRepository.findByUserAndAgentType(
        userId,
        agentType,
      );

    if (!subscription) {
      return {
        success: false,
        error: `User ${userId} is not subscribed to agent ${agentType}`,
      };
    }

    // 2. Get executor for this agent type
    const executor = this.getExecutor(agentType);
    if (!executor) {
      this.logger.error(
        `No executor registered for agent type: ${agentType}`,
      );
      return {
        success: false,
        error: `Agent type ${agentType} is not supported or executor not registered`,
      };
    }

    // 3. Handle command via the agent executor
    try {
      return await executor.handleCommand(subscription, command);
    } catch (error) {
      this.logger.error(
        `Error handling command for agent ${agentType}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test an agent subscription.
   * Used by the subscription service.
   */
  async testAgent(
    subscription: UserAgentSubscription,
  ): Promise<{ success: boolean; message: string; deliveryTime?: number }> {
    const executor = this.getExecutor(
      (subscription as any).agentDefinition?.type || 'unknown',
    );

    if (!executor) {
      return {
        success: false,
        message: 'Agent executor not found',
      };
    }

    return executor.test(subscription);
  }
}
