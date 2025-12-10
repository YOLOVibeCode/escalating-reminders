import { Injectable, Logger } from '@nestjs/common';
import type { IEventBus, DomainEvent, EventHandler } from '@er/interfaces';

/**
 * In-memory event bus service.
 * Implements IEventBus interface for domain event handling.
 * Simple pub/sub implementation - can be replaced with Redis/RabbitMQ later.
 */
@Injectable()
export class EventBusService implements IEventBus {
  private readonly logger = new Logger(EventBusService.name);
  private handlers: Map<string, Set<EventHandler>> = new Map();

  async publish(event: DomainEvent): Promise<void> {
    const eventType = event.type;
    const handlers = this.handlers.get(eventType);

    if (!handlers || handlers.size === 0) {
      this.logger.debug(`No handlers registered for event: ${eventType}`);
      return;
    }

    this.logger.debug(`Publishing event: ${eventType} to ${handlers.size} handler(s)`);

    // Execute all handlers in parallel
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(`Error in event handler for ${eventType}:`, error);
        // Don't throw - continue processing other handlers
      }
    });

    await Promise.allSettled(promises);
  }

  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);
    this.logger.debug(`Subscribed handler to event: ${eventType}`);
  }

  async unsubscribe(eventType: string, handler: EventHandler): Promise<void> {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }
}

