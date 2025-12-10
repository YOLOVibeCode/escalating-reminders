import { Module, Global } from '@nestjs/common';
import { EventBusService } from './event-bus.service';
import type { IEventBus } from '@er/interfaces';

/**
 * Event bus module.
 * Provides in-memory event bus for domain events.
 * Global module - available to all modules without importing.
 */
@Global()
@Module({
  providers: [
    {
      provide: 'IEventBus',
      useClass: EventBusService,
    },
    EventBusService,
  ],
  exports: ['IEventBus', EventBusService],
})
export class EventBusModule {}

