import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import type { ICache } from '@er/interfaces';

/**
 * Cache module.
 * Provides Redis-based caching service.
 * Global module - available to all modules without importing.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'ICache',
      useClass: RedisService,
    },
    RedisService,
  ],
  exports: ['ICache', RedisService],
})
export class CacheModule {}

