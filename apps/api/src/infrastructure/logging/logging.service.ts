import { Injectable, Logger } from '@nestjs/common';
import type { ILogger } from '@er/interfaces';

/**
 * NestJS-based logging service.
 * Implements ILogger interface using NestJS Logger.
 */
@Injectable()
export class LoggingService implements ILogger {
  private readonly logger = new Logger(LoggingService.name);

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(message, context ? JSON.stringify(context) : undefined);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.log(message, context ? JSON.stringify(context) : undefined);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(message, context ? JSON.stringify(context) : undefined);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const ctx = context ? JSON.stringify(context) : undefined;
    if (error) {
      this.logger.error(message, error.stack, ctx);
      return;
    }
    this.logger.error(message, undefined, ctx);
  }
}

