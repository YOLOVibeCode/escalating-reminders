import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { OAuthProviderService } from './oauth-provider.service';
import { OAuthAuthService } from './oauth-auth.service';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';

/**
 * Auth module.
 * Provides authentication functionality.
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') || 'dev_jwt_secret';
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    OAuthProviderService,
    OAuthAuthService,
    JwtStrategy,
  ],
  exports: [
    AuthService,
    AuthRepository,
    OAuthProviderService,
    OAuthAuthService,
  ],
})
export class AuthModule {}

