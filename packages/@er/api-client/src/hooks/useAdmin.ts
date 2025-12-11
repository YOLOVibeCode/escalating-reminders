/**
 * Admin API hooks for React Query.
 * Provides type-safe hooks for admin dashboard operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiClient } from '../client';
import type {
  AdminUser,
  AdminAction,
  SupportNote,
  SystemHealthSnapshot,
  User,
  Subscription,
  Reminder,
  NotificationLog,
  AdminRole,
} from '@er/types';

// ============================================================================
// Types
// ============================================================================

export interface DashboardOverview {
  mrr: number;
  arr: number;
  activeUsers: number;
  newUsersToday: number;
  activeReminders: number;
  notificationDeliveryRate: number;
  queueDepth: {
    reminder: number;
    notification: number;
    escalation: number;
    agent: number;
  };
  recentErrors: number;
}

export interface UserStats {
  total: number;
  active: number;
  suspended: number;
  newToday: number;
  newThisWeek: number;
  byTier: {
    FREE: number;
    BASIC: number;
    PRO: number;
    ENTERPRISE: number;
  };
}

export interface BillingStats {
  mrr: number;
  arr: number;
  ltv: number;
  churnRate: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  newSubscriptionsToday: number;
  revenueByTier: {
    FREE: number;
    BASIC: number;
    PRO: number;
    ENTERPRISE: number;
  };
}

export interface RevenueMetrics {
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface SystemHealth {
  timestamp: Date;
  queues: {
    reminder: { waiting: number; active: number; completed: number; failed: number };
    notification: { waiting: number; active: number; completed: number; failed: number };
    escalation: { waiting: number; active: number; completed: number; failed: number };
    agent: { waiting: number; active: number; completed: number; failed: number };
  };
  workers: {
    total: number;
    active: number;
    idle: number;
  };
  database: {
    status: 'healthy' | 'degraded' | 'down';
    connections: number;
  };
  redis: {
    status: 'healthy' | 'degraded' | 'down';
    memoryUsedMb: number;
  };
}

export interface ReminderStats {
  total: number;
  active: number;
  completed: number;
  snoozed: number;
  escalated: number;
  averageCompletionTime: number;
}

export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  averageDeliveryTime: number;
}

export interface EscalationStats {
  total: number;
  active: number;
  completed: number;
  averageEscalationLevel: number;
  maxLevelReached: number;
}

export interface AgentStats {
  total: number;
  active: number;
  byType: {
    WEBHOOK: number;
    SLACK: number;
    EMAIL: number;
    SMS: number;
  };
  successRate: number;
  averageExecutionTime: number;
}

export interface UserDetails {
  user: User;
  subscription: Subscription | null;
  reminders: Reminder[];
  agentSubscriptions: any[];
  supportNotes: SupportNote[];
  totalSpent: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserListFilters {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  status?: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

export interface SuspendUserRequest {
  reason: string;
}

export interface CreateSupportNoteRequest {
  userId: string;
  content: string;
}

export interface UpdateSupportNoteRequest {
  content: string;
}

// ============================================================================
// Admin API Hooks Factory
// ============================================================================

export function createAdminHooks(client: ApiClient) {
  /**
   * Dashboard Overview
   */
  const useAdminDashboard = () => {
    return useQuery<DashboardOverview>({
      queryKey: ['admin', 'dashboard'],
      queryFn: async () => {
        const response = await client.get<DashboardOverview>('/admin/dashboard');
        return response;
      },
      refetchInterval: 30000, // Refresh every 30 seconds
    });
  };

  /**
   * User Management
   */
  const useUsers = (filters: UserListFilters = {}) => {
    return useQuery<PaginatedResult<User>>({
      queryKey: ['admin', 'users', filters],
      queryFn: async () => {
        const response = await client.get<PaginatedResult<User>>('/admin/users', filters);
        return response;
      },
    });
  };

  const useUserDetails = (userId: string) => {
    return useQuery<UserDetails>({
      queryKey: ['admin', 'users', userId],
      queryFn: async () => {
        const response = await client.get<UserDetails>(`/admin/users/${userId}`);
        return response;
      },
      enabled: !!userId,
    });
  };

  const useSuspendUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
        const response = await client.post<void>(`/admin/users/${userId}/suspend`, { reason });
        return response;
      },
      onSuccess: (_, { userId }) => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
      },
    });
  };

  const useUnsuspendUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (userId: string) => {
        const response = await client.post<void>(`/admin/users/${userId}/unsuspend`);
        return response;
      },
      onSuccess: (_, userId) => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
      },
    });
  };

  const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
        const response = await client.delete<void>(`/admin/users/${userId}`, { reason });
        return response;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      },
    });
  };

  /**
   * User Stats
   */
  const useUserStats = () => {
    return useQuery<UserStats>({
      queryKey: ['admin', 'users', 'stats'],
      queryFn: async () => {
        const response = await client.get<UserStats>('/admin/users/stats');
        return response;
      },
    });
  };

  /**
   * Billing
   */
  const useBillingStats = (filters?: { startDate?: string; endDate?: string }) => {
    return useQuery<BillingStats>({
      queryKey: ['admin', 'billing', 'stats', filters],
      queryFn: async () => {
        const response = await client.get<BillingStats>('/admin/billing/stats', filters);
        return response;
      },
    });
  };

  const useRevenueMetrics = (filters?: { months?: number }) => {
    return useQuery<RevenueMetrics>({
      queryKey: ['admin', 'revenue', filters],
      queryFn: async () => {
        const response = await client.get<RevenueMetrics>('/admin/revenue', filters);
        return response;
      },
    });
  };

  const useSubscriptions = (filters: { page?: number; limit?: number } = {}) => {
    return useQuery<PaginatedResult<Subscription>>({
      queryKey: ['admin', 'subscriptions', filters],
      queryFn: async () => {
        const response = await client.get<PaginatedResult<Subscription>>('/admin/subscriptions', filters);
        return response;
      },
    });
  };

  /**
   * System Health
   */
  const useSystemHealth = () => {
    return useQuery<SystemHealth>({
      queryKey: ['admin', 'system', 'health'],
      queryFn: async () => {
        const response = await client.get<SystemHealth>('/admin/system/health');
        return response;
      },
      refetchInterval: 30000, // Refresh every 30 seconds
    });
  };

  const useSystemHealthHistory = (filters: { hours?: number } = {}) => {
    return useQuery<SystemHealthSnapshot[]>({
      queryKey: ['admin', 'system', 'health', 'history', filters],
      queryFn: async () => {
        const response = await client.get<SystemHealthSnapshot[]>('/admin/system/health/history', filters);
        return response;
      },
    });
  };

  /**
   * Reminders & Notifications
   */
  const useReminderStats = () => {
    return useQuery<ReminderStats>({
      queryKey: ['admin', 'reminders', 'stats'],
      queryFn: async () => {
        const response = await client.get<ReminderStats>('/admin/reminders/stats');
        return response;
      },
    });
  };

  const useNotificationStats = () => {
    return useQuery<NotificationStats>({
      queryKey: ['admin', 'notifications', 'stats'],
      queryFn: async () => {
        const response = await client.get<NotificationStats>('/admin/notifications/stats');
        return response;
      },
    });
  };

  const useEscalationStats = () => {
    return useQuery<EscalationStats>({
      queryKey: ['admin', 'escalations', 'stats'],
      queryFn: async () => {
        const response = await client.get<EscalationStats>('/admin/escalations/stats');
        return response;
      },
    });
  };

  /**
   * Agents
   */
  const useAgentStats = () => {
    return useQuery<AgentStats>({
      queryKey: ['admin', 'agents', 'stats'],
      queryFn: async () => {
        const response = await client.get<AgentStats>('/admin/agents/stats');
        return response;
      },
    });
  };

  /**
   * Audit Log
   */
  const useAuditLog = (filters: AuditLogFilters = {}) => {
    return useQuery<PaginatedResult<AdminAction>>({
      queryKey: ['admin', 'audit', filters],
      queryFn: async () => {
        const response = await client.get<PaginatedResult<AdminAction>>('/admin/audit', filters);
        return response;
      },
    });
  };

  /**
   * Support Notes
   */
  const useCreateSupportNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (data: CreateSupportNoteRequest) => {
        const response = await client.post<SupportNote>('/admin/support-notes', data);
        return response;
      },
      onSuccess: (_, { userId }) => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
      },
    });
  };

  const useUpdateSupportNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ noteId, data }: { noteId: string; data: UpdateSupportNoteRequest }) => {
        const response = await client.patch<SupportNote>(`/admin/support-notes/${noteId}`, data);
        return response;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      },
    });
  };

  return {
    useAdminDashboard,
    useUsers,
    useUserDetails,
    useUserStats,
    useSuspendUser,
    useUnsuspendUser,
    useDeleteUser,
    useBillingStats,
    useRevenueMetrics,
    useSubscriptions,
    useSystemHealth,
    useSystemHealthHistory,
    useReminderStats,
    useNotificationStats,
    useEscalationStats,
    useAgentStats,
    useAuditLog,
    useCreateSupportNote,
    useUpdateSupportNote,
  };
}

// Export types for convenience
export type AdminHooks = ReturnType<typeof createAdminHooks>;
