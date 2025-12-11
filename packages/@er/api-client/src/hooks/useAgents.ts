import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiClient } from '../client';
import type {
  AgentsResponse,
  AgentSubscriptionsResponse,
  AgentSubscriptionResponse,
  SubscribeAgentRequest,
  UpdateAgentSubscriptionRequest,
  TestResultResponse,
} from '../types';

/**
 * React Query hooks for agents.
 */
export function createAgentHooks(client: ApiClient) {
  /**
   * Get all available agents.
   */
  function useAgents() {
    return useQuery<AgentsResponse>({
      queryKey: ['agents'],
      queryFn: () => client.getAgents(),
    });
  }

  /**
   * Get user's agent subscriptions.
   */
  function useAgentSubscriptions() {
    return useQuery<AgentSubscriptionsResponse>({
      queryKey: ['agents', 'subscriptions'],
      queryFn: () => client.getAgentSubscriptions(),
    });
  }

  /**
   * Subscribe to an agent.
   */
  function useSubscribeAgent() {
    const queryClient = useQueryClient();

    return useMutation<
      AgentSubscriptionResponse,
      Error,
      { agentId: string; data: SubscribeAgentRequest }
    >({
      mutationFn: ({ agentId, data }) => client.subscribeAgent(agentId, data),
      onSuccess: () => {
        // Invalidate subscriptions list to refetch
        queryClient.invalidateQueries({ queryKey: ['agents', 'subscriptions'] });
      },
    });
  }

  /**
   * Update agent subscription.
   */
  function useUpdateAgentSubscription() {
    const queryClient = useQueryClient();

    return useMutation<
      AgentSubscriptionResponse,
      Error,
      { subscriptionId: string; data: UpdateAgentSubscriptionRequest }
    >({
      mutationFn: ({ subscriptionId, data }) =>
        client.updateAgentSubscription(subscriptionId, data),
      onSuccess: () => {
        // Invalidate subscriptions list to refetch
        queryClient.invalidateQueries({ queryKey: ['agents', 'subscriptions'] });
      },
    });
  }

  /**
   * Unsubscribe from an agent.
   */
  function useUnsubscribeAgent() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
      mutationFn: (subscriptionId) => client.unsubscribeAgent(subscriptionId),
      onSuccess: () => {
        // Invalidate subscriptions list to refetch
        queryClient.invalidateQueries({ queryKey: ['agents', 'subscriptions'] });
      },
    });
  }

  /**
   * Test agent subscription.
   */
  function useTestAgent() {
    return useMutation<TestResultResponse, Error, string>({
      mutationFn: (subscriptionId) => client.testAgent(subscriptionId),
    });
  }

  return {
    useAgents,
    useAgentSubscriptions,
    useSubscribeAgent,
    useUpdateAgentSubscription,
    useUnsubscribeAgent,
    useTestAgent,
  };
}

