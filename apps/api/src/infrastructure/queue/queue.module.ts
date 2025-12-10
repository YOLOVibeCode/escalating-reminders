import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import type { IQueue } from '@er/interfaces';

/**
 * Queue module.
 * Provides BullMQ-based job queue service.
 * Global module - available to all modules without importing.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'IQueue',
      useClass: QueueService,
    },
    QueueService,
  ],
  exports: ['IQueue', QueueService],
})
export class QueueModule {}

