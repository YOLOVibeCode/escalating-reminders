# Domain Model Specification

> **Version**: 1.0.0  
> **Last Updated**: December 2024

---

## Overview

This document defines the domain entities, their relationships, and business rules for the Escalating Reminders system.

---

## Domain Entities

### 1. User Domain

#### User
The primary account holder.

```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Unique, validated
  passwordHash: string;          // bcrypt hashed
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### UserProfile
Extended user information.

```typescript
interface UserProfile {
  id: string;
  userId: string;                // FK to User
  displayName: string;
  timezone: string;              // IANA timezone (e.g., "America/New_York")
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

interface UserPreferences {
  defaultEscalationProfileId?: string;
  quietHoursStart?: string;      // "22:00"
  quietHoursEnd?: string;        // "07:00"
  weekendQuietMode: boolean;
}
```

#### TrustedContact
People who can receive social escalation alerts.

```typescript
interface TrustedContact {
  id: string;
  userId: string;                // FK to User (owner)
  name: string;
  email?: string;
  phone?: string;
  relationship: string;          // "partner", "family", "friend", "caregiver"
  notificationPreferences: {
    email: boolean;
    sms: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2. Billing Domain

#### Subscription
User's subscription status.

```typescript
interface Subscription {
  id: string;
  userId: string;                // FK to User
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  squareSubscriptionId?: string; // Square's subscription ID
  squareCustomerId?: string;     // Square's customer ID
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

enum SubscriptionTier {
  FREE = 'free',
  PERSONAL = 'personal',
  PRO = 'pro',
  FAMILY = 'family'
}

enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  TRIALING = 'trialing'
}
```

#### SubscriptionLimits
Limits per subscription tier.

```typescript
const SUBSCRIPTION_LIMITS = {
  free: {
    maxReminders: 3,
    maxAgents: 1,
    maxTrustedContacts: 0,
    emailWatchers: false,
    calendarSync: false,
    socialEscalation: false
  },
  personal: {
    maxReminders: 20,
    maxAgents: 5,
    maxTrustedContacts: 2,
    emailWatchers: true,
    calendarSync: true,
    socialEscalation: false
  },
  pro: {
    maxReminders: -1,            // Unlimited
    maxAgents: -1,
    maxTrustedContacts: 10,
    emailWatchers: true,
    calendarSync: true,
    socialEscalation: true
  },
  family: {
    maxReminders: -1,
    maxAgents: -1,
    maxTrustedContacts: 20,
    emailWatchers: true,
    calendarSync: true,
    socialEscalation: true,
    sharedReminders: true
  }
};
```

---

### 3. Reminder Domain

#### Reminder
The core entity - something the user needs to be reminded about.

```typescript
interface Reminder {
  id: string;
  userId: string;                // FK to User
  title: string;
  description?: string;
  importance: ReminderImportance;
  status: ReminderStatus;
  escalationProfileId: string;   // FK to EscalationProfile
  completionCriteriaId?: string; // FK to CompletionCriteria
  nextTriggerAt?: Date;          // Next scheduled trigger
  lastTriggeredAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

enum ReminderImportance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum ReminderStatus {
  ACTIVE = 'active',
  SNOOZED = 'snoozed',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}
```

#### ReminderSchedule
When and how often the reminder should trigger.

```typescript
interface ReminderSchedule {
  id: string;
  reminderId: string;            // FK to Reminder
  type: ScheduleType;
  timezone: string;              // IANA timezone
  
  // For one-time
  triggerAt?: Date;
  
  // For recurring
  cronExpression?: string;       // "0 9 * * *" (9am daily)
  
  // For interval
  intervalMinutes?: number;
  
  // Exceptions
  excludeDates?: Date[];         // Skip these dates
  excludeWeekends?: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

enum ScheduleType {
  ONCE = 'once',
  RECURRING = 'recurring',
  INTERVAL = 'interval'
}
```

#### ReminderSnooze
Track snooze history and current snooze state.

```typescript
interface ReminderSnooze {
  id: string;
  reminderId: string;            // FK to Reminder
  snoozedAt: Date;
  snoozeUntil: Date;
  reason?: string;               // "vacation", "kids away", etc.
  originalInput?: string;        // "until next Friday"
  createdAt: Date;
}
```

---

### 4. Escalation Domain

#### EscalationProfile
Defines how a reminder escalates over time.

```typescript
interface EscalationProfile {
  id: string;
  userId?: string;               // Null for system presets
  name: string;
  description?: string;
  isPreset: boolean;             // System-provided profile
  tiers: EscalationTier[];
  createdAt: Date;
  updatedAt: Date;
}

interface EscalationTier {
  tierNumber: number;            // 1, 2, 3, 4, 5
  delayMinutes: number;          // Wait before escalating
  agentIds: string[];            // Which agents to use
  includeTrustedContacts: boolean;
  message?: string;              // Custom message for this tier
}
```

#### EscalationState
Current escalation state for an active reminder trigger.

```typescript
interface EscalationState {
  id: string;
  reminderId: string;            // FK to Reminder
  profileId: string;             // FK to EscalationProfile
  currentTier: number;           // Current escalation tier
  startedAt: Date;               // When escalation began
  lastEscalatedAt?: Date;        // When last tier change happened
  acknowledgedAt?: Date;         // When user acknowledged
  acknowledgedBy?: string;       // User ID or "watcher" or "contact"
  status: EscalationStatus;
  createdAt: Date;
  updatedAt: Date;
}

enum EscalationStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  COMPLETED = 'completed',
  EXPIRED = 'expired'
}
```

#### Preset Escalation Profiles

```typescript
const PRESET_PROFILES = [
  {
    name: 'Gentle',
    description: 'Gradual escalation over hours. Good for low-stakes reminders.',
    tiers: [
      { tierNumber: 1, delayMinutes: 0, agentIds: ['push'], includeTrustedContacts: false },
      { tierNumber: 2, delayMinutes: 60, agentIds: ['push', 'email'], includeTrustedContacts: false },
      { tierNumber: 3, delayMinutes: 180, agentIds: ['push', 'email', 'sms'], includeTrustedContacts: false }
    ]
  },
  {
    name: 'Urgent',
    description: 'Rapid escalation within minutes. For time-sensitive tasks.',
    tiers: [
      { tierNumber: 1, delayMinutes: 0, agentIds: ['push', 'sms'], includeTrustedContacts: false },
      { tierNumber: 2, delayMinutes: 5, agentIds: ['push', 'sms', 'email'], includeTrustedContacts: false },
      { tierNumber: 3, delayMinutes: 15, agentIds: ['push', 'sms', 'email'], includeTrustedContacts: false },
      { tierNumber: 4, delayMinutes: 30, agentIds: ['push', 'sms', 'email'], includeTrustedContacts: true }
    ]
  },
  {
    name: 'Critical',
    description: 'Immediate multi-channel + social escalation. Health/safety.',
    tiers: [
      { tierNumber: 1, delayMinutes: 0, agentIds: ['push', 'sms', 'email'], includeTrustedContacts: false },
      { tierNumber: 2, delayMinutes: 2, agentIds: ['push', 'sms', 'email'], includeTrustedContacts: true },
      { tierNumber: 3, delayMinutes: 5, agentIds: ['push', 'sms', 'email'], includeTrustedContacts: true },
      { tierNumber: 4, delayMinutes: 10, agentIds: ['push', 'sms', 'email'], includeTrustedContacts: true },
      { tierNumber: 5, delayMinutes: 15, agentIds: ['push', 'sms', 'email'], includeTrustedContacts: true }
    ]
  }
];
```

---

### 5. Agent Domain

#### AgentDefinition
Defines an available notification agent.

```typescript
interface AgentDefinition {
  id: string;
  type: string;                  // "email", "sms", "webhook", etc.
  name: string;
  description: string;
  version: string;
  author: string;
  isOfficial: boolean;           // Built by us vs community
  isVerified: boolean;           // Reviewed and approved
  capabilities: AgentCapabilities;
  configurationSchema: ConfigurationSchema;
  minimumTier: SubscriptionTier;
  iconUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AgentCapabilities {
  canPush: boolean;              // Can send outbound notifications
  canPull: boolean;              // Supports polling mode
  canReceiveCommands: boolean;   // Can handle user actions
  supportsRichContent: boolean;  // Images, buttons, etc.
  supportedActions: AgentAction[];
}

enum AgentAction {
  SNOOZE = 'snooze',
  DISMISS = 'dismiss',
  COMPLETE = 'complete',
  ESCALATE = 'escalate'
}

interface ConfigurationSchema {
  fields: ConfigurationField[];
}

interface ConfigurationField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'phone' | 'email' | 'url';
  label: string;
  required: boolean;
  secret: boolean;               // Should be encrypted
  placeholder?: string;
  helpText?: string;
}
```

#### UserAgentSubscription
User's subscription to a specific agent.

```typescript
interface UserAgentSubscription {
  id: string;
  userId: string;                // FK to User
  agentDefinitionId: string;     // FK to AgentDefinition
  isEnabled: boolean;
  configuration: Record<string, unknown>; // Encrypted
  lastTestedAt?: Date;
  lastTestResult?: 'success' | 'failure';
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 6. Watcher Domain

#### EmailWatcher
Monitors email for completion events.

```typescript
interface EmailWatcher {
  id: string;
  userId: string;                // FK to User
  reminderId: string;            // FK to Reminder
  provider: EmailProvider;
  isEnabled: boolean;
  credentials: EncryptedCredentials;
  rules: WatcherRule[];
  lastPolledAt?: Date;
  lastMatchAt?: Date;
  errorCount: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

enum EmailProvider {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
  IMAP = 'imap'
}

interface WatcherRule {
  id: string;
  type: WatcherRuleType;
  pattern: string;               // Regex or exact match
  matchTarget: 'subject' | 'from' | 'body';
}

enum WatcherRuleType {
  CONTAINS = 'contains',
  EXACT = 'exact',
  REGEX = 'regex'
}
```

#### WatcherEvent
Log of watcher matches.

```typescript
interface WatcherEvent {
  id: string;
  watcherId: string;             // FK to EmailWatcher
  reminderId: string;            // FK to Reminder
  matchedAt: Date;
  matchedRule: string;           // Which rule matched
  emailSubject?: string;
  emailFrom?: string;
  action: 'completed' | 'snoozed';
  createdAt: Date;
}
```

---

### 7. Calendar Domain

#### CalendarConnection
OAuth connection to external calendar.

```typescript
interface CalendarConnection {
  id: string;
  userId: string;                // FK to User
  provider: CalendarProvider;
  accountEmail: string;
  accessToken: string;           // Encrypted
  refreshToken: string;          // Encrypted
  tokenExpiresAt: Date;
  lastSyncAt?: Date;
  syncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

enum CalendarProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  APPLE = 'apple'
}
```

#### CalendarSyncRule
Rules for how calendar events affect reminders.

```typescript
interface CalendarSyncRule {
  id: string;
  userId: string;                // FK to User
  connectionId: string;          // FK to CalendarConnection
  calendarId: string;            // Specific calendar to watch
  labelKey: string;              // Event label/tag to match
  action: CalendarRuleAction;
  affectedReminderIds: string[]; // Which reminders this affects
  createdAt: Date;
  updatedAt: Date;
}

enum CalendarRuleAction {
  PAUSE_DURING = 'pause_during', // Pause reminder during event
  SNOOZE_UNTIL_END = 'snooze_until_end',
  SKIP_DAY = 'skip_day'
}
```

---

### 8. Notification Domain

#### NotificationLog
Record of all sent notifications.

```typescript
interface NotificationLog {
  id: string;
  userId: string;                // FK to User
  reminderId: string;            // FK to Reminder
  escalationStateId?: string;    // FK to EscalationState
  agentId: string;               // FK to AgentDefinition
  tier: number;                  // Escalation tier
  status: NotificationStatus;
  sentAt: Date;
  deliveredAt?: Date;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}
```

#### PendingNotification
For pull-mode agents to retrieve.

```typescript
interface PendingNotification {
  id: string;
  userId: string;                // FK to User
  reminderId: string;            // FK to Reminder
  agentId: string;               // FK to AgentDefinition
  payload: NotificationPayload;
  expiresAt: Date;
  retrievedAt?: Date;
  createdAt: Date;
}

interface NotificationPayload {
  title: string;
  message: string;
  escalationTier: number;
  actions: AgentAction[];
  metadata?: Record<string, unknown>;
}
```

---

## Aggregate Roots

### User Aggregate
- User (root)
  - UserProfile
  - TrustedContact[]
  - Subscription

### Reminder Aggregate
- Reminder (root)
  - ReminderSchedule
  - ReminderSnooze[]
  - EscalationState
  - CompletionCriteria

### Agent Aggregate
- UserAgentSubscription (root)
  - AgentDefinition (reference)
  - Configuration

---

## Business Rules

### Reminder Rules
1. A reminder must have exactly one schedule
2. A reminder must have exactly one escalation profile
3. Active reminders must have `nextTriggerAt` set
4. Completed reminders cannot be triggered
5. Snoozed reminders resume after snooze period

### Escalation Rules
1. Escalation always starts at tier 1
2. Tiers must be processed in order (no skipping)
3. Acknowledgment stops escalation
4. Completion stops escalation
5. Social escalation requires Pro tier or higher

### Agent Rules
1. Users can only subscribe to agents allowed by their tier
2. Agent credentials must be validated before activation
3. Failed notifications retry with exponential backoff
4. Maximum 5 retry attempts per notification

### Watcher Rules
1. Email watchers poll at minimum 5-minute intervals
2. Watcher match auto-completes the associated reminder
3. Credentials are encrypted at rest
4. Failed poll attempts trigger user notification after 3 failures

---

## Entity Relationships Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ENTITY RELATIONSHIPS                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   User ─────┬──────────────────────────────────────────────────────────────┐ │
│     │       │                                                              │ │
│     │       ▼                                                              │ │
│     │   UserProfile                                                        │ │
│     │                                                                      │ │
│     ├──▶ Subscription                                                      │ │
│     │                                                                      │ │
│     ├──▶ TrustedContact[]                                                 │ │
│     │                                                                      │ │
│     ├──▶ Reminder[] ──────┬──▶ ReminderSchedule                          │ │
│     │         │           ├──▶ ReminderSnooze[]                          │ │
│     │         │           ├──▶ EscalationState ──▶ EscalationProfile     │ │
│     │         │           └──▶ CompletionCriteria                        │ │
│     │         │                                                           │ │
│     │         └──────────────▶ EmailWatcher[] ──▶ WatcherEvent[]         │ │
│     │                                                                      │ │
│     ├──▶ UserAgentSubscription[] ──▶ AgentDefinition                     │ │
│     │                                                                      │ │
│     ├──▶ CalendarConnection[] ──▶ CalendarSyncRule[]                     │ │
│     │                                                                      │ │
│     └──▶ NotificationLog[]                                                │ │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## State Machines

### Reminder Status State Machine

```
                    ┌─────────┐
                    │  DRAFT  │ (future feature)
                    └────┬────┘
                         │ publish
                         ▼
    ┌───────────────────────────────────────────┐
    │                 ACTIVE                     │◀─────────────┐
    │                                           │              │
    │   (waiting for next trigger)              │              │
    └─────────────┬─────────────────────────────┘              │
                  │                                            │
         trigger  │                                            │
                  ▼                                            │
    ┌───────────────────────────────────────────┐              │
    │               TRIGGERED                    │              │
    │                                           │              │
    │   (escalation in progress)                │              │
    └─────────┬───────────────────┬─────────────┘              │
              │                   │                            │
      snooze  │           acknowledge/complete                 │
              │                   │                            │
              ▼                   ▼                            │
    ┌─────────────────┐   ┌─────────────────┐                 │
    │    SNOOZED      │   │   COMPLETED     │                 │
    │                 │   │                 │                 │
    │  (until date)   │   │   (done)        │                 │
    └────────┬────────┘   └─────────────────┘                 │
             │                                                 │
             │ snooze expires                                  │
             └─────────────────────────────────────────────────┘
```

### Escalation State Machine

```
                    ┌─────────┐
        trigger ───▶│ TIER 1  │
                    └────┬────┘
                         │ delay elapsed
                         ▼
                    ┌─────────┐
                    │ TIER 2  │
                    └────┬────┘
                         │ delay elapsed
                         ▼
                    ┌─────────┐
                    │ TIER 3  │
                    └────┬────┘
                         │ delay elapsed
                         ▼
                    ┌─────────┐
                    │ TIER N  │
                    └────┬────┘
                         │ max tier reached
                         ▼
                    ┌─────────┐
                    │ EXPIRED │
                    └─────────┘

    At any tier:
    ─────────────
    • acknowledge ──▶ ACKNOWLEDGED
    • complete ──────▶ COMPLETED
    • snooze ────────▶ (cancel escalation, set snooze)
```

---

## Validation Rules

### User Validation
```typescript
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});
```

### Reminder Validation
```typescript
const reminderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  importance: z.enum(['low', 'medium', 'high', 'critical']),
  escalationProfileId: z.string().uuid(),
});
```

### Schedule Validation
```typescript
const scheduleSchema = z.object({
  type: z.enum(['once', 'recurring', 'interval']),
  timezone: z.string(), // Validate against IANA timezones
  triggerAt: z.date().optional(),
  cronExpression: z.string().optional(),
  intervalMinutes: z.number().min(1).optional(),
});
```

---

*This domain model serves as the foundation for database schema and API design.*

