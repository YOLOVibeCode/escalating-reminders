import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiClient } from '../client';
import type {
  RemindersResponse,
  ReminderResponse,
  CreateReminderRequest,
  UpdateReminderRequest,
  ReminderFilters,
} from '../types';

/**
 * React Query hooks for reminders.
 */
export function createReminderHooks(client: ApiClient) {
  /**
   * Get all reminders with filters.
   */
  function useReminders(filters?: ReminderFilters) {
    return useQuery<RemindersResponse>({
      queryKey: ['reminders', filters],
      queryFn: () => client.getReminders(filters),
    });
  }

  /**
   * Get a single reminder by ID.
   */
  function useReminder(id: string | null) {
    return useQuery<ReminderResponse>({
      queryKey: ['reminders', id],
      queryFn: () => {
        if (!id) throw new Error('Reminder ID is required');
        return client.getReminder(id);
      },
      enabled: !!id,
    });
  }

  /**
   * Create a new reminder.
   */
  function useCreateReminder() {
    const queryClient = useQueryClient();

    return useMutation<ReminderResponse, Error, CreateReminderRequest>({
      mutationFn: (data) => client.createReminder(data),
      onSuccess: () => {
        // Invalidate reminders list to refetch
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
      },
    });
  }

  /**
   * Update a reminder.
   */
  function useUpdateReminder() {
    const queryClient = useQueryClient();

    return useMutation<
      ReminderResponse,
      Error,
      { id: string; data: UpdateReminderRequest }
    >({
      mutationFn: ({ id, data }) => client.updateReminder(id, data),
      onSuccess: (data, variables) => {
        // Update the specific reminder in cache
        queryClient.setQueryData(['reminders', variables.id], data);
        // Invalidate list to refetch
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
      },
    });
  }

  /**
   * Delete a reminder.
   */
  function useDeleteReminder() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
      mutationFn: (id) => client.deleteReminder(id),
      onSuccess: (_, id) => {
        // Remove from cache
        queryClient.removeQueries({ queryKey: ['reminders', id] });
        // Invalidate list to refetch
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
      },
    });
  }

  const useSnoozeReminder = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, duration }: { id: string; duration: string }) => {
        return client.post<{ success: boolean; data: { id: string; snoozeUntil: Date } }>(`/reminders/${id}/snooze`, { duration });
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['reminders', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
      },
    });
  };

  const useCompleteReminder = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, source }: { id: string; source?: string }) => {
        return client.post<{ success: boolean }>(`/reminders/${id}/complete`, { source: source || 'manual' });
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['reminders', variables.id] });
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
      },
    });
  };

  const useAcknowledgeReminder = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        return client.post<{ success: boolean }>(`/reminders/${id}/acknowledge`);
      },
      onSuccess: (_, id) => {
        queryClient.invalidateQueries({ queryKey: ['reminders', id] });
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
      },
    });
  };

  return {
    useReminders,
    useReminder,
    useCreateReminder,
    useUpdateReminder,
    useDeleteReminder,
    useSnoozeReminder,
    useCompleteReminder,
    useAcknowledgeReminder,
  };
}

