import type {
  User,
  Subscription,
  PaymentHistory,
  Reminder,
  NotificationLog,
  AgentDefinition,
  UserAgentSubscription,
  SystemHealthSnapshot,
  AdminAction,
  SupportNote,
  PaginatedResult,
} from '@er/types';

/**
 * Service interface for admin dashboard data aggregation.
 * Follows ISP - only dashboard-specific aggregation methods.
 */
export interface IAdminDashboardService {
  // Overview Stats
  /**
   * Get dashboard overview statistics.
   * Aggregates key metrics for the main dashboard view.
   */
  getDashboardOverview(): Promise<DashboardOverview>;

  // User Analytics
  /**
   * Get user statistics.
   */
  getUserStats(filters?: UserStatsFilters): Promise<UserStats>;

  /**
   * Get paginated list of users.
   */
  getUserList(filters: UserListFilters): Promise<PaginatedResult<User>>;

  /**
   * Get detailed user information including related data.
   */
  getUserDetails(userId: string): Promise<UserDetails>;

  // Billing Analytics
  /**
   * Get billing statistics.
   */
  getBillingStats(filters?: BillingStatsFilters): Promise<BillingStats>;

  /**
   * Get paginated list of subscriptions.
   */
  getSubscriptionList(
    filters: SubscriptionListFilters,
  ): Promise<PaginatedResult<Subscription>>;

  /**
   * Get payment history with filters.
   */
  getPaymentHistory(
    filters: PaymentHistoryFilters,
  ): Promise<PaginatedResult<PaymentHistory>>;

  /**
   * Get revenue metrics.
   */
  getRevenueMetrics(filters?: RevenueMetricsFilters): Promise<RevenueMetrics>;

  // System Health
  /**
   * Get current system health status.
   */
  getSystemHealth(): Promise<SystemHealth>;

  /**
   * Get system health history.
   */
  getSystemHealthHistory(
    filters: HealthHistoryFilters,
  ): Promise<SystemHealthSnapshot[]>;

  /**
   * Get queue statistics.
   */
  getQueueStats(): Promise<QueueStats>;

  /**
   * Get worker statistics.
   */
  getWorkerStats(): Promise<WorkerStats>;

  // Reminder & Notification Analytics
  /**
   * Get reminder statistics.
   */
  getReminderStats(filters?: ReminderStatsFilters): Promise<ReminderStats>;

  /**
   * Get notification statistics.
   */
  getNotificationStats(
    filters?: NotificationStatsFilters,
  ): Promise<NotificationStats>;

  /**
   * Get escalation statistics.
   */
  getEscalationStats(
    filters?: EscalationStatsFilters,
  ): Promise<EscalationStats>;

  // Agent Analytics
  /**
   * Get agent statistics.
   */
  getAgentStats(filters?: AgentStatsFilters): Promise<AgentStats>;

  /**
   * Get agent subscriptions with filters.
   */
  getAgentSubscriptions(
    filters: AgentSubscriptionFilters,
  ): Promise<PaginatedResult<UserAgentSubscription>>;

  // Audit
  /**
   * Get audit log with filters.
   */
  getAuditLog(filters: AuditLogFilters): Promise<PaginatedResult<AdminAction>>;
}

// ============================================
// Dashboard Overview Types
// ============================================

export interface DashboardOverview {
  mrr: number; // Monthly Recurring Revenue
  activeUsers: number; // Active in last 24h
  activeReminders: number;
  deliveryRate: number; // Percentage
  queueDepth: number;
  recentErrors: number; // Errors in last hour
  timestamp: Date;
}

// ============================================
// User Analytics Types
// ============================================

export interface UserStats {
  total: number;
  active: number; // Active in last 30 days
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

// ============================================
// Billing Analytics Types
// ============================================

export interface BillingStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  pastDueSubscriptions: number;
  mrr: number;
  arr: number; // Annual Recurring Revenue
  churnRate: number; // Percentage
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
  revenueByMonth: Array<{ month: string; revenue: number }>;
  churnRate: number;
  ltv: number; // Lifetime Value
}

export interface RevenueMetricsFilters {
  startDate?: Date;
  endDate?: Date;
}

// ============================================
// System Health Types
// ============================================

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
  averageProcessingTime: number; // milliseconds
}

export interface DatabaseStats {
  connectionPoolSize: number;
  activeConnections: number;
  idleConnections: number;
  slowQueries: number; // Last hour
  queryTime: number; // Average milliseconds
}

export interface RedisStats {
  connected: boolean;
  memoryUsed: number; // bytes
  memoryMax: number; // bytes
  hitRate: number; // Percentage
  keys: number;
}

export interface HealthHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

// ============================================
// Reminder & Notification Types
// ============================================

export interface ReminderStats {
  total: number;
  active: number;
  snoozed: number;
  completed: number;
  archived: number;
  byImportance: Record<string, number>;
  averageCompletionTime: number; // hours
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
  deliveryRate: number; // Percentage
  byAgentType: Record<string, number>;
  averageDeliveryTime: number; // milliseconds
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

// ============================================
// Agent Analytics Types
// ============================================

export interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  totalSubscriptions: number;
  byAgentType: Record<string, AgentTypeStats>;
}

export interface AgentTypeStats {
  subscriptions: number;
  notificationsSent: number;
  successRate: number; // Percentage
  errorRate: number; // Percentage
  averageDeliveryTime: number; // milliseconds
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

// ============================================
// Audit Types
// ============================================

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
