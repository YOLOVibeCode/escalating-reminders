import { Module } from '@nestjs/common';
import { AgentDefinitionService } from './agent-definition.service';
import { AgentDefinitionRepository } from './agent-definition.repository';
import { UserAgentSubscriptionService } from './user-agent-subscription.service';
import { UserAgentSubscriptionRepository } from './user-agent-subscription.repository';
import { AgentExecutionService } from './agent-execution.service';
import { AgentController } from './agent.controller';
import { WebhookAgentExecutor } from './executors/webhook-agent.executor';
import { EmailAgentExecutor } from './executors/email-agent.executor';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import type { IAgentExecutor } from '@er/interfaces';

/**
 * Agent module.
 * Provides agent definition, subscription, and execution functionality.
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AgentController],
  providers: [
    AgentDefinitionService,
    AgentDefinitionRepository,
    UserAgentSubscriptionService,
    UserAgentSubscriptionRepository,
    // Agent executors
    WebhookAgentExecutor,
    EmailAgentExecutor,
    // Agent execution service (will receive executors via injection)
    AgentExecutionService,
    // Provide executors as a token for injection
    {
      provide: 'AGENT_EXECUTORS',
      useFactory: (
        webhookExecutor: WebhookAgentExecutor,
        emailExecutor: EmailAgentExecutor,
      ): IAgentExecutor[] => {
        return [webhookExecutor, emailExecutor];
      },
      inject: [WebhookAgentExecutor, EmailAgentExecutor],
    },
  ],
  exports: [
    AgentDefinitionService,
    UserAgentSubscriptionService,
    AgentExecutionService,
  ],
})
export class AgentModule {}

