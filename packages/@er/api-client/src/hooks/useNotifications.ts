/**
 * React Query hooks for notification-related API calls.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import type { ApiClient } from '../client';
import type { NotificationLog, PaginatedResult } from '@er/types';

export function createNotificationHooks(client: ApiClient) {
  const useNotifications = (filters?: {
    reminderId?: string;
    status?: string;
    agentType?: string;
    page?: number;
    pageSize?: number;
  }) => {
    return useQuery<PaginatedResult<NotificationLog>>({
      queryKey: ['notifications', filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters?.reminderId) params.append('reminderId', filters.reminderId);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.agentType) params.append('agentType', filters.agentType);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());

        return client.get<PaginatedResult<NotificationLog>>(`/notifications?${params.toString()}`);
      },
    });
  };

  const useNotification = (id: string) => {
    return useQuery<NotificationLog>({
      queryKey: ['notifications', id],
      queryFn: async () => {
        return client.get<NotificationLog>(`/notifications/${id}`);
      },
      enabled: !!id,
    });
  };

  return {
    useNotifications,
    useNotification,
  };
}

