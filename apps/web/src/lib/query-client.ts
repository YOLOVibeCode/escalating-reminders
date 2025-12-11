/**
 * React Query client configuration.
 * Provides default options for queries and mutations.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Query client with optimized defaults.
 * - 5 minute stale time for queries
 * - 10 minute garbage collection time
 * - Minimal retries to fail fast
 * - No refetch on window focus (better UX)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

