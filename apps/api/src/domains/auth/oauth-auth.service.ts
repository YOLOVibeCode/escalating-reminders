import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from './auth.repository';
import { OAuthProviderService } from './oauth-provider.service';
import type {
  IOAuthAuthService,
  OAuthProvider,
  OAuthUserInfo,
} from '@er/interfaces';
import type { User, TokenPair } from '@er/types';

/**
 * OAuth authentication service.
 * Implements IOAuthAuthService interface.
 * Handles OAuth-based authentication and user creation.
 */
@Injectable()
export class OAuthAuthService implements IOAuthAuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly oauthProviderService: OAuthProviderService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async authenticateWithOAuth(
    provider: OAuthProvider,
    userInfo: OAuthUserInfo,
  ): Promise<{ user: User; tokens: TokenPair; isNewUser: boolean }> {
    // Check if OAuth account already exists
    const existingOAuthUser = await this.authRepository.findByOAuthProvider(
      provider,
      userInfo.providerId,
    );

    if (existingOAuthUser) {
      // Existing OAuth user - login
      const tokens = await this.generateTokenPair(
        existingOAuthUser.id,
        existingOAuthUser.email,
      );
      return {
        user: existingOAuthUser,
        tokens,
        isNewUser: false,
      };
    }

    // Check if email already exists
    const existingEmailUser = await this.authRepository.findByEmail(
      userInfo.email,
    );

    if (existingEmailUser) {
      // Email exists - check if it's linked to different OAuth provider
      if (
        existingEmailUser.oauthProvider &&
        existingEmailUser.oauthProvider !== provider
      ) {
        throw new ConflictException(
          `Email already registered with different OAuth provider: ${existingEmailUser.oauthProvider}`,
        );
      }

      // Link OAuth to existing account
      const updatedUser = await this.authRepository.updateOAuthLink(
        existingEmailUser.id,
        {
          oauthProvider: provider,
          oauthProviderId: userInfo.providerId,
          emailVerified: true, // OAuth emails are verified
        },
      );

      const tokens = await this.generateTokenPair(
        updatedUser.id,
        updatedUser.email,
      );
      return {
        user: updatedUser,
        tokens,
        isNewUser: false,
      };
    }

    // New user - create account
    const newUser = await this.authRepository.create({
      email: userInfo.email,
      passwordHash: null, // OAuth users don't have passwords
      oauthProvider: provider,
      oauthProviderId: userInfo.providerId,
      emailVerified: true, // OAuth emails are verified
      profile: {
        create: {
          displayName: userInfo.displayName || userInfo.email.split('@')[0] || 'User',
          timezone: 'America/New_York',
        },
      },
      subscription: {
        create: {
          tier: 'FREE',
          status: 'ACTIVE',
        },
      },
    });

    const tokens = await this.generateTokenPair(newUser.id, newUser.email);
    return {
      user: newUser,
      tokens,
      isNewUser: true,
    };
  }

  /**
   * Generate access and refresh tokens.
   */
  private async generateTokenPair(
    userId: string,
    email: string,
  ): Promise<TokenPair> {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const accessExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      { expiresIn: accessExpiresIn },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, email, type: 'refresh' },
      { expiresIn: refreshExpiresIn },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getAccessTokenExpiry(),
    };
  }

  /**
   * Get access token expiry in seconds.
   */
  private getAccessTokenExpiry(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    // Simple parser for common formats
    if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn) * 60;
    }
    if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 60 * 60;
    }
    if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 24 * 60 * 60;
    }
    if (expiresIn.endsWith('s')) {
      return parseInt(expiresIn);
    }
    // Default 15 minutes
    return 900;
  }
}
