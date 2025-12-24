import type { UserAgentSubscription } from '@er/types';
import type { NotificationPayload, AgentCommand, SendResult, CommandResult } from './IAgentService';
export interface IAgentExecutor {
    readonly agentType: string;
    send(subscription: UserAgentSubscription, payload: NotificationPayload): Promise<SendResult>;
    handleCommand(subscription: UserAgentSubscription, command: AgentCommand): Promise<CommandResult>;
    test(subscription: UserAgentSubscription): Promise<{
        success: boolean;
        message: string;
        deliveryTime?: number;
    }>;
}
//# sourceMappingURL=IAgentExecutor.d.ts.map