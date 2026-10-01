import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

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

export interface IUpdateProfileInput {
  displayName?: string;
  timezone?: string;
  preferences?: Record<string, unknown>;
  phone?: string | null;
  smsOptIn?: boolean;
  smsConsentSource?: string;
}

export interface IUpdateProfileResponse {
  displayName: string;
  timezone: string;
  preferences: Record<string, unknown>;
  phone: string | null;
}

export interface IAuthHooks {
  useMe: () => UseQueryResult<User>;
  useRegister: () => UseMutationResult<RegisterResponse, Error, RegisterRequest>;
  useLogin: () => UseMutationResult<LoginResponse, Error, LoginRequest>;
  useRefresh: () => UseMutationResult<RefreshResponse, Error, RefreshRequest>;
  useLogout: () => UseMutationResult<undefined, Error, string>;
  useUpdateProfile: () => UseMutationResult<
    IUpdateProfileResponse,
    Error,
    IUpdateProfileInput
  >;
}

/**
 * React Query hooks for authentication.
 */
export function createAuthHooks(client: ApiClient): IAuthHooks {
  /**
   * Get current user.
   */
  function useMe(): UseQueryResult<User> {
    return useQuery<User>({
      queryKey: ['auth', 'me'],
      queryFn: () => client.getMe(),
      retry: false,
    });
  }

  /**
   * Register a new user.
   */
  function useRegister(): UseMutationResult<RegisterResponse, Error, RegisterRequest> {
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
  function useLogin(): UseMutationResult<LoginResponse, Error, LoginRequest> {
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
  function useRefresh(): UseMutationResult<RefreshResponse, Error, RefreshRequest> {
    return useMutation<RefreshResponse, Error, RefreshRequest>({
      mutationFn: (data) => client.refresh(data),
    });
  }

  /**
   * Logout user.
   */
  function useLogout(): UseMutationResult<undefined, Error, string> {
    const queryClient = useQueryClient();

    return useMutation<undefined, Error, string>({
      mutationFn: async (refreshToken) => {
        await client.logout(refreshToken);
        return undefined;
      },
      onSuccess: () => {
        // Clear all queries
        queryClient.clear();
      },
    });
  }

  function useUpdateProfile(): UseMutationResult<
    IUpdateProfileResponse,
    Error,
    IUpdateProfileInput
  > {
    const queryClient = useQueryClient();
    return useMutation<IUpdateProfileResponse, Error, IUpdateProfileInput>({
      mutationFn: async (data) => {
        return client.patch<IUpdateProfileResponse>('/auth/me', data);
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      },
    });
  }

  return {
    useMe,
    useRegister,
    useLogin,
    useRefresh,
    useLogout,
    useUpdateProfile,
  };
}
