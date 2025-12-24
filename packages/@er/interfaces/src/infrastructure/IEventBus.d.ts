export interface IEventBus {
    publish<T extends DomainEvent>(event: T): Promise<void>;
    publishAll(events: DomainEvent[]): Promise<void>;
}
export interface IEventHandler<T extends DomainEvent> {
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
//# sourceMappingURL=IEventBus.d.ts.map