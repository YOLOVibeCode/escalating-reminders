# E2E Test Specification Coverage

> **Version**: 1.0.0  
> **Last Updated**: December 2025  
> **Status**: ✅ Complete

---

## Overview

This document maps E2E tests to the user stories and features defined in `SPECIFICATION.md`. It ensures comprehensive test coverage of all user-facing functionality.

---

## Multi-Environment Support

E2E tests can be run against multiple environments:

| Environment | Command | Seeding | Destructive Tests |
|-------------|---------|---------|-------------------|
| **Local** | `npm run e2e` | ✅ Auto | ✅ Enabled |
| **Staging** | `npm run e2e:staging` | ✅ Auto | ✅ Enabled |
| **Production** | `npm run e2e:production` | ❌ Disabled | ❌ Disabled |
| **Smoke** | `npm run e2e:smoke` | ❌ Disabled | ❌ Disabled |

### Production URLs

```bash
# Run against production
BASE_URL=https://escalating-reminders.com \
API_BASE_URL=https://api.escalating-reminders.com \
npm run e2e:production
```

---

## User Story Coverage

### 1. Registration & Onboarding

| User Story | Test ID | Test File | Status |
|------------|---------|-----------|--------|
| User can register with email/password | `01-01` | `01-auth.spec.ts` | ✅ |
| User can login | `01-02` | `01-auth.spec.ts` | ✅ |
| User can logout | `01-03` | `01-auth.spec.ts` | ✅ |
| Invalid login shows error | `01-06` | `01-auth.spec.ts` | ✅ |
| Token refresh works | `01-07` | `01-auth.spec.ts` | ✅ |
| Protected routes redirect to login | `01-08` | `01-auth.spec.ts` | ✅ |
| OAuth login button visible | `01-09` | `01-auth.spec.ts` | ✅ |
| OAuth login redirects to provider | `01-10` | `01-auth.spec.ts` | ✅ |
| OAuth callback handles tokens | `01-11` | `01-auth.spec.ts` | ✅ |
| OAuth callback handles errors | `01-12` | `01-auth.spec.ts` | ✅ |

### 2. Reminder Management

| User Story | Test ID | Test File | Status |
|------------|---------|-----------|--------|
| User can create reminder | `04-01` | `04-reminders.spec.ts` | ✅ |
| User can view reminder details | `04-02` | `04-reminders.spec.ts` | ✅ |
| User can update reminder | `04-03` | `04-reminders.spec.ts` | ✅ |
| User can delete reminder | `04-04` | `04-reminders.spec.ts` | ✅ |
| User can snooze reminder (basic) | `04-05` | `04-reminders.spec.ts` | ✅ |
| User can snooze reminder - "for 3 days" format | `04-05a` | `04-reminders.spec.ts` | ✅ |
| User can snooze reminder - "until next Friday" format | `04-05b` | `04-reminders.spec.ts` | ✅ |
| User can snooze reminder - "until 9am tomorrow" format | `04-05c` | `04-reminders.spec.ts` | ✅ |
| User can snooze reminder - "until December 25th" format | `04-05d` | `04-reminders.spec.ts` | ✅ |
| User can complete reminder | `04-06` | `04-reminders.spec.ts` | ✅ |
| User can filter reminders | `04-17` | `04-reminders.spec.ts` | ✅ |
| User can sort reminders | `04-18` | `04-reminders.spec.ts` | ✅ |

### 3. Escalation Profiles

| User Story | Test ID | Test File | Status |
|------------|---------|-----------|--------|
| User can create escalation profile | `04-07` | `04-profiles.spec.ts` | ✅ |
| User can edit escalation profile | `04-08` | `04-profiles.spec.ts` | ✅ |
| User can delete escalation profile | `04-09` | `04-profiles.spec.ts` | ✅ |

### 4. Notification Agents

| User Story | Test ID | Test File | Status |
|------------|---------|-----------|--------|
| User can subscribe to agent | `04-10` | `04-agents.spec.ts` | ✅ |
| User can configure agent | `04-11` | `04-agents.spec.ts` | ✅ |
| User can unsubscribe from agent | `04-12` | `04-agents.spec.ts` | ✅ |
| User can test agent delivery | `04-13` | `04-agents.spec.ts` | ✅ |

### 5. User Settings

| User Story | Test ID | Test File | Status |
|------------|---------|-----------|--------|
| User can update profile | `04-14` | `04-settings.spec.ts` | ✅ |
| User can change password | `04-15` | `04-settings.spec.ts` | ✅ |
| User can update preferences | `04-16` | `04-settings.spec.ts` | ✅ |

### 6. Admin Dashboard

| User Story | Test ID | Test File | Status |
|------------|---------|-----------|--------|
| Admin can login | `01-04` | `01-auth.spec.ts` | ✅ |
| Admin can logout | `01-05` | `01-auth.spec.ts` | ✅ |
| Admin can view all users | `04-19` | `04-admin-features.spec.ts` | ✅ |
| Admin can view user details | `04-20` | `04-admin-features.spec.ts` | ✅ |
| Admin can change user tier | `04-21` | `04-admin-features.spec.ts` | ✅ |
| Admin can disable user | `04-22` | `04-admin-features.spec.ts` | ✅ |
| Admin can view all reminders | `04-23` | `04-admin-features.spec.ts` | ✅ |
| Admin can view reminder details | `04-24` | `04-admin-features.spec.ts` | ✅ |
| Admin can manage agents | `04-25` | `04-admin-features.spec.ts` | ✅ |
| Admin can view audit logs | `04-26` | `04-admin-features.spec.ts` | ✅ |
| Admin can filter audit logs | `04-27` | `04-admin-features.spec.ts` | ✅ |
| Admin can export audit logs | `04-28` | `04-admin-features.spec.ts` | ✅ |
| Admin can view billing stats | `04-29` | `04-admin-features.spec.ts` | ✅ |
| Admin can view system health | `04-30` | `04-admin-features.spec.ts` | ✅ |
| User cannot access admin pages | `02-24` | `02-admin-pages.spec.ts` | ✅ |

---

## Page Rendering Coverage

### User Dashboard Pages (13 tests)

| Page | Route | Test ID | Status |
|------|-------|---------|--------|
| Dashboard Home | `/dashboard` | `02-01` | ✅ |
| Reminders List | `/reminders` | `02-02` | ✅ |
| New Reminder Form | `/reminders/new` | `02-03` | ✅ |
| Edit Reminder Form | `/reminders/[id]` | `02-04` | ✅ |
| Agents List | `/agents` | `02-05` | ✅ |
| Agent Configure | `/agents/[id]/configure` | `02-06` | ✅ |
| Agent Subscriptions | `/agents/subscriptions` | `02-07` | ✅ |
| Notifications | `/notifications` | `02-08` | ✅ |
| Settings | `/settings` | `02-09` | ✅ |
| Profile Settings | `/settings/profile` | `02-10` | ✅ |
| Escalation Profiles | `/settings/escalation-profiles` | `02-11` | ✅ |
| New Escalation Profile | `/settings/escalation-profiles/new` | `02-12` | ✅ |
| Layout Renders | - | `02-13` | ✅ |

### Admin Dashboard Pages (24 tests)

| Page | Route | Test ID | Status |
|------|-------|---------|--------|
| Admin Dashboard | `/admin/dashboard` | `02-14` | ✅ |
| Admin Redirect | `/admin` → `/admin/dashboard` | `02-15` | ✅ |
| Users List | `/admin/users` | `02-16` | ✅ |
| User Detail | `/admin/users/[id]` | `02-17` | ✅ |
| Reminders Overview | `/admin/reminders` | `02-18` | ✅ |
| Agents Management | `/admin/agents` | `02-19` | ✅ |
| Audit Logs | `/admin/audit` | `02-20` | ✅ |
| Billing Overview | `/admin/billing` | `02-21` | ✅ |
| System Settings | `/admin/system` | `02-22` | ✅ |
| Admin Layout | - | `02-23` | ✅ |

---

## Integration Test Coverage

| Workflow | Test ID | Description | Status |
|----------|---------|-------------|--------|
| Cross-role visibility | `05-01` | User creates reminder, admin can view | ✅ |
| Tier changes | `05-02` | Admin changes tier, user sees update | ✅ |
| Escalation flow | `05-03` | Create → trigger → escalate → notify | ✅ |
| Webhook delivery | `05-04` | Agent webhook fires on trigger | ✅ |
| Full lifecycle | `05-05` | Create → snooze → complete reminder | ✅ |
| Email delivery | `05-06` | Email notification delivered (MailHog) | ✅ |
| Delivery disabled | `05-07` | Delivery disabled blocks outbound sends | ✅ |
| Usage suspended | `05-08` | Usage suspension throttles per 3-day window | ✅ |

---

## Error Handling Coverage

| Scenario | Test ID | Description | Status |
|----------|---------|-------------|--------|
| 404 Page | `06-01` | Unknown route shows 404 | ✅ |
| API Errors | `06-02` | Server error displays message | ✅ |
| Form Validation | `06-03` | Invalid input shows errors | ✅ |
| Network Timeout | `06-04` | Timeout shows retry option | ✅ |
| Session Expiry | `06-05` | Expired token redirects to login | ✅ |
| Rate Limiting | `06-06` | 429 shows friendly message | ✅ |

---

## Navigation Coverage

### User Navigation (20 tests)

All sidebar links, breadcrumbs, keyboard navigation, and shortcuts are tested.

### Admin Navigation (20 tests)

All admin sidebar links, breadcrumbs, keyboard navigation, and admin-specific shortcuts are tested.

---

## Specification Features Not Yet Covered by E2E

These features from `SPECIFICATION.md` are planned for future phases:

| Feature | Status | Phase |
|---------|--------|-------|
| Calendar Integration | 🔜 Future | Phase 2 |
| Social Escalation (trusted contacts) | 🔜 Future | Phase 2 |
| Natural Language Snooze (NLP parsing) | ✅ Complete | Phase 1 |
| Email Watcher Setup | 🔜 Future | Phase 2 |
| Square Billing Integration | 🔜 Future | Phase 1 |
| Agent SDK Testing | 🔜 Future | Phase 3 |
| Mobile Responsive Full Test | 🔜 Future | - |

---

## Test Statistics

| Layer | Tests | Coverage |
|-------|-------|----------|
| Layer 0 (Critical) | 4 | App loads, login, API health |
| Layer 1 (Auth) | 12 | All auth flows including OAuth |
| Layer 2 (Dashboard) | 37 | All pages render |
| Layer 3 (Navigation) | 40 | All navigation works |
| Layer 4 (Features) | 34 | All CRUD operations |
| Layer 5 (Integration) | 8 | Cross-role workflows |
| Layer 6 (Error) | 6 | Error handling |
| **Total** | **142** | **Core functionality** |

---

## Running Specification Validation

To validate all specifications are covered:

```bash
# Run all tests
npm run e2e

# Run with verbose output
DEBUG=true npm run e2e

# Run against production (smoke tests)
npm run e2e:production

# Run specific feature tests
npm run e2e:features
```

---

## Continuous Integration

Tests run automatically on:
- Pull requests to `main`
- Push to `staging` branch
- Nightly production smoke tests

---

*This document is updated when new features are added to the specification.*
