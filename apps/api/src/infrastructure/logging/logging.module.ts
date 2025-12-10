import { Module, Global } from '@nestjs/common';
import { LoggingService } from './logging.service';
import type { ILogger } from '@er/interfaces';

/**
 * Logging module.
 * Provides structured logging service.
 * Global module - available to all modules without importing.
 */
@Global()
@Module({
  providers: [
    {
      provide: 'ILogger',
      useClass: LoggingService,
    },
    LoggingService,
  ],
  exports: ['ILogger', LoggingService],
})
export class LoggingModule {}

