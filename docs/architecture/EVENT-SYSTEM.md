# Event System Specification

> **Version**: 1.0.0  
> **Last Updated**: December 2024

---

## Overview

Escalating Reminders uses an event-driven architecture for internal communication between domains. This enables loose coupling, audit trails, and extensibility.

---

## Event Bus Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EVENT BUS                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   PUBLISHERS                          SUBSCRIBERS                       │
│   ──────────                          ───────────                       │
│                                                                          │
│   ┌─────────────┐                     ┌─────────────────────────────┐  │
│   │  Reminders  │────UserRegistered──▶│  BillingService             │  │
│   │  Service    │                     │  (create free subscription) │  │
│   └─────────────┘                     └─────────────────────────────┘  │
│                                                                          │
│   ┌─────────────┐                     ┌─────────────────────────────┐  │
│   │ Escalation  │───ReminderTriggered─▶│  NotificationService        │  │
│   │  Engine     │                     │  (send notifications)        │  │
│   └─────────────┘                     └─────────────────────────────┘  │
│                                                                          │
│   ┌─────────────┐                     ┌─────────────────────────────┐  │
│   │  Watchers   │────WatcherMatched──▶│  ReminderService            │  │
│   │  Service    │                     │  (mark complete)             │  │
│   └─────────────┘                     └─────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Event Categories

### 1. User Events

Events related to user lifecycle.

```typescript
// UserRegistered
interface UserRegisteredEvent {
  type: 'user.registered';
  payload: {
    userId: string;
    email: string;
    displayName: string;
    timezone: string;
  };
  metadata: EventMetadata;
}

// UserVerified
interface UserVerifiedEvent {
  type: 'user.verified';
  payload: {
    userId: string;
    email: string;
  };
  metadata: EventMetadata;
}

// UserProfileUpdated
interface UserProfileUpdatedEvent {
  type: 'user.profile_updated';
  payload: {
    userId: string;
    changes: Partial<UserProfile>;
  };
  metadata: EventMetadata;
}
```

**Handlers:**

| Event | Handler | Action |
|-------|---------|--------|
| `user.registered` | BillingService | Create free subscription |
| `user.registered` | NotificationService | Send welcome email |
| `user.verified` | OnboardingService | Unlock full features |

---

### 2. Billing Events

Events related to subscriptions and payments.

```typescript
// SubscriptionCreated
interface SubscriptionCreatedEvent {
  type: 'billing.subscription_created';
  payload: {
    userId: string;
    subscriptionId: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
  };
  metadata: EventMetadata;
}

// SubscriptionUpgraded
interface SubscriptionUpgradedEvent {
  type: 'billing.subscription_upgraded';
  payload: {
    userId: string;
    subscriptionId: string;
    previousTier: SubscriptionTier;
    newTier: SubscriptionTier;
  };
  metadata: EventMetadata;
}

// SubscriptionDowngraded
interface SubscriptionDowngradedEvent {
  type: 'billing.subscription_downgraded';
  payload: {
    userId: string;
    subscriptionId: string;
    previousTier: SubscriptionTier;
    newTier: SubscriptionTier;
  };
  metadata: EventMetadata;
}

// SubscriptionCanceled
interface SubscriptionCanceledEvent {
  type: 'billing.subscription_canceled';
  payload: {
    userId: string;
    subscriptionId: string;
    cancelAt: Date;
  };
  metadata: EventMetadata;
}

// PaymentSucceeded
interface PaymentSucceededEvent {
  type: 'billing.payment_succeeded';
  payload: {
    userId: string;
    subscriptionId: string;
    amount: number;
    currency: string;
  };
  metadata: EventMetadata;
}

// PaymentFailed
interface PaymentFailedEvent {
  type: 'billing.payment_failed';
  payload: {
    userId: string;
    subscriptionId: string;
    reason: string;
  };
  metadata: EventMetadata;
}
```

**Handlers:**

| Event | Handler | Action |
|-------|---------|--------|
| `billing.subscription_upgraded` | AgentService | Unlock new agents |
| `billing.subscription_downgraded` | LimitsService | Enforce new limits |
| `billing.payment_succeeded` | NotificationService | Send receipt email |
| `billing.payment_failed` | NotificationService | Send payment failed alert |

---

### 3. Reminder Events

Core reminder lifecycle events.

```typescript
// ReminderCreated
interface ReminderCreatedEvent {
  type: 'reminder.created';
  payload: {
    reminderId: string;
    userId: string;
    title: string;
    nextTriggerAt: Date;
    escalationProfileId: string;
  };
  metadata: EventMetadata;
}

// ReminderUpdated
interface ReminderUpdatedEvent {
  type: 'reminder.updated';
  payload: {
    reminderId: string;
    userId: string;
    changes: Partial<Reminder>;
  };
  metadata: EventMetadata;
}

// ReminderTriggered
interface ReminderTriggeredEvent {
  type: 'reminder.triggered';
  payload: {
    reminderId: string;
    userId: string;
    title: string;
    importance: ReminderImportance;
    escalationProfileId: string;
    triggeredAt: Date;
  };
  metadata: EventMetadata;
}

// ReminderSnoozed
interface ReminderSnoozedEvent {
  type: 'reminder.snoozed';
  payload: {
    reminderId: string;
    userId: string;
    snoozeUntil: Date;
    reason?: string;
    snoozedBy: string; // userId, "watcher", "agent"
  };
  metadata: EventMetadata;
}

// ReminderCompleted
interface ReminderCompletedEvent {
  type: 'reminder.completed';
  payload: {
    reminderId: string;
    userId: string;
    completedAt: Date;
    completedBy: string; // userId, "watcher", "agent"
    completionSource?: string; // "manual", "email_watcher", "webhook"
  };
  metadata: EventMetadata;
}

// ReminderAcknowledged
interface ReminderAcknowledgedEvent {
  type: 'reminder.acknowledged';
  payload: {
    reminderId: string;
    userId: string;
    acknowledgedAt: Date;
    acknowledgedBy: string;
    escalationTier: number;
  };
  metadata: EventMetadata;
}

// ReminderDeleted
interface ReminderDeletedEvent {
  type: 'reminder.deleted';
  payload: {
    reminderId: string;
    userId: string;
  };
  metadata: EventMetadata;
}
```

**Handlers:**

| Event | Handler | Action |
|-------|---------|--------|
| `reminder.created` | SchedulerService | Schedule first trigger |
| `reminder.triggered` | EscalationService | Start escalation |
| `reminder.triggered` | NotificationService | Send tier 1 notifications |
| `reminder.snoozed` | EscalationService | Cancel active escalation |
| `reminder.snoozed` | SchedulerService | Reschedule trigger |
| `reminder.completed` | EscalationService | Cancel active escalation |
| `reminder.acknowledged` | EscalationService | Stop escalation |

---

### 4. Escalation Events

Events related to the escalation engine.

```typescript
// EscalationStarted
interface EscalationStartedEvent {
  type: 'escalation.started';
  payload: {
    escalationStateId: string;
    reminderId: string;
    userId: string;
    profileId: string;
    tier: number;
    startedAt: Date;
  };
  metadata: EventMetadata;
}

// EscalationAdvanced
interface EscalationAdvancedEvent {
  type: 'escalation.advanced';
  payload: {
    escalationStateId: string;
    reminderId: string;
    userId: string;
    previousTier: number;
    newTier: number;
    advancedAt: Date;
  };
  metadata: EventMetadata;
}

// EscalationMaxReached
interface EscalationMaxReachedEvent {
  type: 'escalation.max_reached';
  payload: {
    escalationStateId: string;
    reminderId: string;
    userId: string;
    maxTier: number;
    reachedAt: Date;
  };
  metadata: EventMetadata;
}

// EscalationCanceled
interface EscalationCanceledEvent {
  type: 'escalation.canceled';
  payload: {
    escalationStateId: string;
    reminderId: string;
    userId: string;
    reason: 'acknowledged' | 'completed' | 'snoozed' | 'deleted';
    canceledAt: Date;
  };
  metadata: EventMetadata;
}
```

**Handlers:**

| Event | Handler | Action |
|-------|---------|--------|
| `escalation.started` | NotificationService | Send tier 1 notifications |
| `escalation.advanced` | NotificationService | Send tier N notifications |
| `escalation.max_reached` | AlertService | Log critical alert |
| `escalation.advanced` (with contacts) | TrustedContactService | Notify contacts |

---

### 5. Notification Events

Events related to notification delivery.

```typescript
// NotificationQueued
interface NotificationQueuedEvent {
  type: 'notification.queued';
  payload: {
    notificationId: string;
    userId: string;
    reminderId: string;
    agentType: string;
    tier: number;
  };
  metadata: EventMetadata;
}

// NotificationSent
interface NotificationSentEvent {
  type: 'notification.sent';
  payload: {
    notificationId: string;
    userId: string;
    reminderId: string;
    agentType: string;
    sentAt: Date;
  };
  metadata: EventMetadata;
}

// NotificationDelivered
interface NotificationDeliveredEvent {
  type: 'notification.delivered';
  payload: {
    notificationId: string;
    userId: string;
    reminderId: string;
    agentType: string;
    deliveredAt: Date;
  };
  metadata: EventMetadata;
}

// NotificationFailed
interface NotificationFailedEvent {
  type: 'notification.failed';
  payload: {
    notificationId: string;
    userId: string;
    reminderId: string;
    agentType: string;
    failureReason: string;
    retryCount: number;
  };
  metadata: EventMetadata;
}
```

**Handlers:**

| Event | Handler | Action |
|-------|---------|--------|
| `notification.sent` | LoggingService | Update notification log |
| `notification.failed` | RetryService | Queue retry if attempts < max |
| `notification.failed` | AlertService | Alert if max retries exceeded |

---

### 6. Watcher Events

Events related to email/event watchers.

```typescript
// WatcherCreated
interface WatcherCreatedEvent {
  type: 'watcher.created';
  payload: {
    watcherId: string;
    userId: string;
    reminderId: string;
    provider: EmailProvider;
  };
  metadata: EventMetadata;
}

// WatcherMatched
interface WatcherMatchedEvent {
  type: 'watcher.matched';
  payload: {
    watcherId: string;
    reminderId: string;
    userId: string;
    matchedRule: string;
    emailSubject?: string;
    emailFrom?: string;
    matchedAt: Date;
  };
  metadata: EventMetadata;
}

// WatcherError
interface WatcherErrorEvent {
  type: 'watcher.error';
  payload: {
    watcherId: string;
    userId: string;
    errorMessage: string;
    errorCount: number;
  };
  metadata: EventMetadata;
}
```

**Handlers:**

| Event | Handler | Action |
|-------|---------|--------|
| `watcher.matched` | ReminderService | Complete reminder |
| `watcher.error` | NotificationService | Alert user (after 3 errors) |

---

### 7. Agent Events

Events related to notification agents.

```typescript
// AgentSubscribed
interface AgentSubscribedEvent {
  type: 'agent.subscribed';
  payload: {
    subscriptionId: string;
    userId: string;
    agentType: string;
  };
  metadata: EventMetadata;
}

// AgentCommandReceived
interface AgentCommandReceivedEvent {
  type: 'agent.command_received';
  payload: {
    userId: string;
    reminderId: string;
    agentType: string;
    command: 'snooze' | 'dismiss' | 'complete';
    commandData?: Record<string, unknown>;
  };
  metadata: EventMetadata;
}
```

**Handlers:**

| Event | Handler | Action |
|-------|---------|--------|
| `agent.command_received` (snooze) | ReminderService | Snooze reminder |
| `agent.command_received` (complete) | ReminderService | Complete reminder |
| `agent.command_received` (dismiss) | EscalationService | Acknowledge |

---

### 8. Calendar Events

Events related to calendar integration.

```typescript
// CalendarConnected
interface CalendarConnectedEvent {
  type: 'calendar.connected';
  payload: {
    connectionId: string;
    userId: string;
    provider: CalendarProvider;
    accountEmail: string;
  };
  metadata: EventMetadata;
}

// CalendarSynced
interface CalendarSyncedEvent {
  type: 'calendar.synced';
  payload: {
    connectionId: string;
    userId: string;
    eventsProcessed: number;
    rulesApplied: number;
  };
  metadata: EventMetadata;
}

// HolidayDetected
interface HolidayDetectedEvent {
  type: 'calendar.holiday_detected';
  payload: {
    userId: string;
    holidayDate: Date;
    holidayName: string;
    affectedReminders: string[];
  };
  metadata: EventMetadata;
}
```

**Handlers:**

| Event | Handler | Action |
|-------|---------|--------|
| `calendar.synced` | ReminderService | Adjust schedules |
| `calendar.holiday_detected` | NotificationService | Notify user of adjustments |

---

## Event Metadata

All events include metadata:

```typescript
interface EventMetadata {
  eventId: string;        // Unique event ID
  timestamp: Date;        // When event occurred
  source: string;         // Which service emitted
  correlationId?: string; // For tracing related events
  causationId?: string;   // ID of event that caused this
}
```

---

## Event Implementation

### Using NestJS EventEmitter

```typescript
// events/event-bus.module.ts
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
    }),
  ],
})
export class EventBusModule {}
```

### Publishing Events

```typescript
// domains/reminders/reminders.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuid } from 'uuid';

@Injectable()
export class RemindersService {
  constructor(private eventEmitter: EventEmitter2) {}

  async createReminder(dto: CreateReminderDto, userId: string) {
    const reminder = await this.reminderRepository.create({
      ...dto,
      userId,
    });

    this.eventEmitter.emit('reminder.created', {
      type: 'reminder.created',
      payload: {
        reminderId: reminder.id,
        userId,
        title: reminder.title,
        nextTriggerAt: reminder.nextTriggerAt,
        escalationProfileId: reminder.escalationProfileId,
      },
      metadata: {
        eventId: uuid(),
        timestamp: new Date(),
        source: 'RemindersService',
      },
    });

    return reminder;
  }
}
```

### Subscribing to Events

```typescript
// domains/notifications/notification.handler.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationHandler {
  constructor(private notificationService: NotificationService) {}

  @OnEvent('reminder.triggered')
  async handleReminderTriggered(event: ReminderTriggeredEvent) {
    await this.notificationService.sendTierNotifications(
      event.payload.reminderId,
      event.payload.userId,
      1, // Start at tier 1
    );
  }

  @OnEvent('escalation.advanced')
  async handleEscalationAdvanced(event: EscalationAdvancedEvent) {
    await this.notificationService.sendTierNotifications(
      event.payload.reminderId,
      event.payload.userId,
      event.payload.newTier,
    );
  }
}
```

---

## Event Storage (Audit Trail)

All events are logged for debugging and audit:

```typescript
// events/event-logger.service.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../infrastructure/prisma.service';

@Injectable()
export class EventLoggerService {
  constructor(private prisma: PrismaService) {}

  @OnEvent('**') // Listen to all events
  async logEvent(event: BaseEvent) {
    await this.prisma.eventLog.create({
      data: {
        eventType: event.type,
        userId: event.payload.userId,
        payload: event.payload,
        createdAt: event.metadata.timestamp,
      },
    });
  }
}
```

---

## Event Flow Diagrams

### Reminder Trigger Flow

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Scheduler  │────▶│ ReminderService │────▶│ reminder.triggered│
│  (cron job) │     │  trigger()      │     │     (event)       │
└─────────────┘     └─────────────────┘     └────────┬─────────┘
                                                      │
                            ┌─────────────────────────┼─────────────────────────┐
                            │                         │                         │
                            ▼                         ▼                         ▼
                    ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
                    │ Escalation    │         │ Notification  │         │  EventLogger  │
                    │ Handler       │         │ Handler       │         │  Handler      │
                    │               │         │               │         │               │
                    │ startEscalation│        │ sendNotifs()  │         │ logEvent()   │
                    └───────────────┘         └───────────────┘         └───────────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ escalation.started │
                    │      (event)       │
                    └───────────────────┘
```

### Watcher Match Flow

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Watcher    │────▶│ WatcherService  │────▶│  watcher.matched │
│  Poll Job   │     │  checkEmails()  │     │     (event)      │
└─────────────┘     └─────────────────┘     └────────┬─────────┘
                                                      │
                                                      ▼
                                            ┌───────────────────┐
                                            │  Reminder Handler │
                                            │                   │
                                            │  completeReminder │
                                            └─────────┬─────────┘
                                                      │
                                                      ▼
                                            ┌───────────────────┐
                                            │ reminder.completed │
                                            │      (event)       │
                                            └─────────┬─────────┘
                                                      │
                            ┌─────────────────────────┼─────────────────────────┐
                            │                         │                         │
                            ▼                         ▼                         ▼
                    ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
                    │ Escalation    │         │ Analytics     │         │  EventLogger  │
                    │ Handler       │         │ Handler       │         │  Handler      │
                    │               │         │               │         │               │
                    │ cancelEsc()   │         │ trackSuccess()│         │ logEvent()   │
                    └───────────────┘         └───────────────┘         └───────────────┘
```

---

## Error Handling

### Event Handler Errors

```typescript
@OnEvent('reminder.triggered')
async handleReminderTriggered(event: ReminderTriggeredEvent) {
  try {
    await this.notificationService.sendTierNotifications(...);
  } catch (error) {
    // Log error but don't throw (other handlers should still run)
    this.logger.error(`Failed to handle reminder.triggered: ${error.message}`, {
      eventId: event.metadata.eventId,
      reminderId: event.payload.reminderId,
    });
    
    // Optionally emit failure event
    this.eventEmitter.emit('handler.error', {
      type: 'handler.error',
      payload: {
        originalEvent: event.type,
        handlerName: 'NotificationHandler',
        error: error.message,
      },
    });
  }
}
```

---

## Testing Events

```typescript
// tests/events/reminder-events.spec.ts
describe('Reminder Events', () => {
  let eventEmitter: EventEmitter2;
  let notificationHandler: NotificationHandler;
  let notificationService: MockNotificationService;

  beforeEach(async () => {
    // Setup test module with event emitter
    const module = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [NotificationHandler, NotificationService],
    }).compile();

    eventEmitter = module.get(EventEmitter2);
    notificationHandler = module.get(NotificationHandler);
    notificationService = module.get(NotificationService);
  });

  it('should send notifications when reminder triggered', async () => {
    const event: ReminderTriggeredEvent = {
      type: 'reminder.triggered',
      payload: {
        reminderId: 'rem_123',
        userId: 'usr_456',
        title: 'Test Reminder',
        importance: 'HIGH',
        escalationProfileId: 'esc_789',
        triggeredAt: new Date(),
      },
      metadata: {
        eventId: 'evt_abc',
        timestamp: new Date(),
        source: 'test',
      },
    };

    await eventEmitter.emitAsync('reminder.triggered', event);

    expect(notificationService.sendTierNotifications).toHaveBeenCalledWith(
      'rem_123',
      'usr_456',
      1,
    );
  });
});
```

---

*This event system enables loose coupling between domains while maintaining a complete audit trail of all system activity.*

