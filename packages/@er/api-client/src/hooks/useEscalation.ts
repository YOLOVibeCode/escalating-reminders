import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiClient } from '../client';
import type {
  EscalationProfilesResponse,
  EscalationProfileResponse,
  CreateEscalationProfileRequest,
  UpdateEscalationProfileRequest,
} from '../types';

/**
 * React Query hooks for escalation profiles.
 */
export function createEscalationHooks(client: ApiClient) {
  /**
   * Get all escalation profiles (user's + presets).
   */
  function useEscalationProfiles() {
    return useQuery<EscalationProfilesResponse>({
      queryKey: ['escalation-profiles'],
      queryFn: () => client.getEscalationProfiles(),
    });
  }

  /**
   * Get a single escalation profile by ID.
   */
  function useEscalationProfile(id: string | null) {
    return useQuery<EscalationProfileResponse>({
      queryKey: ['escalation-profiles', id],
      queryFn: () => {
        if (!id) throw new Error('Escalation profile ID is required');
        return client.getEscalationProfile(id);
      },
      enabled: !!id,
    });
  }

  /**
   * Create a custom escalation profile.
   */
  function useCreateEscalationProfile() {
    const queryClient = useQueryClient();

    return useMutation<
      EscalationProfileResponse,
      Error,
      CreateEscalationProfileRequest
    >({
      mutationFn: (data) => client.createEscalationProfile(data),
      onSuccess: () => {
        // Invalidate profiles list to refetch
        queryClient.invalidateQueries({ queryKey: ['escalation-profiles'] });
      },
    });
  }

  /**
   * Update an escalation profile.
   */
  function useUpdateEscalationProfile() {
    const queryClient = useQueryClient();

    return useMutation<
      EscalationProfileResponse,
      Error,
      { id: string; data: UpdateEscalationProfileRequest }
    >({
      mutationFn: ({ id, data }) => client.updateEscalationProfile(id, data),
      onSuccess: (data, variables) => {
        // Update the specific profile in cache
        queryClient.setQueryData(['escalation-profiles', variables.id], data);
        // Invalidate list to refetch
        queryClient.invalidateQueries({ queryKey: ['escalation-profiles'] });
      },
    });
  }

  /**
   * Delete an escalation profile.
   */
  function useDeleteEscalationProfile() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
      mutationFn: (id) => client.deleteEscalationProfile(id),
      onSuccess: (_, id) => {
        // Remove from cache
        queryClient.removeQueries({ queryKey: ['escalation-profiles', id] });
        // Invalidate list to refetch
        queryClient.invalidateQueries({ queryKey: ['escalation-profiles'] });
      },
    });
  }

  return {
    useEscalationProfiles,
    useEscalationProfile,
    useCreateEscalationProfile,
    useUpdateEscalationProfile,
    useDeleteEscalationProfile,
  };
}

