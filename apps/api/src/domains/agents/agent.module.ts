import type { IAgentExecutor } from '@er/interfaces';
import { Module } from '@nestjs/common';

import { AgentDefinitionRepository } from './agent-definition.repository';
import { AgentDefinitionService } from './agent-definition.service';
import { AgentExecutionService } from './agent-execution.service';
import { AgentController } from './agent.controller';
import { EmailAgentExecutor } from './executors/email-agent.executor';
import { SmsAgentExecutor } from './executors/sms-agent.executor';
import { WebhookAgentExecutor } from './executors/webhook-agent.executor';
import { UserAgentSubscriptionRepository } from './user-agent-subscription.repository';
import { UserAgentSubscriptionService } from './user-agent-subscription.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { SmsModule } from '../sms/sms.module';

/**
 * Agent module.
 * Provides agent definition, subscription, and execution functionality.
 */
@Module({
  imports: [DatabaseModule, AuthModule, SmsModule],
  controllers: [AgentController],
  providers: [
    AgentDefinitionService,
    AgentDefinitionRepository,
    UserAgentSubscriptionService,
    UserAgentSubscriptionRepository,
    // Agent executors
    WebhookAgentExecutor,
    EmailAgentExecutor,
    SmsAgentExecutor,
    // Agent execution service (will receive executors via injection)
    AgentExecutionService,
    // Provide executors as a token for injection
    {
      provide: 'AGENT_EXECUTORS',
      useFactory: (
        webhookExecutor: WebhookAgentExecutor,
        emailExecutor: EmailAgentExecutor,
        smsExecutor: SmsAgentExecutor,
      ): IAgentExecutor[] => {
        return [webhookExecutor, emailExecutor, smsExecutor];
      },
      inject: [WebhookAgentExecutor, EmailAgentExecutor, SmsAgentExecutor],
    },
  ],
  exports: [
    AgentDefinitionService,
    UserAgentSubscriptionService,
    AgentExecutionService,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- NestJS @Module container
export class AgentModule {}

