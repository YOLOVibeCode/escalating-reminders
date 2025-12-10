import { Injectable, Logger } from '@nestjs/common';
import type { ILogger, LogLevel } from '@er/interfaces';

/**
 * NestJS-based logging service.
 * Implements ILogger interface using NestJS Logger.
 */
@Injectable()
export class LoggingService implements ILogger {
  private readonly logger = new Logger(LoggingService.name);

  log(level: LogLevel, message: string, context?: string, metadata?: Record<string, unknown>): void {
    const logContext = context || LoggingService.name;
    const logMessage = metadata ? `${message} ${JSON.stringify(metadata)}` : message;

    switch (level) {
      case 'debug':
        this.logger.debug(logMessage, logContext);
        break;
      case 'info':
        this.logger.log(logMessage, logContext);
        break;
      case 'warn':
        this.logger.warn(logMessage, logContext);
        break;
      case 'error':
        this.logger.error(logMessage, logContext);
        break;
      default:
        this.logger.log(logMessage, logContext);
    }
  }

  debug(message: string, context?: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, context, metadata);
  }

  info(message: string, context?: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, context, metadata);
  }

  warn(message: string, context?: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, context, metadata);
  }

  error(message: string, context?: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, context, metadata);
  }
}

