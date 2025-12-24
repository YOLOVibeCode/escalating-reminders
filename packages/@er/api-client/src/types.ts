import type {
  User,
  Reminder,
  EscalationProfile,
  AgentDefinition,
  UserAgentSubscription,
  CreateReminderDto,
  UpdateReminderDto,
  CreateEscalationProfileDto,
  UpdateEscalationProfileDto,
  ReminderFilters,
  PaginatedResult,
  TokenPair,
  CreateUserDto,
  LoginDto,
} from '@er/types';

export type { ReminderFilters } from '@er/types';
export type { User } from '@er/types';

/**
 * API response wrapper.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * API error response.
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
    requestId: string;
  };
  meta: {
    timestamp: string;
  };
}

/**
 * Auth API responses.
 */
export interface RegisterResponse {
  user: User;
  tokens: TokenPair;
}

export interface LoginResponse {
  user: User;
  tokens: TokenPair;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

/**
 * OAuth API responses.
 */
export interface OAuthAuthorizationUrlResponse {
  url: string;
  state: string;
}

/**
 * Reminders API responses.
 */
export type RemindersResponse = PaginatedResult<Reminder>;
export type ReminderResponse = Reminder;

/**
 * Escalation profiles API responses.
 */
export type EscalationProfilesResponse = EscalationProfile[];
export type EscalationProfileResponse = EscalationProfile;

/**
 * Agents API responses.
 */
export type AgentsResponse = AgentDefinition[];
export type AgentSubscriptionsResponse = UserAgentSubscription[];
export type AgentSubscriptionResponse = UserAgentSubscription;

/**
 * Test result response.
 */
export interface TestResultResponse {
  success: boolean;
  message: string;
  deliveryTime?: number;
}

/**
 * Request types.
 */
export type RegisterRequest = CreateUserDto;
export type LoginRequest = LoginDto;
export type RefreshRequest = {
  refreshToken: string;
};
export type CreateReminderRequest = CreateReminderDto;
export type UpdateReminderRequest = UpdateReminderDto;
export type CreateEscalationProfileRequest = CreateEscalationProfileDto;
export type UpdateEscalationProfileRequest = UpdateEscalationProfileDto;
export type SubscribeAgentRequest = {
  configuration: Record<string, unknown>;
};
export type UpdateAgentSubscriptionRequest = {
  configuration: Record<string, unknown>;
};

