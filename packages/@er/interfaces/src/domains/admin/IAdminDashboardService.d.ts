import type { User, Subscription, PaymentHistory, UserAgentSubscription, SystemHealthSnapshot, AdminAction, SupportNote, PaginatedResult } from '@er/types';
export interface IAdminDashboardService {
    getDashboardOverview(): Promise<DashboardOverview>;
    getUserStats(filters?: UserStatsFilters): Promise<UserStats>;
    getUserList(filters: UserListFilters): Promise<PaginatedResult<User>>;
    getUserDetails(userId: string): Promise<UserDetails>;
    getBillingStats(filters?: BillingStatsFilters): Promise<BillingStats>;
    getSubscriptionList(filters: SubscriptionListFilters): Promise<PaginatedResult<Subscription>>;
    getPaymentHistory(filters: PaymentHistoryFilters): Promise<PaginatedResult<PaymentHistory>>;
    getRevenueMetrics(filters?: RevenueMetricsFilters): Promise<RevenueMetrics>;
    getSystemHealth(): Promise<SystemHealth>;
    getSystemHealthHistory(filters: HealthHistoryFilters): Promise<SystemHealthSnapshot[]>;
    getQueueStats(): Promise<QueueStats>;
    getWorkerStats(): Promise<WorkerStats>;
    getReminderStats(filters?: ReminderStatsFilters): Promise<ReminderStats>;
    getNotificationStats(filters?: NotificationStatsFilters): Promise<NotificationStats>;
    getEscalationStats(filters?: EscalationStatsFilters): Promise<EscalationStats>;
    getAgentStats(filters?: AgentStatsFilters): Promise<AgentStats>;
    getAgentSubscriptions(filters: AgentSubscriptionFilters): Promise<PaginatedResult<UserAgentSubscription>>;
    getAuditLog(filters: AuditLogFilters): Promise<PaginatedResult<AdminAction>>;
}
export interface DashboardOverview {
    mrr: number;
    activeUsers: number;
    activeReminders: number;
    deliveryRate: number;
    queueDepth: number;
    recentErrors: number;
    timestamp: Date;
}
export interface UserStats {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    byTier: Record<string, number>;
}
export interface UserStatsFilters {
    startDate?: Date;
    endDate?: Date;
}
export interface UserListFilters {
    search?: string;
    tier?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}
export interface UserDetails {
    user: User;
    subscription?: Subscription;
    remindersCount: number;
    activeRemindersCount: number;
    agentSubscriptions: UserAgentSubscription[];
    supportNotes: SupportNote[];
    lastLoginAt?: Date;
    createdAt: Date;
}
export interface BillingStats {
    totalSubscriptions: number;
    activeSubscriptions: number;
    canceledSubscriptions: number;
    pastDueSubscriptions: number;
    mrr: number;
    arr: number;
    churnRate: number;
    byTier: Record<string, number>;
}
export interface BillingStatsFilters {
    startDate?: Date;
    endDate?: Date;
}
export interface SubscriptionListFilters {
    status?: string;
    tier?: string;
    page?: number;
    pageSize?: number;
}
export interface PaymentHistoryFilters {
    subscriptionId?: string;
    userId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
}
export interface RevenueMetrics {
    mrr: number;
    arr: number;
    totalRevenue: number;
    revenueByTier: Record<string, number>;
    revenueByMonth: Array<{
        month: string;
        revenue: number;
    }>;
    churnRate: number;
    ltv: number;
}
export interface RevenueMetricsFilters {
    startDate?: Date;
    endDate?: Date;
}
export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'down';
    queues: QueueStats;
    workers: WorkerStats;
    database: DatabaseStats;
    redis: RedisStats;
    timestamp: Date;
}
export interface QueueStats {
    highPriority: QueueInfo;
    default: QueueInfo;
    lowPriority: QueueInfo;
    scheduled: QueueInfo;
}
export interface QueueInfo {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}
export interface WorkerStats {
    totalWorkers: number;
    activeWorkers: number;
    idleWorkers: number;
    jobsProcessed: number;
    jobsFailed: number;
    averageProcessingTime: number;
}
export interface DatabaseStats {
    connectionPoolSize: number;
    activeConnections: number;
    idleConnections: number;
    slowQueries: number;
    queryTime: number;
}
export interface RedisStats {
    connected: boolean;
    memoryUsed: number;
    memoryMax: number;
    hitRate: number;
    keys: number;
}
export interface HealthHistoryFilters {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}
export interface ReminderStats {
    total: number;
    active: number;
    snoozed: number;
    completed: number;
    archived: number;
    byImportance: Record<string, number>;
    averageCompletionTime: number;
}
export interface ReminderStatsFilters {
    startDate?: Date;
    endDate?: Date;
}
export interface NotificationStats {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    byAgentType: Record<string, number>;
    averageDeliveryTime: number;
}
export interface NotificationStatsFilters {
    startDate?: Date;
    endDate?: Date;
    agentType?: string;
}
export interface EscalationStats {
    totalEscalations: number;
    activeEscalations: number;
    averageTier: number;
    maxTierReached: number;
    byTier: Record<number, number>;
}
export interface EscalationStatsFilters {
    startDate?: Date;
    endDate?: Date;
}
export interface AgentStats {
    totalAgents: number;
    activeAgents: number;
    totalSubscriptions: number;
    byAgentType: Record<string, AgentTypeStats>;
}
export interface AgentTypeStats {
    subscriptions: number;
    notificationsSent: number;
    successRate: number;
    errorRate: number;
    averageDeliveryTime: number;
}
export interface AgentStatsFilters {
    startDate?: Date;
    endDate?: Date;
}
export interface AgentSubscriptionFilters {
    agentType?: string;
    userId?: string;
    isEnabled?: boolean;
    page?: number;
    pageSize?: number;
}
export interface AuditLogFilters {
    adminUserId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
}
//# sourceMappingURL=IAdminDashboardService.d.ts.map