import { Injectable } from '@nestjs/common';
import { UserAgentSubscriptionRepository } from './user-agent-subscription.repository';
import { AgentDefinitionRepository } from './agent-definition.repository';
import { AuthRepository } from '../auth/auth.repository';
import { AgentExecutionService } from './agent-execution.service';
import { SUBSCRIPTION_TIERS } from '@er/constants';
import {
  NotFoundError,
  ForbiddenError,
  QuotaExceededError,
  ValidationError,
} from '../../common/exceptions';
import type { IUserAgentSubscriptionService } from '@er/interfaces';
import type { UserAgentSubscription, TestResult } from '@er/types';
import { randomBytes } from 'crypto';

/**
 * User agent subscription service.
 * Implements IUserAgentSubscriptionService interface.
 * Handles user agent subscription business logic.
 */
@Injectable()
export class UserAgentSubscriptionService
  implements IUserAgentSubscriptionService
{
  constructor(
    private readonly subscriptionRepository: UserAgentSubscriptionRepository,
    private readonly agentDefinitionRepository: AgentDefinitionRepository,
    private readonly authRepository: AuthRepository,
    private readonly agentExecutionService: AgentExecutionService,
  ) {}

  async findByUser(userId: string): Promise<UserAgentSubscription[]> {
    return this.subscriptionRepository.findByUser(userId);
  }

  async subscribe(
    userId: string,
    agentDefinitionId: string,
    configuration: Record<string, unknown>,
  ): Promise<UserAgentSubscription> {
    // 1. Verify agent exists
    const agent = await this.agentDefinitionRepository.findByType(
      agentDefinitionId,
    );
    if (!agent) {
      throw new NotFoundError(`Agent with ID ${agentDefinitionId} not found`);
    }

    // 2. Check user subscription tier
    const user = await this.authRepository.findByIdWithSubscription(userId);
    if (!user || !user.subscription) {
      throw new NotFoundError('User subscription not found');
    }

    const userTier = user.subscription.tier;
    const tierConfig = SUBSCRIPTION_TIERS[userTier];

    // 3. Check if user tier meets agent minimum tier
    const tierOrder = ['FREE', 'PERSONAL', 'PRO', 'FAMILY'];
    const userTierIndex = tierOrder.indexOf(userTier);
    const agentTierIndex = tierOrder.indexOf(agent.minimumTier);

    if (agentTierIndex > userTierIndex) {
      throw new ForbiddenError(
        `Agent ${agent.name} requires ${agent.minimumTier} tier or higher. Your current tier is ${userTier}.`,
      );
    }

    // 4. Check agent quota
    const currentCount = await this.subscriptionRepository.countByUser(userId);
    const maxAgents = tierConfig.limits.maxAgents;

    if (maxAgents !== -1 && currentCount >= maxAgents) {
      throw new QuotaExceededError(
        `You have reached the maximum number of agents (${maxAgents}) for your ${userTier} plan.`,
      );
    }

    // 5. Check if already subscribed
    const existing = await this.subscriptionRepository.findByUserAndAgentType(
      userId,
      agent.type,
    );
    if (existing) {
      throw new ValidationError(
        `You are already subscribed to agent ${agent.name}`,
      );
    }

    // 6. Generate webhook secret if agent supports webhooks
    const capabilities = agent.capabilities as Record<string, unknown>;
    const webhookSecret =
      capabilities.canPull || capabilities.canReceiveCommands
        ? randomBytes(32).toString('hex')
        : undefined;

    // 7. Create subscription
    return this.subscriptionRepository.create({
      userId,
      agentDefinitionId: agent.id,
      isEnabled: true,
      configuration,
      webhookSecret,
    });
  }

  async update(
    userId: string,
    subscriptionId: string,
    configuration: Record<string, unknown>,
  ): Promise<UserAgentSubscription> {
    // 1. Check ownership
    const subscription = await this.subscriptionRepository.findById(
      subscriptionId,
    );
    if (!subscription) {
      throw new NotFoundError(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }
    if (subscription.userId !== userId) {
      throw new ForbiddenError(
        'You do not have permission to update this subscription',
      );
    }

    // 2. Update subscription
    return this.subscriptionRepository.update(subscriptionId, {
      configuration,
    });
  }

  async unsubscribe(userId: string, subscriptionId: string): Promise<void> {
    // 1. Check ownership
    const subscription = await this.subscriptionRepository.findById(
      subscriptionId,
    );
    if (!subscription) {
      throw new NotFoundError(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }
    if (subscription.userId !== userId) {
      throw new ForbiddenError(
        'You do not have permission to unsubscribe from this agent',
      );
    }

    // 2. Delete subscription
    await this.subscriptionRepository.delete(subscriptionId);
  }

  async test(userId: string, subscriptionId: string): Promise<TestResult> {
    // 1. Check ownership
    const subscription = await this.subscriptionRepository.findById(
      subscriptionId,
    );
    if (!subscription) {
      throw new NotFoundError(
        `Subscription with ID ${subscriptionId} not found`,
      );
    }
    if (subscription.userId !== userId) {
      throw new ForbiddenError(
        'You do not have permission to test this subscription',
      );
    }

    // 2. Update last tested timestamp
    await this.subscriptionRepository.update(subscriptionId, {
      lastTestedAt: new Date(),
      lastTestResult: 'pending',
    });

    // 3. Test via agent execution service
    const testResult = await this.agentExecutionService.testAgent(subscription);

    // 4. Update test result
    await this.subscriptionRepository.update(subscriptionId, {
      lastTestResult: testResult.success ? 'success' : 'failed',
    });

    return testResult as TestResult;
  }
}

