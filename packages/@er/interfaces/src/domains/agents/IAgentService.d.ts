import type { AgentDefinition, UserAgentSubscription } from '@er/types';
export interface IAgentDefinitionService {
    findAll(userId?: string): Promise<AgentDefinition[]>;
    findByType(agentType: string): Promise<AgentDefinition>;
}
export interface IUserAgentSubscriptionService {
    findByUser(userId: string): Promise<UserAgentSubscription[]>;
    subscribe(userId: string, agentDefinitionId: string, configuration: Record<string, unknown>): Promise<UserAgentSubscription>;
    update(userId: string, subscriptionId: string, configuration: Record<string, unknown>): Promise<UserAgentSubscription>;
    unsubscribe(userId: string, subscriptionId: string): Promise<void>;
    test(userId: string, subscriptionId: string): Promise<TestResult>;
}
export interface IAgentExecutionService {
    execute(agentType: string, userId: string, payload: NotificationPayload): Promise<SendResult>;
    handleCommand(agentType: string, userId: string, command: AgentCommand): Promise<CommandResult>;
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
//# sourceMappingURL=IAgentService.d.ts.map