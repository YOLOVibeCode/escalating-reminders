# E2E Test Implementation Checklist

> **Quick Reference**: Track implementation progress layer by layer.

---

## Quick Start Commands

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Run tests by layer
npm run e2e:critical   # Must pass first
npm run e2e:auth       # Then auth
npm run e2e:dashboard  # Then dashboard
npm run e2e            # Full suite
```

---

## Implementation Progress

### ⬜ Phase 1: Setup

| Task | Status | Notes |
|------|--------|-------|
| Install Playwright | ⬜ | `npm install -D @playwright/test` |
| Install browsers | ⬜ | `npx playwright install` |
| Create e2e directory structure | ⬜ | See structure below |
| Create playwright.config.ts | ⬜ | With layer dependencies |
| Create global-setup.ts | ⬜ | Seed test database |
| Create global-teardown.ts | ⬜ | Cleanup |
| Add data-testid to components | ⬜ | All interactive elements |
| Create test user fixtures | ⬜ | user@test.com, admin@test.com |

**Directory Structure to Create:**
```
apps/web/e2e/
├── playwright.config.ts
├── global-setup.ts
├── global-teardown.ts
├── fixtures/
├── helpers/
├── page-objects/
├── specs/
└── README.md
```

---

### ⬜ Phase 2: Layer 0 - @critical (3 tests)

**File**: `specs/00-critical.spec.ts`

| Test ID | Test | Status | Priority |
|---------|------|--------|----------|
| 00-01 | App loads (home page 200) | ⬜ | CRITICAL |
| 00-02 | Login page renders (form visible) | ⬜ | CRITICAL |
| 00-03 | API health check (/health) | ⬜ | CRITICAL |

**Execution**: Serial, 30s timeout, STOP on failure

---

### ⬜ Phase 3: Layer 1 - @auth (8 tests)

**File**: `specs/01-auth.spec.ts`

| Test ID | Test | Status |
|---------|------|--------|
| 01-01 | User registration | ⬜ |
| 01-02 | User login | ⬜ |
| 01-03 | User logout | ⬜ |
| 01-04 | Admin login | ⬜ |
| 01-05 | Admin logout | ⬜ |
| 01-06 | Invalid login rejected | ⬜ |
| 01-07 | Token refresh works | ⬜ |
| 01-08 | Protected route redirect | ⬜ |

**Dependencies**: Layer 0 passes

---

### ⬜ Phase 4: Layer 2 - @dashboard (37 tests)

**Files**: `specs/02-dashboard/02-user-pages.spec.ts`, `02-admin-pages.spec.ts`

#### User Dashboard Pages (13 tests)

| Test ID | Route | Status |
|---------|-------|--------|
| 02-01 | /dashboard | ⬜ |
| 02-02 | /reminders | ⬜ |
| 02-03 | /reminders/new | ⬜ |
| 02-04 | /reminders/[id] | ⬜ |
| 02-05 | /agents | ⬜ |
| 02-06 | /agents/[id]/configure | ⬜ |
| 02-07 | /agents/subscriptions | ⬜ |
| 02-08 | /notifications | ⬜ |
| 02-09 | /settings | ⬜ |
| 02-10 | /settings/profile | ⬜ |
| 02-11 | /settings/escalation-profiles | ⬜ |
| 02-12 | /settings/escalation-profiles/new | ⬜ |
| 02-13 | Layout renders (sidebar, header) | ⬜ |

#### Admin Dashboard Pages (24 tests)

| Test ID | Route/Test | Status |
|---------|------------|--------|
| 02-14 | /admin/dashboard | ⬜ |
| 02-15 | /admin → redirect | ⬜ |
| 02-16 | /admin/users | ⬜ |
| 02-17 | /admin/users/[id] | ⬜ |
| 02-18 | /admin/reminders | ⬜ |
| 02-19 | /admin/agents | ⬜ |
| 02-20 | /admin/audit | ⬜ |
| 02-21 | /admin/billing | ⬜ |
| 02-22 | /admin/system | ⬜ |
| 02-23 | Admin layout (sidebar) | ⬜ |
| 02-24 | User cannot access admin | ⬜ |
| 02-25 | Admin table pagination | ⬜ |
| 02-26 | Admin search works | ⬜ |
| 02-27 | Admin export button | ⬜ |
| 02-28 | Dashboard stats load | ⬜ |
| 02-29 | Charts render | ⬜ |
| 02-30 | No console errors (user) | ⬜ |
| 02-31 | No console errors (admin) | ⬜ |
| 02-32 | Loading states shown | ⬜ |
| 02-33 | Empty states shown | ⬜ |
| 02-34 | Mobile responsive (user) | ⬜ |
| 02-35 | Mobile responsive (admin) | ⬜ |
| 02-36 | Dark mode toggle | ⬜ |
| 02-37 | Page titles correct | ⬜ |

**Dependencies**: Layer 1 passes

---

### ⬜ Phase 5: Layer 3 - @navigation (40 tests)

**Files**: `specs/03-navigation/03-user-nav.spec.ts`, `03-admin-nav.spec.ts`

#### User Navigation (20 tests)

| Test ID | Test | Status |
|---------|------|--------|
| 03-01 | Sidebar visible | ⬜ |
| 03-02 | Dashboard link | ⬜ |
| 03-03 | Reminders link | ⬜ |
| 03-04 | Agents link | ⬜ |
| 03-05 | Notifications link | ⬜ |
| 03-06 | Settings link | ⬜ |
| 03-07 | Profile link | ⬜ |
| 03-08 | Breadcrumbs work | ⬜ |
| 03-09 | Back button works | ⬜ |
| 03-10 | Active state highlight | ⬜ |
| 03-11 | Sidebar collapse | ⬜ |
| 03-12 | Keyboard navigation | ⬜ |
| 03-13 | Quick actions menu | ⬜ |
| 03-14 | User menu dropdown | ⬜ |
| 03-15 | Logout from menu | ⬜ |
| 03-16 | New reminder shortcut | ⬜ |
| 03-17 | Notifications bell | ⬜ |
| 03-18 | Help link | ⬜ |
| 03-19 | Logo click | ⬜ |
| 03-20 | Search focus (/) | ⬜ |

#### Admin Navigation (20 tests)

| Test ID | Test | Status |
|---------|------|--------|
| 03-21 | Admin sidebar visible | ⬜ |
| 03-22 | Admin dashboard link | ⬜ |
| 03-23 | Users link | ⬜ |
| 03-24 | Reminders link | ⬜ |
| 03-25 | Agents link | ⬜ |
| 03-26 | Audit link | ⬜ |
| 03-27 | Billing link | ⬜ |
| 03-28 | System link | ⬜ |
| 03-29 | Switch to user view | ⬜ |
| 03-30 | Admin breadcrumbs | ⬜ |
| 03-31 | Admin back button | ⬜ |
| 03-32 | Admin active state | ⬜ |
| 03-33 | Admin sidebar collapse | ⬜ |
| 03-34 | Admin keyboard nav | ⬜ |
| 03-35 | Quick user search | ⬜ |
| 03-36 | Admin notifications | ⬜ |
| 03-37 | System status indicator | ⬜ |
| 03-38 | Admin help link | ⬜ |
| 03-39 | Admin logo click | ⬜ |
| 03-40 | Admin global search | ⬜ |

**Dependencies**: Layer 2 passes

---

### ⬜ Phase 6: Layer 4 - @feature (30 tests)

**Files**: `specs/04-feature/*.spec.ts`

#### User CRUD (18 tests)

| Test ID | Test | Status |
|---------|------|--------|
| 04-01 | Create reminder | ⬜ |
| 04-02 | Read reminder | ⬜ |
| 04-03 | Update reminder | ⬜ |
| 04-04 | Delete reminder | ⬜ |
| 04-05 | Snooze reminder | ⬜ |
| 04-06 | Complete reminder | ⬜ |
| 04-07 | Create escalation profile | ⬜ |
| 04-08 | Edit escalation profile | ⬜ |
| 04-09 | Delete escalation profile | ⬜ |
| 04-10 | Subscribe to agent | ⬜ |
| 04-11 | Configure agent | ⬜ |
| 04-12 | Unsubscribe agent | ⬜ |
| 04-13 | Test agent delivery | ⬜ |
| 04-14 | Update profile | ⬜ |
| 04-15 | Change password | ⬜ |
| 04-16 | Update preferences | ⬜ |
| 04-17 | Filter reminders | ⬜ |
| 04-18 | Sort reminders | ⬜ |

#### Admin CRUD (12 tests)

| Test ID | Test | Status |
|---------|------|--------|
| 04-19 | View all users | ⬜ |
| 04-20 | View user detail | ⬜ |
| 04-21 | Update user tier | ⬜ |
| 04-22 | Disable user | ⬜ |
| 04-23 | View all reminders | ⬜ |
| 04-24 | View reminder as admin | ⬜ |
| 04-25 | Manage agent definitions | ⬜ |
| 04-26 | View audit logs | ⬜ |
| 04-27 | Filter audit logs | ⬜ |
| 04-28 | Export audit logs | ⬜ |
| 04-29 | View billing | ⬜ |
| 04-30 | System health check | ⬜ |

**Dependencies**: Layer 3 passes

---

### ⬜ Phase 7: Layer 5 - @integration (5 tests)

**File**: `specs/05-integration.spec.ts`

| Test ID | Test | Status |
|---------|------|--------|
| 05-01 | User creates → admin views | ⬜ |
| 05-02 | Admin changes tier → user sees | ⬜ |
| 05-03 | Reminder escalation flow | ⬜ |
| 05-04 | Agent webhook delivery | ⬜ |
| 05-05 | Full reminder lifecycle | ⬜ |

**Execution**: Serial, 120s timeout  
**Dependencies**: Layer 4 passes

---

### ⬜ Phase 8: Layer 6 - @error (6 tests)

**File**: `specs/06-error.spec.ts`

| Test ID | Test | Status |
|---------|------|--------|
| 06-01 | 404 page renders | ⬜ |
| 06-02 | API error handling | ⬜ |
| 06-03 | Form validation | ⬜ |
| 06-04 | Network timeout handling | ⬜ |
| 06-05 | Session expiry | ⬜ |
| 06-06 | Rate limit response | ⬜ |

**Dependencies**: Layer 5 passes

---

### ⬜ Phase 9: CI/CD Integration

| Task | Status |
|------|--------|
| Create GitHub Actions workflow | ⬜ |
| Configure parallel execution | ⬜ |
| Upload test artifacts | ⬜ |
| Add Slack notification on failure | ⬜ |
| PR blocking on critical failures | ⬜ |

---

## Summary

| Layer | Tests | Status | Progress |
|-------|-------|--------|----------|
| 0 @critical | 3 | ⬜ | 0/3 |
| 1 @auth | 8 | ⬜ | 0/8 |
| 2 @dashboard | 37 | ⬜ | 0/37 |
| 3 @navigation | 40 | ⬜ | 0/40 |
| 4 @feature | 30 | ⬜ | 0/30 |
| 5 @integration | 5 | ⬜ | 0/5 |
| 6 @error | 6 | ⬜ | 0/6 |
| **Total** | **129** | ⬜ | **0/129** |

---

## Legend

- ⬜ Not started
- 🟨 In progress
- ✅ Completed
- ❌ Blocked/Failed

---

*Update this checklist as tests are implemented.*

