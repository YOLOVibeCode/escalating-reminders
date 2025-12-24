import type {
  ApiResponse,
  ApiErrorResponse,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  OAuthAuthorizationUrlResponse,
  RemindersResponse,
  ReminderResponse,
  CreateReminderRequest,
  UpdateReminderRequest,
  EscalationProfilesResponse,
  EscalationProfileResponse,
  CreateEscalationProfileRequest,
  UpdateEscalationProfileRequest,
  AgentsResponse,
  AgentSubscriptionsResponse,
  AgentSubscriptionResponse,
  SubscribeAgentRequest,
  UpdateAgentSubscriptionRequest,
  TestResultResponse,
} from './types';
import type { ReminderFilters, User } from '@er/types';

/**
 * API client configuration.
 */
export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null;
  getRefreshToken?: () => string | null;
  onTokenRefresh?: (tokens: { accessToken: string; refreshToken?: string }) => void;
  onUnauthorized?: () => void;
}

/**
 * Type-safe API client.
 * Handles authentication, error handling, and token refresh.
 */
export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * Make an authenticated API request.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const accessToken = this.config.getAccessToken?.();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (error) {
      throw new Error(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && this.config.getRefreshToken) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry request with new token
        const newAccessToken = this.config.getAccessToken?.();
        if (newAccessToken) {
          headers.Authorization = `Bearer ${newAccessToken}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        }
      } else {
        // Refresh failed, trigger unauthorized callback
        this.config.onUnauthorized?.();
        throw new Error('Unauthorized');
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Support both wrapped and unwrapped error shapes.
      const error = data as ApiErrorResponse;
      const message =
        (error as any)?.error?.message ||
        (typeof (data as any)?.message === 'string' ? (data as any).message : null) ||
        `API error: ${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    // Support both wrapped and unwrapped success shapes.
    // Preferred (standard) shape: { success: true, data: ... }
    if (
      typeof (data as any)?.success === 'boolean' &&
      (data as any)?.success === true &&
      'data' in (data as any)
    ) {
      return (data as ApiResponse<T>).data;
    }

    // Fallback: raw response is the data.
    return data as T;
  }

  /**
   * Refresh access token.
   */
  private async refreshToken(): Promise<boolean> {
    const refreshToken = this.config.getRefreshToken?.();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await this.request<RefreshResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      this.config.onTokenRefresh?.({
        accessToken: response.accessToken,
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // AUTH ENDPOINTS
  // ============================================

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refresh(data: RefreshRequest): Promise<RefreshResponse> {
    return this.request<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(refreshToken: string): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  /**
   * Get OAuth authorization URL.
   */
  async getOAuthAuthorizationUrl(
    provider: string,
    redirectUri: string,
  ): Promise<OAuthAuthorizationUrlResponse> {
    const response = await this.request<ApiResponse<OAuthAuthorizationUrlResponse>>(
      `/auth/oauth/${provider}/authorize?redirectUri=${encodeURIComponent(redirectUri)}`,
    );
    return response.data;
  }

  /**
   * Generic PATCH request.
   */
  async patch<T = any>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Generic DELETE request.
   * Optionally supports a JSON request body.
   */
  async delete<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : null,
    });
  }

  /**
   * Generic POST request.
   */
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    });
  }

  /**
   * Generic GET request.
   */
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  // ============================================
  // REMINDERS ENDPOINTS
  // ============================================

  async getReminders(filters?: ReminderFilters): Promise<RemindersResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.importance) params.append('importance', filters.importance);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

    const query = params.toString();
    return this.request<RemindersResponse>(
      `/reminders${query ? `?${query}` : ''}`,
    );
  }

  async getReminder(id: string): Promise<ReminderResponse> {
    return this.request<ReminderResponse>(`/reminders/${id}`);
  }

  async createReminder(data: CreateReminderRequest): Promise<ReminderResponse> {
    return this.request<ReminderResponse>('/reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReminder(
    id: string,
    data: UpdateReminderRequest,
  ): Promise<ReminderResponse> {
    return this.request<ReminderResponse>(`/reminders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteReminder(id: string): Promise<void> {
    return this.request<void>(`/reminders/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // ESCALATION PROFILES ENDPOINTS
  // ============================================

  async getEscalationProfiles(): Promise<EscalationProfilesResponse> {
    return this.request<EscalationProfilesResponse>('/escalation-profiles');
  }

  async getEscalationProfile(id: string): Promise<EscalationProfileResponse> {
    return this.request<EscalationProfileResponse>(`/escalation-profiles/${id}`);
  }

  async createEscalationProfile(
    data: CreateEscalationProfileRequest,
  ): Promise<EscalationProfileResponse> {
    return this.request<EscalationProfileResponse>('/escalation-profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEscalationProfile(
    id: string,
    data: UpdateEscalationProfileRequest,
  ): Promise<EscalationProfileResponse> {
    return this.request<EscalationProfileResponse>(`/escalation-profiles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEscalationProfile(id: string): Promise<void> {
    return this.request<void>(`/escalation-profiles/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // AGENTS ENDPOINTS
  // ============================================

  async getAgents(): Promise<AgentsResponse> {
    return this.request<AgentsResponse>('/agents');
  }

  async getAgentSubscriptions(): Promise<AgentSubscriptionsResponse> {
    return this.request<AgentSubscriptionsResponse>('/agents/subscriptions');
  }

  async subscribeAgent(
    agentId: string,
    data: SubscribeAgentRequest,
  ): Promise<AgentSubscriptionResponse> {
    return this.request<AgentSubscriptionResponse>(`/agents/${agentId}/subscribe`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgentSubscription(
    subscriptionId: string,
    data: UpdateAgentSubscriptionRequest,
  ): Promise<AgentSubscriptionResponse> {
    return this.request<AgentSubscriptionResponse>(
      `/agents/subscriptions/${subscriptionId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    );
  }

  async unsubscribeAgent(subscriptionId: string): Promise<void> {
    return this.request<void>(`/agents/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }

  async testAgent(subscriptionId: string): Promise<TestResultResponse> {
    return this.request<TestResultResponse>(
      `/agents/subscriptions/${subscriptionId}/test`,
      {
        method: 'POST',
      },
    );
  }
}

