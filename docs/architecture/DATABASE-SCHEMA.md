# Database Schema Specification

> **Version**: 1.0.0  
> **Last Updated**: December 2024

---

## Overview

The database is PostgreSQL, managed via Prisma ORM. This document defines all tables, relationships, indexes, and constraints.

---

## ⚠️ Source of Truth

> **`prisma/schema.prisma` is THE single source of truth for all data types.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   apps/api/prisma/schema.prisma                                         │
│                                                                          │
│   This file defines:                                                     │
│   • All database tables (models)                                        │
│   • All relationships                                                    │
│   • All indexes                                                          │
│   • All enums                                                            │
│   • All TypeScript types (generated)                                    │
│                                                                          │
│   When you need to:                                                      │
│   • Add a new entity → Edit schema.prisma                              │
│   • Add a new field → Edit schema.prisma                               │
│   • Change a type → Edit schema.prisma                                 │
│   • Add an enum → Edit schema.prisma                                   │
│                                                                          │
│   Then run: npx prisma migrate dev                                      │
│   Types are automatically generated and available in @er/types         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Configuration

| Setting | Value |
|---------|-------|
| Database | PostgreSQL 15+ |
| ORM | Prisma |
| Connection Pooling | PgBouncer (via Supabase) or built-in |
| Timezone | UTC (all timestamps) |
| Schema Location | `apps/api/prisma/schema.prisma` |

---

## Schema Definition (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER DOMAIN
// ============================================

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  emailVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  profile               UserProfile?
  subscription          Subscription?
  trustedContacts       TrustedContact[]
  reminders             Reminder[]
  escalationProfiles    EscalationProfile[]
  agentSubscriptions    UserAgentSubscription[]
  calendarConnections   CalendarConnection[]
  notificationLogs      NotificationLog[]
  apiKeys               ApiKey[]

  @@index([email])
  @@map("users")
}

model UserProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  displayName String
  timezone    String   @default("America/New_York")
  preferences Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model TrustedContact {
  id                       String   @id @default(uuid())
  userId                   String
  name                     String
  email                    String?
  phone                    String?
  relationship             String
  notificationPreferences  Json     @default("{\"email\": true, \"sms\": true}")
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("trusted_contacts")
}

model ApiKey {
  id          String    @id @default(uuid())
  userId      String
  name        String
  keyHash     String    @unique
  keyPrefix   String    // First 8 chars for identification
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  createdAt   DateTime  @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([keyHash])
  @@map("api_keys")
}

// ============================================
// BILLING DOMAIN
// ============================================

enum SubscriptionTier {
  FREE
  PERSONAL
  PRO
  FAMILY
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
}

model Subscription {
  id                     String             @id @default(uuid())
  userId                 String             @unique
  tier                   SubscriptionTier   @default(FREE)
  status                 SubscriptionStatus @default(ACTIVE)
  squareSubscriptionId   String?
  squareCustomerId       String?
  currentPeriodStart     DateTime           @default(now())
  currentPeriodEnd       DateTime?
  cancelAtPeriodEnd      Boolean            @default(false)
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt

  // Relations
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  paymentHistory  PaymentHistory[]

  @@index([squareSubscriptionId])
  @@map("subscriptions")
}

model PaymentHistory {
  id               String   @id @default(uuid())
  subscriptionId   String
  amount           Int      // Cents
  currency         String   @default("USD")
  squarePaymentId  String?
  status           String   // succeeded, failed, refunded
  createdAt        DateTime @default(now())

  // Relations
  subscription Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@index([subscriptionId])
  @@map("payment_history")
}

// ============================================
// REMINDER DOMAIN
// ============================================

enum ReminderImportance {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum ReminderStatus {
  ACTIVE
  SNOOZED
  COMPLETED
  ARCHIVED
}

model Reminder {
  id                    String             @id @default(uuid())
  userId                String
  title                 String
  description           String?
  importance            ReminderImportance @default(MEDIUM)
  status                ReminderStatus     @default(ACTIVE)
  escalationProfileId   String
  nextTriggerAt         DateTime?
  lastTriggeredAt       DateTime?
  completedAt           DateTime?
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt

  // Relations
  user               User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  escalationProfile  EscalationProfile    @relation(fields: [escalationProfileId], references: [id])
  schedule           ReminderSchedule?
  snoozes            ReminderSnooze[]
  escalationState    EscalationState?
  completionCriteria CompletionCriteria?
  emailWatchers      EmailWatcher[]
  notificationLogs   NotificationLog[]

  @@index([userId, status])
  @@index([status, nextTriggerAt])
  @@index([userId, nextTriggerAt])
  @@map("reminders")
}

enum ScheduleType {
  ONCE
  RECURRING
  INTERVAL
}

model ReminderSchedule {
  id               String       @id @default(uuid())
  reminderId       String       @unique
  type             ScheduleType
  timezone         String       @default("America/New_York")
  triggerAt        DateTime?    // For ONCE
  cronExpression   String?      // For RECURRING
  intervalMinutes  Int?         // For INTERVAL
  excludeDates     DateTime[]   @default([])
  excludeWeekends  Boolean      @default(false)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  // Relations
  reminder Reminder @relation(fields: [reminderId], references: [id], onDelete: Cascade)

  @@map("reminder_schedules")
}

model ReminderSnooze {
  id            String   @id @default(uuid())
  reminderId    String
  snoozedAt     DateTime @default(now())
  snoozeUntil   DateTime
  reason        String?
  originalInput String?  // "until next Friday"
  createdAt     DateTime @default(now())

  // Relations
  reminder Reminder @relation(fields: [reminderId], references: [id], onDelete: Cascade)

  @@index([reminderId])
  @@map("reminder_snoozes")
}

model CompletionCriteria {
  id          String   @id @default(uuid())
  reminderId  String   @unique
  type        String   // "manual", "email_watcher", "webhook", "api"
  config      Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  reminder Reminder @relation(fields: [reminderId], references: [id], onDelete: Cascade)

  @@map("completion_criteria")
}

// ============================================
// ESCALATION DOMAIN
// ============================================

model EscalationProfile {
  id          String   @id @default(uuid())
  userId      String?  // Null for system presets
  name        String
  description String?
  isPreset    Boolean  @default(false)
  tiers       Json     // Array of EscalationTier
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user       User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  reminders  Reminder[]

  @@index([userId])
  @@index([isPreset])
  @@map("escalation_profiles")
}

enum EscalationStatus {
  ACTIVE
  ACKNOWLEDGED
  COMPLETED
  EXPIRED
}

model EscalationState {
  id              String           @id @default(uuid())
  reminderId      String           @unique
  profileId       String
  currentTier     Int              @default(1)
  startedAt       DateTime         @default(now())
  lastEscalatedAt DateTime?
  acknowledgedAt  DateTime?
  acknowledgedBy  String?          // userId, "watcher", "contact"
  status          EscalationStatus @default(ACTIVE)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  // Relations
  reminder Reminder @relation(fields: [reminderId], references: [id], onDelete: Cascade)

  @@index([status])
  @@index([status, lastEscalatedAt])
  @@map("escalation_states")
}

// ============================================
// AGENT DOMAIN
// ============================================

model AgentDefinition {
  id                   String   @id @default(uuid())
  type                 String   @unique // "email", "sms", etc.
  name                 String
  description          String
  version              String
  author               String
  isOfficial           Boolean  @default(false)
  isVerified           Boolean  @default(false)
  capabilities         Json     // AgentCapabilities
  configurationSchema  Json     // ConfigurationSchema
  minimumTier          SubscriptionTier @default(FREE)
  iconUrl              String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  // Relations
  subscriptions UserAgentSubscription[]

  @@map("agent_definitions")
}

model UserAgentSubscription {
  id                  String    @id @default(uuid())
  userId              String
  agentDefinitionId   String
  isEnabled           Boolean   @default(true)
  configuration       Json      @default("{}") // Encrypted in app layer
  webhookSecret       String?   // For inbound webhooks
  lastTestedAt        DateTime?
  lastTestResult      String?   // "success", "failure"
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  user             User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  agentDefinition  AgentDefinition @relation(fields: [agentDefinitionId], references: [id])

  @@unique([userId, agentDefinitionId])
  @@index([userId])
  @@map("user_agent_subscriptions")
}

// ============================================
// WATCHER DOMAIN
// ============================================

enum EmailProvider {
  GMAIL
  OUTLOOK
  IMAP
}

model EmailWatcher {
  id           String        @id @default(uuid())
  userId       String
  reminderId   String
  provider     EmailProvider
  isEnabled    Boolean       @default(true)
  credentials  Json          // Encrypted OAuth tokens or IMAP creds
  rules        Json          // Array of WatcherRule
  lastPolledAt DateTime?
  lastMatchAt  DateTime?
  errorCount   Int           @default(0)
  lastError    String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  // Relations
  reminder     Reminder       @relation(fields: [reminderId], references: [id], onDelete: Cascade)
  events       WatcherEvent[]

  @@index([userId])
  @@index([isEnabled, lastPolledAt])
  @@map("email_watchers")
}

model WatcherEvent {
  id           String   @id @default(uuid())
  watcherId    String
  reminderId   String
  matchedAt    DateTime @default(now())
  matchedRule  String   // Which rule matched
  emailSubject String?
  emailFrom    String?
  action       String   // "completed", "snoozed"
  createdAt    DateTime @default(now())

  // Relations
  watcher EmailWatcher @relation(fields: [watcherId], references: [id], onDelete: Cascade)

  @@index([watcherId])
  @@index([reminderId])
  @@map("watcher_events")
}

// ============================================
// CALENDAR DOMAIN
// ============================================

enum CalendarProvider {
  GOOGLE
  OUTLOOK
  APPLE
}

model CalendarConnection {
  id            String           @id @default(uuid())
  userId        String
  provider      CalendarProvider
  accountEmail  String
  accessToken   String           // Encrypted
  refreshToken  String           // Encrypted
  tokenExpiresAt DateTime
  lastSyncAt    DateTime?
  syncError     String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  // Relations
  user       User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  syncRules  CalendarSyncRule[]

  @@unique([userId, provider, accountEmail])
  @@index([userId])
  @@map("calendar_connections")
}

enum CalendarRuleAction {
  PAUSE_DURING
  SNOOZE_UNTIL_END
  SKIP_DAY
}

model CalendarSyncRule {
  id                   String             @id @default(uuid())
  userId               String
  connectionId         String
  calendarId           String
  labelKey             String             // Event label to match
  action               CalendarRuleAction
  affectedReminderIds  String[]           @default([])
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  // Relations
  connection CalendarConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("calendar_sync_rules")
}

// ============================================
// NOTIFICATION DOMAIN
// ============================================

enum NotificationStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
}

model NotificationLog {
  id                String             @id @default(uuid())
  userId            String
  reminderId        String
  escalationStateId String?
  agentType         String
  tier              Int
  status            NotificationStatus @default(PENDING)
  sentAt            DateTime?
  deliveredAt       DateTime?
  failureReason     String?
  metadata          Json               @default("{}")
  createdAt         DateTime           @default(now())

  // Relations
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reminder Reminder @relation(fields: [reminderId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([reminderId, createdAt])
  @@index([status])
  @@map("notification_logs")
}

model PendingNotification {
  id          String   @id @default(uuid())
  userId      String
  reminderId  String
  agentType   String
  payload     Json
  expiresAt   DateTime
  retrievedAt DateTime?
  createdAt   DateTime @default(now())

  @@index([userId, agentType])
  @@index([expiresAt])
  @@map("pending_notifications")
}

// ============================================
// AUDIT & EVENTS
// ============================================

model EventLog {
  id        String   @id @default(uuid())
  userId    String?
  eventType String
  payload   Json
  createdAt DateTime @default(now())

  @@index([eventType])
  @@index([userId, createdAt])
  @@map("event_logs")
}

model AuditTrail {
  id         String   @id @default(uuid())
  userId     String
  action     String   // "create", "update", "delete"
  resource   String   // "reminder", "agent", etc.
  resourceId String
  changes    Json     @default("{}")
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([userId, createdAt])
  @@index([resource, resourceId])
  @@map("audit_trails")
}
```

---

## Indexes Strategy

### Performance-Critical Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `reminders` | `(status, nextTriggerAt)` | Scheduler queries |
| `reminders` | `(userId, status)` | User's reminder list |
| `escalation_states` | `(status, lastEscalatedAt)` | Escalation advancement |
| `notification_logs` | `(reminderId, createdAt)` | Notification history |
| `pending_notifications` | `(userId, agentType)` | Pull mode queries |
| `email_watchers` | `(isEnabled, lastPolledAt)` | Watcher polling |

### Unique Constraints

| Table | Constraint | Purpose |
|-------|------------|---------|
| `users` | `(email)` | Unique emails |
| `user_agent_subscriptions` | `(userId, agentDefinitionId)` | One subscription per agent |
| `calendar_connections` | `(userId, provider, accountEmail)` | No duplicate connections |

---

## Data Retention

| Table | Retention | Action |
|-------|-----------|--------|
| `notification_logs` | 90 days | Archive to cold storage |
| `watcher_events` | 90 days | Delete |
| `event_logs` | 30 days | Delete |
| `audit_trails` | 1 year | Archive |
| `reminder_snoozes` | 90 days | Delete |

---

## Encryption at Rest

Sensitive fields encrypted at the application layer before storage:

| Table | Field | Encryption |
|-------|-------|------------|
| `user_agent_subscriptions` | `configuration` | AES-256-GCM |
| `email_watchers` | `credentials` | AES-256-GCM |
| `calendar_connections` | `accessToken`, `refreshToken` | AES-256-GCM |
| `api_keys` | `keyHash` | SHA-256 |

---

## Migration Strategy

### Initial Migration

```bash
npx prisma migrate dev --name init
```

### Production Migrations

```bash
npx prisma migrate deploy
```

### Seeding Preset Data

```typescript
// prisma/seed.ts

async function main() {
  // Seed preset escalation profiles
  await prisma.escalationProfile.createMany({
    data: [
      {
        id: 'esc_preset_gentle',
        name: 'Gentle',
        description: 'Gradual escalation over hours',
        isPreset: true,
        tiers: JSON.stringify([
          { tierNumber: 1, delayMinutes: 0, agentIds: ['push'] },
          { tierNumber: 2, delayMinutes: 60, agentIds: ['push', 'email'] },
          { tierNumber: 3, delayMinutes: 180, agentIds: ['push', 'email', 'sms'] }
        ])
      },
      {
        id: 'esc_preset_urgent',
        name: 'Urgent',
        description: 'Rapid escalation within minutes',
        isPreset: true,
        tiers: JSON.stringify([
          { tierNumber: 1, delayMinutes: 0, agentIds: ['push', 'sms'] },
          { tierNumber: 2, delayMinutes: 5, agentIds: ['push', 'sms', 'email'] },
          { tierNumber: 3, delayMinutes: 15, agentIds: ['push', 'sms', 'email'] },
          { tierNumber: 4, delayMinutes: 30, agentIds: ['push', 'sms', 'email'], includeTrustedContacts: true }
        ])
      },
      {
        id: 'esc_preset_critical',
        name: 'Critical',
        description: 'Immediate multi-channel + social escalation',
        isPreset: true,
        tiers: JSON.stringify([
          { tierNumber: 1, delayMinutes: 0, agentIds: ['push', 'sms', 'email'] },
          { tierNumber: 2, delayMinutes: 2, agentIds: ['push', 'sms', 'email'], includeTrustedContacts: true },
          { tierNumber: 3, delayMinutes: 5, agentIds: ['push', 'sms', 'email'], includeTrustedContacts: true },
          { tierNumber: 4, delayMinutes: 10, agentIds: ['push', 'sms', 'email'], includeTrustedContacts: true },
          { tierNumber: 5, delayMinutes: 15, agentIds: ['push', 'sms', 'email'], includeTrustedContacts: true }
        ])
      }
    ]
  });

  // Seed official agents
  await prisma.agentDefinition.createMany({
    data: [
      {
        id: 'agent_email',
        type: 'email',
        name: 'Email',
        description: 'Send notifications via email',
        version: '1.0.0',
        author: 'Escalating Reminders',
        isOfficial: true,
        isVerified: true,
        minimumTier: 'FREE',
        capabilities: JSON.stringify({
          canPush: true,
          canPull: false,
          canReceiveCommands: true,
          supportedActions: ['snooze', 'dismiss', 'complete']
        }),
        configurationSchema: JSON.stringify({ fields: [] })
      },
      {
        id: 'agent_sms',
        type: 'sms',
        name: 'SMS (Twilio)',
        description: 'Send SMS notifications via Twilio',
        version: '1.0.0',
        author: 'Escalating Reminders',
        isOfficial: true,
        isVerified: true,
        minimumTier: 'PERSONAL',
        capabilities: JSON.stringify({
          canPush: true,
          canPull: false,
          canReceiveCommands: true,
          supportedActions: ['snooze', 'dismiss', 'complete']
        }),
        configurationSchema: JSON.stringify({
          fields: [
            { key: 'phoneNumber', type: 'phone', label: 'Your Phone Number', required: true, secret: false }
          ]
        })
      },
      {
        id: 'agent_webhook',
        type: 'webhook',
        name: 'Webhook (Zapier/Make)',
        description: 'Send notifications to external webhooks',
        version: '1.0.0',
        author: 'Escalating Reminders',
        isOfficial: true,
        isVerified: true,
        minimumTier: 'PERSONAL',
        capabilities: JSON.stringify({
          canPush: true,
          canPull: true,
          canReceiveCommands: true,
          supportedActions: ['snooze', 'dismiss', 'complete']
        }),
        configurationSchema: JSON.stringify({
          fields: [
            { key: 'webhookUrl', type: 'url', label: 'Webhook URL', required: true, secret: false }
          ]
        })
      }
    ]
  });
}

main();
```

---

## Database Connection

### Connection String

```
DATABASE_URL="postgresql://user:password@host:5432/escalating_reminders?sslmode=require"
```

### Connection Pooling

For production, use connection pooling:

```
DATABASE_URL="postgresql://user:password@host:6543/escalating_reminders?sslmode=require&pgbouncer=true"
```

---

*This schema is designed for the Prisma ORM and PostgreSQL database.*

