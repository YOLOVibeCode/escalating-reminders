import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ERROR_CODES } from '@er/constants';
import type { AccessTokenPayload } from '@er/types';

/**
 * JWT strategy for Passport.
 * Validates JWT tokens from Authorization header.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev_jwt_secret',
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AccessTokenPayload> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_TOKEN_INVALID,
        message: 'Invalid token payload',
      });
    }

    return payload;
  }
}

