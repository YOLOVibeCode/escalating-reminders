# Phase 1 (MVP) Remaining Work Analysis

> **Created**: December 2025  
> **Role**: Software Architect  
> **Purpose**: Comprehensive analysis of remaining Phase 1 requirements to achieve full specification compliance

---

## Executive Summary

**Phase 1 Completion Status**: ~75% Complete

### ✅ Completed (Phase 1)
- ✅ Auth & Onboarding (Email/password + OAuth)
- ✅ Reminder CRUD + Scheduling
- ✅ Basic Escalation Engine (3 tiers)
- ✅ Email Agent (SMTP via MailHog)
- ✅ Webhook Agent
- ✅ Delivery Controls (`DELIVERY_DISABLED`, `USAGE_SUSPENDED`)
- ✅ Natural Language Snooze (full spec coverage)
- ✅ Escalation Profile Editing (UI + E2E)

### 🚧 Remaining (Phase 1 Critical Path)
1. **Square Billing Integration** (HIGH PRIORITY)
2. **Email Watchers (Completion Detection)** (HIGH PRIORITY)
3. **Super-Admin Configurability** (MEDIUM PRIORITY)
4. **Agent Marketplace (Minimal v1)** (MEDIUM PRIORITY)
5. **Worker/Scheduler Production Validation** (LOW PRIORITY - currently simulated)

---

## 1. Square Billing Integration

### Current State
- ✅ **Schema**: `Subscription`, `PaymentHistory` tables exist with Square fields
- ✅ **Interfaces**: `IBillingService`, `IPaymentService` interfaces defined
- ✅ **Tests**: Unit tests exist (mocked Square client)
- ❌ **Implementation**: No actual Square API integration
- ❌ **Webhooks**: No webhook handler implementation
- ❌ **UI**: No upgrade/downgrade/manage plan UI
- ❌ **Admin**: No billing stats UI

### What's Needed

#### A) Billing Domain Implementation
```
apps/api/src/domains/billing/
├── billing.service.ts          ❌ MISSING
├── billing.repository.ts        ❌ MISSING
├── square-client.service.ts     ❌ MISSING
├── billing.controller.ts        ❌ MISSING
├── billing.module.ts            ❌ MISSING
└── webhooks/
    └── square-webhook.handler.ts ❌ MISSING
```

**Required Functionality**:
- Create Square customer on user registration/upgrade
- Create subscription via Square API
- Handle webhooks: `subscription.created`, `subscription.updated`, `invoice.payment_made`, `invoice.payment_failed`
- Update local `Subscription` model based on Square events
- Cancel subscription (immediate vs. end of period)
- Upgrade/downgrade subscription tiers

#### B) Frontend UI
```
apps/web/src/app/(dashboard)/
├── billing/
│   ├── page.tsx                 ❌ MISSING (plan overview)
│   ├── upgrade/page.tsx         ❌ MISSING
│   └── manage/page.tsx          ❌ MISSING
└── settings/
    └── billing/page.tsx          ❌ MISSING (billing settings)
```

**Required Pages**:
- Plan overview (current tier, usage, next billing date)
- Upgrade flow (Square checkout integration)
- Manage subscription (cancel, change plan)
- Payment history
- Billing settings (payment method)

#### C) Admin Dashboard
```
apps/web/src/app/admin/
└── billing/
    ├── page.tsx                  ❌ MISSING (billing stats)
    └── [id]/page.tsx             ❌ MISSING (user billing details)
```

**Required Features**:
- Billing statistics (MRR, churn, revenue)
- User billing details view
- Manual subscription adjustments
- Payment failure alerts

#### D) Tests Required
- [x] Unit: Billing service adapters (Square client mocked) ✅
- [ ] Integration: Webhook ingestion updates DB ❌
- [ ] E2E: Upgrade flow against Square sandbox ❌

### Estimated Effort
- **Backend**: 3-5 days
- **Frontend**: 2-3 days
- **Admin UI**: 1-2 days
- **Tests**: 2-3 days
- **Total**: ~8-13 days

---

## 2. Email Watchers (Completion Detection)

### Current State
- ✅ **Schema**: `EmailWatcher`, `WatcherEvent` tables exist
- ✅ **Completion Service**: `ReminderCompletionService` exists
- ✅ **Tests**: Unit tests for rule matching exist
- ❌ **Implementation**: No actual watcher polling service
- ❌ **Worker**: No background job to poll email
- ❌ **UI**: No watcher setup/configuration UI
- ❌ **Provider Integration**: No Gmail/IMAP/Microsoft Graph integration

### What's Needed

#### A) Decision Required
**Choose v1 approach**:
- **Option 1**: IMAP polling (simpler, works with any email)
- **Option 2**: Provider API (Gmail API, Microsoft Graph) - more reliable, OAuth required
- **Recommendation**: Start with **Gmail API** (OAuth already implemented, more reliable)

#### B) Watchers Domain Implementation
```
apps/api/src/domains/watchers/
├── watcher.service.ts            ❌ MISSING
├── watcher.repository.ts         ❌ MISSING
├── providers/
│   ├── gmail-watcher.service.ts  ❌ MISSING
│   ├── imap-watcher.service.ts   ❌ MISSING (optional)
│   └── graph-watcher.service.ts  ❌ MISSING (optional)
├── watcher.controller.ts         ❌ MISSING
└── watcher.module.ts             ❌ MISSING
```

**Required Functionality**:
- Create watcher with provider credentials
- Define watcher rules (subject patterns, sender, date ranges)
- Poll email provider (Gmail API recommended)
- Match emails against rules
- Emit `ReminderCompleted` event when match found
- Handle errors (rate limits, auth failures)

#### C) Worker Integration
```
apps/api/src/workers/
└── processors/
    └── watcher-processor.ts      ❌ MISSING
```

**Required Functionality**:
- Scheduled job (every 5-15 minutes)
- Poll all active watchers
- Process matches and emit events
- Handle rate limiting
- Retry failed polls

#### D) Frontend UI
```
apps/web/src/app/(dashboard)/
└── reminders/
    └── [id]/
        └── watchers/
            ├── page.tsx          ❌ MISSING (watcher list)
            ├── new/page.tsx      ❌ MISSING (create watcher)
            └── [watcherId]/page.tsx ❌ MISSING (edit watcher)
```

**Required Features**:
- List watchers for a reminder
- Create watcher (choose provider, configure rules)
- Test watcher (send test email, verify match)
- View watcher events/history
- Enable/disable watcher

#### E) Tests Required
- [x] Unit: Rule matching ✅
- [ ] Integration: Watcher emits `ReminderCompleted` event ❌
- [ ] E2E: Simulated watcher event completes reminder ❌

### Estimated Effort
- **Backend**: 4-6 days
- **Worker**: 2-3 days
- **Frontend**: 2-3 days
- **Tests**: 2-3 days
- **Total**: ~10-15 days

---

## 3. Super-Admin Configurability

### Current State
- ✅ **Policy**: `DELIVERY_DISABLED` and `USAGE_SUSPENDED` work via env vars
- ✅ **Tests**: Unit tests exist for policy reading
- ❌ **Database Storage**: No system settings table
- ❌ **Admin UI**: No UI to change settings
- ❌ **API**: No admin endpoint to update settings

### What's Needed

#### A) Database Schema
```prisma
model SystemSetting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
  updatedBy String?  // Admin user ID
}
```

**Required Settings**:
- `usage_suspension_window_days` (default: 3)
- `usage_suspension_allowance` (default: 10)
- Future: `max_reminders_per_tier`, `notification_rate_limit`, etc.

#### B) Admin API
```
apps/api/src/domains/admin/
└── system-settings.controller.ts ❌ MISSING
```

**Endpoints**:
- `GET /admin/system/settings` - List all settings
- `PUT /admin/system/settings/:key` - Update setting
- `GET /admin/system/settings/:key/history` - Audit log

#### C) Admin UI
```
apps/web/src/app/admin/
└── system/
    └── settings/
        └── page.tsx              ❌ MISSING
```

**Required Features**:
- View current settings
- Edit settings (with validation)
- View change history
- Revert to defaults

#### D) Policy Service Update
Update `DeliveryPolicyService` to read from DB instead of env vars (with env var fallback).

### Estimated Effort
- **Backend**: 1-2 days
- **Frontend**: 1 day
- **Tests**: 1 day
- **Total**: ~3-4 days

---

## 4. Agent Marketplace (Minimal v1)

### Current State
- ✅ **Agent System**: Email and Webhook agents work
- ✅ **Agent Subscription**: Users can subscribe to agents
- ❌ **Marketplace**: No curated list/discovery
- ❌ **Agent Registry**: No official agent listing
- ❌ **Enable/Disable**: No global agent enable/disable

### What's Needed

#### A) Agent Registry
```
apps/api/src/domains/agents/
└── agent-registry.service.ts     ❌ MISSING
```

**Required Functionality**:
- Curated list of official agents
- Agent metadata (name, description, icon, capabilities)
- Enable/disable agents globally
- Version tracking

#### B) Database Schema
```prisma
model Agent {
  id          String   @id @default(uuid())
  type        String   @unique  // "email", "webhook", "sms", etc.
  name        String
  description String
  isOfficial  Boolean  @default(false)
  isEnabled   Boolean  @default(true)
  version     String
  metadata    Json     // Icon, capabilities, etc.
}
```

#### C) Frontend UI
```
apps/web/src/app/(dashboard)/
└── agents/
    └── marketplace/
        └── page.tsx              ❌ MISSING
```

**Required Features**:
- Browse available agents
- View agent details
- Subscribe to agent
- See official vs. community agents

#### D) Admin UI
```
apps/web/src/app/admin/
└── agents/
    └── page.tsx                  ❌ MISSING (enhance existing)
```

**Required Features**:
- Enable/disable agents globally
- View agent usage stats
- Manage agent metadata

### Estimated Effort
- **Backend**: 2-3 days
- **Frontend**: 2 days
- **Tests**: 1 day
- **Total**: ~5-6 days

---

## 5. Worker/Scheduler Production Validation

### Current State
- ✅ **Simulation**: E2E tests use explicit trigger endpoint
- ✅ **Integration Tests**: Worker processes queue and advances tiers
- ❌ **Production Mode**: No validation that worker runs in production
- ❌ **Scheduler**: No validation that scheduler finds due reminders

### What's Needed

#### A) Decision Required
**Choose CI-friendly approach**:
- **Option 1**: Keep explicit trigger endpoint as "test-only contract" (current approach)
- **Option 2**: Start worker in test run (requires Redis/BullMQ in CI)
- **Recommendation**: **Option 1** (simpler, faster tests)

#### B) Production Validation
- Add health check endpoint for worker status
- Add metrics/logging for scheduler runs
- Document production deployment requirements

### Estimated Effort
- **Validation**: 1 day
- **Documentation**: 0.5 days
- **Total**: ~1.5 days

---

## 6. Documentation Updates

### Required Updates

#### A) SPECIFICATION.md
- [ ] Update header: `Status: Draft` → `Status: Active` or `Status: MVP Complete`
- [ ] Update `Last Updated`: December 2024 → December 2025
- [ ] Update Phase 1 checklist items to reflect completion

#### B) E2E Coverage Map
- [ ] Verify all ✅ items are actually implemented
- [ ] Mark Square billing as 🔜 Future until implemented
- [ ] Mark Email Watchers as 🔜 Future until implemented

#### C) Architecture Checklist
- [ ] Update completion status for OAuth (now ✅)
- [ ] Update completion status for escalation profile editing (now ✅)

### Estimated Effort
- **Documentation**: 0.5 days

---

## Summary: Remaining Phase 1 Work

| Item | Priority | Effort | Status |
|------|----------|--------|--------|
| **Square Billing** | HIGH | 8-13 days | ❌ Not Started |
| **Email Watchers** | HIGH | 10-15 days | ❌ Not Started |
| **Super-Admin Config** | MEDIUM | 3-4 days | ❌ Not Started |
| **Agent Marketplace** | MEDIUM | 5-6 days | ❌ Not Started |
| **Worker Validation** | LOW | 1.5 days | ❌ Not Started |
| **Documentation** | LOW | 0.5 days | ❌ Not Started |
| **TOTAL** | | **~28-40 days** | |

---

## Recommended Execution Order

1. **Square Billing** (blocks user subscriptions)
2. **Email Watchers** (core completion detection)
3. **Super-Admin Config** (operational flexibility)
4. **Agent Marketplace** (user discovery)
5. **Worker Validation** (production readiness)
6. **Documentation** (ongoing)

---

## Critical Path Analysis

**Blockers for MVP Launch**:
- ✅ None currently blocking (core features work)

**Nice-to-Have for MVP**:
- Square Billing (users can't upgrade, but free tier works)
- Email Watchers (manual completion works)
- Super-Admin Config (env vars work)
- Agent Marketplace (direct subscription works)

**Recommendation**: 
- **MVP Launch**: Can proceed without Square Billing and Email Watchers if free tier is sufficient
- **Production Ready**: Requires Square Billing for paid plans
- **Full Spec Compliance**: Requires all items above

---

## Next Steps

1. **Review this analysis** with stakeholders
2. **Prioritize** remaining work based on business needs
3. **Create detailed implementation plans** for each item
4. **Assign ownership** and track progress
5. **Update architecture-checklist.md** as work completes

---

*This document should be updated as work progresses and requirements evolve.*
