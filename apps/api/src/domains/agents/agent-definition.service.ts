import { Injectable } from '@nestjs/common';
import { AgentDefinitionRepository } from './agent-definition.repository';
import { AuthRepository } from '../auth/auth.repository';
import { NotFoundError } from '../../common/exceptions';
import type { IAgentDefinitionService } from '@er/interfaces';
import type { AgentDefinition, SubscriptionTier } from '@er/types';

/**
 * Agent definition service.
 * Implements IAgentDefinitionService interface.
 * Handles agent definition business logic.
 */
@Injectable()
export class AgentDefinitionService implements IAgentDefinitionService {
  constructor(
    private readonly repository: AgentDefinitionRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async findAll(userId?: string): Promise<AgentDefinition[]> {
    const allAgents = await this.repository.findAll();

    // If userId provided, filter by subscription tier
    if (userId) {
      const user = await this.authRepository.findByIdWithSubscription(userId);
      if (user && user.subscription) {
        const userTier = user.subscription.tier;
        return this.filterByTier(allAgents, userTier);
      }
    }

    return allAgents;
  }

  async findByType(agentType: string): Promise<AgentDefinition> {
    const agent = await this.repository.findByType(agentType);

    if (!agent) {
      throw new NotFoundError(`Agent with type ${agentType} not found`);
    }

    return agent;
  }

  /**
   * Filter agents by subscription tier.
   * Only return agents that are available for the user's tier.
   */
  private filterByTier(
    agents: AgentDefinition[],
    userTier: SubscriptionTier,
  ): AgentDefinition[] {
    const tierOrder: SubscriptionTier[] = ['FREE', 'PERSONAL', 'PRO', 'FAMILY'];

    const userTierIndex = tierOrder.indexOf(userTier);

    return agents.filter((agent) => {
      const agentTierIndex = tierOrder.indexOf(agent.minimumTier);
      return agentTierIndex <= userTierIndex;
    });
  }
}

