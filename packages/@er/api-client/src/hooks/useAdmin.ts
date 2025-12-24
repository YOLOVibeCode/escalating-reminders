/**
 * Admin API hooks for React Query.
 *
 * NOTE: This file intentionally avoids importing @er/interfaces to keep the
 * web build lightweight and independent of interface package build artifacts.
 * These types are shaped to match AdminController responses.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiClient } from '../client';
import type {
  PaginatedResult,
  User,
  Subscription,
  PaymentHistory,
  SystemHealthSnapshot,
  AdminAction,
  SupportNote,
} from '@er/types';

// ---------------------------
// Response shapes (match API)
// ---------------------------

export interface DashboardOverview {
  mrr: number;
  activeUsers: number;
  activeReminders: number;
  deliveryRate: number; // 0..100
  queueDepth: number;
  recentErrors: number;
  timestamp: string | Date;
}

export interface UserStats {
  total: number;
  active: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  byTier: Record<string, number>;
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
  agentSubscriptions: any[];
  supportNotes: SupportNote[];
  lastLoginAt?: string | Date;
  createdAt: string | Date;
}

export interface BillingStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  canceledSubscriptions: number;
  pastDueSubscriptions: number;
  mrr: number;
  arr: number;
  churnRate: number; // 0..100
  byTier: Record<string, number>;
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
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  revenueByTier: Record<string, number>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  churnRate: number; // 0..100
  ltv: number;
}

export interface RevenueMetricsFilters {
  startDate?: string;
  endDate?: string;
}

export interface QueueInfo {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface QueueStats {
  highPriority: QueueInfo;
  default: QueueInfo;
  lowPriority: QueueInfo;
  scheduled: QueueInfo;
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

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  queues: QueueStats;
  workers: WorkerStats;
  database: DatabaseStats;
  redis: RedisStats;
  timestamp: string | Date;
}

export interface HealthHistoryFilters {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface ReminderStats {
  total: number;
  active: number;
  snoozed: number;
  completed: number;
  archived: number;
  byImportance: Record<string, number>;
  averageCompletionTime: number; // hours
}

export interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number; // 0..100
  byAgentType: Record<string, number>;
  averageDeliveryTime: number; // ms
}

export interface EscalationStats {
  totalEscalations: number;
  activeEscalations: number;
  averageTier: number;
  maxTierReached: number;
  byTier: Record<number, number>;
}

export interface AgentTypeStats {
  subscriptions: number;
  notificationsSent: number;
  successRate: number;
  errorRate: number;
  averageDeliveryTime: number;
}

export interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  totalSubscriptions: number;
  byAgentType: Record<string, AgentTypeStats>;
}

export interface AuditLogFilters {
  adminUserId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

function toQuery(params: Record<string, unknown> = {}): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function createAdminHooks(client: ApiClient) {
  const useAdminDashboard = () => {
    return useQuery<DashboardOverview>({
      queryKey: ['admin', 'dashboard'],
      queryFn: async () => client.get<DashboardOverview>('/admin/dashboard'),
      refetchInterval: 30_000,
    });
  };

  const useUserStats = (filters: { startDate?: string; endDate?: string } = {}) => {
    return useQuery<UserStats>({
      queryKey: ['admin', 'users', 'stats', filters],
      queryFn: async () => client.get<UserStats>(`/admin/users/stats${toQuery(filters)}`),
    });
  };

  const useUsers = (filters: UserListFilters = {}) => {
    return useQuery<PaginatedResult<User>>({
      queryKey: ['admin', 'users', filters],
      queryFn: async () =>
        client.get<PaginatedResult<User>>(`/admin/users${toQuery(filters as Record<string, unknown>)}`),
    });
  };

  const useUserDetails = (userId: string) => {
    return useQuery<UserDetails>({
      queryKey: ['admin', 'users', userId],
      queryFn: async () => client.get<UserDetails>(`/admin/users/${userId}`),
      enabled: !!userId,
    });
  };

  const useSuspendUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ userId, reason }: { userId: string; reason: string }) =>
        client.post<void>(`/admin/users/${userId}/suspend`, { reason }),
      onSuccess: async (_, { userId }) => {
        await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        await queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
      },
    });
  };

  const useUnsuspendUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (userId: string) => client.post<void>(`/admin/users/${userId}/unsuspend`),
      onSuccess: async (_, userId) => {
        await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        await queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
      },
    });
  };

  const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ userId, reason }: { userId: string; reason: string }) =>
        client.delete<void>(`/admin/users/${userId}`, { reason }),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      },
    });
  };

  const useBillingStats = (filters: { startDate?: string; endDate?: string } = {}) => {
    return useQuery<BillingStats>({
      queryKey: ['admin', 'billing', 'stats', filters],
      queryFn: async () => client.get<BillingStats>(`/admin/billing/stats${toQuery(filters)}`),
    });
  };

  const useSubscriptions = (filters: SubscriptionListFilters = {}) => {
    return useQuery<PaginatedResult<Subscription>>({
      queryKey: ['admin', 'subscriptions', filters],
      queryFn: async () =>
        client.get<PaginatedResult<Subscription>>(
          `/admin/subscriptions${toQuery(filters as Record<string, unknown>)}`,
        ),
    });
  };

  const usePaymentHistory = (filters: PaymentHistoryFilters = {}) => {
    return useQuery<PaginatedResult<PaymentHistory>>({
      queryKey: ['admin', 'payments', filters],
      queryFn: async () =>
        client.get<PaginatedResult<PaymentHistory>>(
          `/admin/payments${toQuery(filters as Record<string, unknown>)}`,
        ),
    });
  };

  const useRevenueMetrics = (filters: RevenueMetricsFilters = {}) => {
    return useQuery<RevenueMetrics>({
      queryKey: ['admin', 'revenue', filters],
      queryFn: async () =>
        client.get<RevenueMetrics>(`/admin/revenue${toQuery(filters as Record<string, unknown>)}`),
    });
  };

  const useSystemHealth = () => {
    return useQuery<SystemHealth>({
      queryKey: ['admin', 'system', 'health'],
      queryFn: async () => client.get<SystemHealth>('/admin/system/health'),
      refetchInterval: 30_000,
    });
  };

  const useSystemHealthHistory = (filters: HealthHistoryFilters = {}) => {
    return useQuery<SystemHealthSnapshot[]>({
      queryKey: ['admin', 'system', 'health', 'history', filters],
      queryFn: async () =>
        client.get<SystemHealthSnapshot[]>(
          `/admin/system/health/history${toQuery(filters as Record<string, unknown>)}`,
        ),
    });
  };

  const useReminderStats = (filters: { startDate?: string; endDate?: string } = {}) => {
    return useQuery<ReminderStats>({
      queryKey: ['admin', 'reminders', 'stats', filters],
      queryFn: async () => client.get<ReminderStats>(`/admin/reminders/stats${toQuery(filters)}`),
    });
  };

  const useNotificationStats = (filters: { startDate?: string; endDate?: string; agentType?: string } = {}) => {
    return useQuery<NotificationStats>({
      queryKey: ['admin', 'notifications', 'stats', filters],
      queryFn: async () => client.get<NotificationStats>(`/admin/notifications/stats${toQuery(filters)}`),
    });
  };

  const useEscalationStats = (filters: { startDate?: string; endDate?: string } = {}) => {
    return useQuery<EscalationStats>({
      queryKey: ['admin', 'escalations', 'stats', filters],
      queryFn: async () => client.get<EscalationStats>(`/admin/escalations/stats${toQuery(filters)}`),
    });
  };

  const useAgentStats = (filters: { startDate?: string; endDate?: string } = {}) => {
    return useQuery<AgentStats>({
      queryKey: ['admin', 'agents', 'stats', filters],
      queryFn: async () => client.get<AgentStats>(`/admin/agents/stats${toQuery(filters)}`),
    });
  };

  const useAuditLog = (filters: AuditLogFilters = {}) => {
    return useQuery<PaginatedResult<AdminAction>>({
      queryKey: ['admin', 'audit', filters],
      queryFn: async () =>
        client.get<PaginatedResult<AdminAction>>(
          `/admin/audit${toQuery(filters as Record<string, unknown>)}`,
        ),
    });
  };

  const useCreateSupportNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (data: { userId: string; content: string }) =>
        client.post<SupportNote>('/admin/support-notes', data),
      onSuccess: async (_, { userId }) => {
        await queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
      },
    });
  };

  const useUpdateSupportNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ noteId, content }: { noteId: string; content: string }) =>
        client.patch<SupportNote>(`/admin/support-notes/${noteId}`, { content }),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      },
    });
  };

  const useDeleteSupportNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (noteId: string) => client.delete<void>(`/admin/support-notes/${noteId}`),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      },
    });
  };

  return {
    useAdminDashboard,
    useUserStats,
    useUsers,
    useUserDetails,
    useSuspendUser,
    useUnsuspendUser,
    useDeleteUser,
    useBillingStats,
    useSubscriptions,
    usePaymentHistory,
    useRevenueMetrics,
    useSystemHealth,
    useSystemHealthHistory,
    useReminderStats,
    useNotificationStats,
    useEscalationStats,
    useAgentStats,
    useAuditLog,
    useCreateSupportNote,
    useUpdateSupportNote,
    useDeleteSupportNote,
  };
}

export type AdminHooks = ReturnType<typeof createAdminHooks>;
