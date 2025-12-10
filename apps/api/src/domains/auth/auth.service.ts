import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { ERROR_CODES } from '@er/constants';
import type { IAuthService } from '@er/interfaces';
import type { CreateUserDto, LoginDto, TokenPair, AccessTokenPayload, RefreshTokenPayload, User } from '@er/types';

/**
 * Auth service.
 * Implements IAuthService interface.
 * Handles authentication business logic.
 */
@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: CreateUserDto): Promise<{ user: User; tokens: TokenPair }> {
    // Check if user already exists
    const existingUser = await this.repository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException({
        code: ERROR_CODES.RESOURCE_ALREADY_EXISTS,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user with profile and subscription
    const user = await this.repository.create({
      email: dto.email,
      passwordHash: hashedPassword,
      profile: {
        create: {
          displayName: dto.displayName,
          timezone: dto.timezone || 'America/New_York',
        },
      },
      subscription: {
        create: {
          tier: 'FREE',
          status: 'ACTIVE',
        },
      },
    });

    // Get user with subscription for token generation
    const userWithSubscription = await this.repository.findByIdWithSubscription(user.id);
    if (!userWithSubscription || !userWithSubscription.subscription) {
      throw new Error('User subscription not found');
    }

    // Generate tokens
    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      userWithSubscription.subscription.tier,
    );

    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<{ user: User; tokens: TokenPair }> {
    // Find user
    const user = await this.repository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    // Get user with subscription for token generation
    const userWithSubscription = await this.repository.findByIdWithSubscription(user.id);
    if (!userWithSubscription || !userWithSubscription.subscription) {
      throw new Error('User subscription not found');
    }

    // Generate tokens
    const tokens = await this.generateTokenPair(
      user.id,
      user.email,
      userWithSubscription.subscription.tier,
    );

    return { user, tokens };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Get user with subscription
      const user = await this.repository.findByIdWithSubscription(payload.sub);
      if (!user || !user.subscription) {
        throw new UnauthorizedException({
          code: ERROR_CODES.AUTH_TOKEN_INVALID,
          message: 'User not found',
        });
      }

      // Generate new token pair
      const tokens = await this.generateTokenPair(user.id, user.email, user.subscription.tier);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_TOKEN_INVALID,
        message: 'Invalid refresh token',
      });
    }
  }

  async logout(refreshToken: string): Promise<void> {
    // Invalidate refresh token
    // This can be done via cache or database
    // For now, we'll rely on token expiration
    // In production, you'd want to store revoked tokens
  }

  private async generateTokenPair(
    userId: string,
    email: string,
    tier: string,
  ): Promise<TokenPair> {
    const accessTokenPayload: AccessTokenPayload = {
      sub: userId,
      email,
      tier: tier as any,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.getAccessTokenExpiry(),
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      sub: userId,
      sessionId: '', // Session management can be added later
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.getRefreshTokenExpiry(),
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
    });

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.getAccessTokenExpiry(),
    };
  }

  private getAccessTokenExpiry(): number {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    // Simple parser for common formats
    if (expiresIn.endsWith('m')) {
      return parseInt(expiresIn) * 60;
    }
    if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 3600;
    }
    if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 86400;
    }
    return 900; // Default 15 minutes
  }

  private getRefreshTokenExpiry(): number {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 86400;
    }
    return 604800; // Default 7 days
  }
}
