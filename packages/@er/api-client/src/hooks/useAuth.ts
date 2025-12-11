import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiClient } from '../client';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  User,
} from '../types';

/**
 * React Query hooks for authentication.
 */
export function createAuthHooks(client: ApiClient) {
  /**
   * Get current user.
   */
  function useMe() {
    return useQuery<User>({
      queryKey: ['auth', 'me'],
      queryFn: () => client.getMe(),
      retry: false,
    });
  }

  /**
   * Register a new user.
   */
  function useRegister() {
    const queryClient = useQueryClient();

    return useMutation<RegisterResponse, Error, RegisterRequest>({
      mutationFn: (data) => client.register(data),
      onSuccess: (data) => {
        // Invalidate user query to refetch
        queryClient.setQueryData(['auth', 'me'], data.user);
      },
    });
  }

  /**
   * Login user.
   */
  function useLogin() {
    const queryClient = useQueryClient();

    return useMutation<LoginResponse, Error, LoginRequest>({
      mutationFn: (data) => client.login(data),
      onSuccess: (data) => {
        // Invalidate user query to refetch
        queryClient.setQueryData(['auth', 'me'], data.user);
      },
    });
  }

  /**
   * Refresh access token.
   */
  function useRefresh() {
    return useMutation<RefreshResponse, Error, RefreshRequest>({
      mutationFn: (data) => client.refresh(data),
    });
  }

  /**
   * Logout user.
   */
  function useLogout() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
      mutationFn: (refreshToken) => client.logout(refreshToken),
      onSuccess: () => {
        // Clear all queries
        queryClient.clear();
      },
    });
  }

  const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (data: {
        displayName?: string;
        timezone?: string;
        preferences?: Record<string, unknown>;
      }) => {
        return client.patch<{ displayName: string; timezone: string; preferences: Record<string, unknown> }>('/auth/me', data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      },
    });
  };

  return {
    useMe,
    useRegister,
    useLogin,
    useRefresh,
    useLogout,
    useUpdateProfile,
  };
}

