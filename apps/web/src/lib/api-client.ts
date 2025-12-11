/**
 * API client configuration and setup.
 * Integrates with auth store for token management.
 *
 * Note: This file must be imported only in client components or hooks.
 * The API client uses Zustand store which requires client-side execution.
 */

import { createApiClient, createApiHooks } from '@er/api-client';
import { useAuthStore } from './auth-store';

/**
 * API client instance configured with token management.
 * This is safe to use in client components and hooks.
 */
export const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3801/v1',
  getAccessToken: () => {
    if (typeof window === 'undefined') return null;
    return useAuthStore.getState().accessToken;
  },
  getRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return useAuthStore.getState().refreshToken;
  },
  onTokenRefresh: (tokens) => {
    if (typeof window === 'undefined') return;
    useAuthStore.getState().setTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || useAuthStore.getState().refreshToken || '',
    });
  },
  onUnauthorized: () => {
    if (typeof window === 'undefined') return;
    useAuthStore.getState().clearTokens();
    // Redirect will be handled by middleware or auth guard
    window.location.href = '/login';
  },
});

/**
 * Pre-configured React Query hooks for all API endpoints.
 * Usage:
 *   import { useReminders, useLogin } from '@/lib/api-client';
 *
 * Note: These hooks can only be used in client components.
 */
export const {
  useMe,
  useRegister,
  useLogin,
  useRefresh,
  useLogout,
  useReminders,
  useReminder,
  useCreateReminder,
  useUpdateReminder,
  useDeleteReminder,
  useEscalationProfiles,
  useEscalationProfile,
  useCreateEscalationProfile,
  useUpdateEscalationProfile,
  useDeleteEscalationProfile,
  useAgents,
  useAgentSubscriptions,
  useSubscribeAgent,
  useUpdateAgentSubscription,
  useUnsubscribeAgent,
  useTestAgent,
  useNotifications,
  useNotification,
  // Admin hooks
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
} = createApiHooks(apiClient);

