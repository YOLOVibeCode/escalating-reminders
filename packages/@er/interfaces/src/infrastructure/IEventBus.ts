/**
 * Interface for publishing and subscribing to domain events.
 * Follows ISP - only event publishing methods.
 */
export interface IEventBus {
  /**
   * Publish an event to all subscribers.
   */
  publish<T extends DomainEvent>(event: T): Promise<void>;

  /**
   * Publish multiple events.
   */
  publishAll(events: DomainEvent[]): Promise<void>;
}

/**
 * Interface for event handlers.
 */
export interface IEventHandler<T extends DomainEvent> {
  /**
   * Handle the event.
   */
  handle(event: T): Promise<void>;
}

export interface DomainEvent {
  type: string;
  payload: Record<string, unknown>;
  metadata: EventMetadata;
}

export interface EventMetadata {
  eventId: string;
  timestamp: Date;
  source: string;
  correlationId?: string;
  causationId?: string;
}

