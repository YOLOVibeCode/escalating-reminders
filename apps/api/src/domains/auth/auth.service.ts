import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { ERROR_CODES } from '@er/constants';
import type { IAuthService } from '@er/interfaces';
import type { CreateUserDto, LoginDto, TokenPair, AccessTokenPayload, RefreshTokenPayload, User } from '@er/types';
import { NotFoundError } from '../../common/exceptions';
import { ValidationError } from '../../common/exceptions/validation.exception';
import { SmsConsentRepository } from '../sms/sms-consent.repository';
import { parseToE164 } from '../sms/phone.util';
import { SMS_CONSENT_TEXT_VERSION, SMS_PURPOSE } from '../sms/sms-compliance.constants';

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
    private readonly smsConsentRepository: SmsConsentRepository,
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

    // Verify password (OAuth users don't have passwords)
    if (!user.passwordHash) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'This account uses OAuth login. Please sign in with Google.',
      });
    }

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
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev_refresh_secret';
      const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: refreshSecret,
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
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      sub: userId,
      sessionId: '', // Session management can be added later
    };

    const accessSecret = this.configService.get<string>('JWT_SECRET') || 'dev_jwt_secret';
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'dev_refresh_secret';

    const accessToken = this.jwtService.sign(accessTokenPayload as any, {
      secret: accessSecret,
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
    });

    const refreshToken = this.jwtService.sign(refreshTokenPayload as any, {
      secret: refreshSecret,
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

  /**
   * Update user profile.
   * @throws {NotFoundError} If user doesn't exist
   */
  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      timezone?: string;
      preferences?: Record<string, unknown>;
      phone?: string | null;
      smsOptIn?: boolean;
      smsConsentSource?: string;
    },
    context?: { ip?: string; userAgent?: string },
  ): Promise<{
    displayName: string;
    timezone: string;
    preferences: Record<string, unknown>;
    phone: string | null;
  }> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    if (data.smsOptIn === true && !data.phone) {
      throw new ValidationError('Phone number is required to opt in to SMS');
    }

    let normalizedPhone: string | null | undefined;
    if (data.phone !== undefined) {
      normalizedPhone = data.phone ? parseToE164(data.phone) : null;
      await this.repository.update(userId, { phone: normalizedPhone });
    } else {
      normalizedPhone = user.phone ?? null;
    }

    const update: {
      displayName?: string;
      timezone?: string;
      preferences?: Record<string, unknown>;
    } = {};
    if (data.displayName !== undefined) update.displayName = data.displayName;
    if (data.timezone !== undefined) update.timezone = data.timezone;
    if (data.preferences !== undefined) update.preferences = data.preferences;

    const profile = await this.repository.updateProfile(userId, update);

    if (data.smsOptIn === true && normalizedPhone) {
      const consentInput: {
        phone: string;
        purpose: string;
        consentTextVersion: string;
        source: string;
        consentedAt: Date;
        ip?: string;
        userAgent?: string;
      } = {
        phone: normalizedPhone,
        purpose: SMS_PURPOSE,
        consentTextVersion: SMS_CONSENT_TEXT_VERSION,
        source: data.smsConsentSource || '/settings/profile',
        consentedAt: new Date(),
      };
      if (context?.ip) consentInput.ip = context.ip;
      if (context?.userAgent) consentInput.userAgent = context.userAgent;
      await this.smsConsentRepository.recordOptIn(consentInput);
    }

    const refreshed = await this.repository.findById(userId);

    return {
      displayName: profile.displayName,
      timezone: profile.timezone,
      preferences: profile.preferences as Record<string, unknown>,
      phone: refreshed?.phone ?? null,
    };
  }

  /**
   * Get user with profile and subscription.
   */
  async getUserWithProfile(userId: string): Promise<User & { profile: any; subscription: any }> {
    const user = await this.repository.findByIdWithProfile(userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }
    return user as any;
  }
}
