/**
 * @er/api-client - Type-Safe API Client
 *
 * Provides a type-safe API client with React Query hooks for the Escalating Reminders API.
 *
 * Usage:
 *   import { createApiClient, createApiHooks } from '@er/api-client';
 *
 *   const client = createApiClient({ baseUrl: 'http://localhost:3801/v1' });
 *   const { useLogin, useReminders } = createApiHooks(client);
 */

import { ApiClient } from './client';
import { createAuthHooks } from './hooks/useAuth';
import { createReminderHooks } from './hooks/useReminders';
import { createEscalationHooks } from './hooks/useEscalation';
import { createAgentHooks } from './hooks/useAgents';
import { createNotificationHooks } from './hooks/useNotifications';
import { createAdminHooks } from './hooks/useAdmin';

export * from './client';
export * from './types';
export * from './hooks/useAuth';
export * from './hooks/useReminders';
export * from './hooks/useEscalation';
export * from './hooks/useAgents';
export * from './hooks/useNotifications';
export * from './hooks/useAdmin';

/**
 * Create an API client instance.
 */
export function createApiClient(config: Parameters<typeof ApiClient>[0]) {
  return new ApiClient(config);
}

/**
 * Create all hooks for a given API client.
 */
export function createApiHooks(client: ApiClient) {
  return {
    ...createAuthHooks(client),
    ...createReminderHooks(client),
    ...createEscalationHooks(client),
    ...createAgentHooks(client),
    ...createNotificationHooks(client),
    ...createAdminHooks(client),
  };
}

