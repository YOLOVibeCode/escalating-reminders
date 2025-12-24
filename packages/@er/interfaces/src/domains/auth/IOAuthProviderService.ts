import type { User, TokenPair } from '@er/types';

/**
 * OAuth provider types supported.
 */
export type OAuthProvider = 'GOOGLE' | 'GITHUB' | 'MICROSOFT';

/**
 * OAuth user info from provider.
 */
export interface OAuthUserInfo {
  providerId: string;
  email: string;
  displayName?: string;
  picture?: string;
}

/**
 * OAuth authorization URL response.
 */
export interface OAuthAuthorizationUrl {
  url: string;
  state: string;
}

/**
 * Service interface for OAuth provider operations.
 * Follows ISP - only OAuth-specific methods, separated from IAuthService.
 */
export interface IOAuthProviderService {
  /**
   * Generate OAuth authorization URL for a provider.
   * @param provider The OAuth provider (e.g., 'GOOGLE')
   * @param redirectUri Callback URL after OAuth flow
   * @returns Authorization URL and state token
   */
  getAuthorizationUrl(
    provider: OAuthProvider,
    redirectUri: string,
  ): Promise<OAuthAuthorizationUrl>;

  /**
   * Exchange OAuth authorization code for user info.
   * @param provider The OAuth provider
   * @param code Authorization code from OAuth callback
   * @param redirectUri Callback URL (must match authorization URL)
   * @returns User info from provider
   * @throws {UnauthorizedError} If code is invalid or expired
   */
  exchangeCodeForUserInfo(
    provider: OAuthProvider,
    code: string,
    redirectUri: string,
  ): Promise<OAuthUserInfo>;
}

/**
 * Service interface for OAuth authentication operations.
 * Follows ISP - OAuth login/registration is distinct from password-based auth.
 */
export interface IOAuthAuthService {
  /**
   * Authenticate or register user via OAuth.
   * Creates user if doesn't exist, otherwise logs in.
   * @param provider OAuth provider
   * @param userInfo User info from OAuth provider
   * @returns User and token pair
   */
  authenticateWithOAuth(
    provider: OAuthProvider,
    userInfo: OAuthUserInfo,
  ): Promise<{ user: User; tokens: TokenPair; isNewUser: boolean }>;
}
