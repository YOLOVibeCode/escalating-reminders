import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type {
  IOAuthProviderService,
  OAuthProvider,
  OAuthAuthorizationUrl,
  OAuthUserInfo,
} from '@er/interfaces';

/**
 * OAuth provider service.
 * Implements IOAuthProviderService interface.
 * Handles OAuth provider interactions (Google, GitHub, Microsoft).
 */
@Injectable()
export class OAuthProviderService implements IOAuthProviderService {
  constructor(private readonly configService: ConfigService) {}

  async getAuthorizationUrl(
    provider: OAuthProvider,
    redirectUri: string,
  ): Promise<OAuthAuthorizationUrl> {
    if (provider === 'GOOGLE') {
      return this.getGoogleAuthorizationUrl(redirectUri);
    }

    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  async exchangeCodeForUserInfo(
    provider: OAuthProvider,
    code: string,
    redirectUri: string,
  ): Promise<OAuthUserInfo> {
    if (provider === 'GOOGLE') {
      return this.exchangeGoogleCodeForUserInfo(code, redirectUri);
    }

    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  /**
   * Generate Google OAuth authorization URL.
   */
  private async getGoogleAuthorizationUrl(
    redirectUri: string,
  ): Promise<OAuthAuthorizationUrl> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID not configured');
    }

    // Generate state token for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force consent screen to get refresh token
      state,
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return { url, state };
  }

  /**
   * Exchange Google OAuth code for user info.
   */
  private async exchangeGoogleCodeForUserInfo(
    code: string,
    redirectUri: string,
  ): Promise<OAuthUserInfo> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = (await tokenResponse.json().catch(() => ({}))) as {
        error_description?: string;
        error?: string;
        [key: string]: unknown;
      };
      throw new UnauthorizedException(
        `Failed to exchange OAuth code: ${error.error_description || tokenResponse.statusText}`,
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      [key: string]: unknown;
    };
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new UnauthorizedException('No access token received from Google');
    }

    // Get user info from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!userInfoResponse.ok) {
      throw new UnauthorizedException(
        'Failed to fetch user info from Google',
      );
    }

    const userInfo = (await userInfoResponse.json()) as {
      id: string;
      email?: string;
      name?: string;
      picture?: string;
      [key: string]: unknown;
    };

    if (!userInfo.id || !userInfo.email) {
      throw new UnauthorizedException(
        'Google did not return required user fields (id/email)',
      );
    }

    const result: OAuthUserInfo = {
      providerId: userInfo.id,
      email: userInfo.email,
    };

    if (userInfo.name) {
      result.displayName = userInfo.name;
    }

    if (userInfo.picture) {
      result.picture = userInfo.picture;
    }

    return result;
  }
}
