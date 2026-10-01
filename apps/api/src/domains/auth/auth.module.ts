import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { OAuthAuthService } from './oauth-auth.service';
import { OAuthProviderService } from './oauth-provider.service';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { SmsModule } from '../sms/sms.module';

/**
 * Auth module.
 * Provides authentication functionality.
 */
@Module({
  imports: [
    DatabaseModule,
    SmsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') ?? 'dev_jwt_secret';
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN') ?? '15m',
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
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- NestJS @Module container
export class AuthModule {}

