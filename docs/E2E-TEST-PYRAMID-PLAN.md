# E2E Test Pyramid Plan & Checklist

> **Version**: 1.0.0  
> **Last Updated**: December 2024  
> **Status**: Planning  
> **Owner**: QA Team

---

## Overview

This document defines the fail-fast test pyramid architecture for Escalating Reminders E2E testing. The strategy ensures rapid feedback, minimal wasted test execution time, and comprehensive coverage.

---

## Test Pyramid Architecture

```
                                    ┌───────────────────┐
                                    │  Layer 6: @error  │  6 tests
                                    │  Error Handling   │  ↑ If L5 fails → skip
                                    └─────────┬─────────┘
                               ┌──────────────┴──────────────┐
                               │   Layer 5: @integration     │  5 tests
                               │   Cross-Role Workflows      │  ↑ If L4 fails → skip
                               └──────────────┬──────────────┘
                          ┌───────────────────┴───────────────────┐
                          │       Layer 4: @feature               │  ~30 tests
                          │       CRUD Operations per Role        │  ↑ If L3 fails → skip
                          └───────────────────┬───────────────────┘
                     ┌────────────────────────┴────────────────────────┐
                     │            Layer 3: @navigation                 │  ~40 tests
                     │            Sidebar Navigation Works             │  ↑ If L2 fails → skip
                     └────────────────────────┬────────────────────────┘
                ┌─────────────────────────────┴─────────────────────────┐
                │               Layer 2: @dashboard                      │  37 tests
                │               All Pages Render Without Errors          │  ↑ If L1 fails → skip
                └─────────────────────────────┬─────────────────────────┘
           ┌──────────────────────────────────┴──────────────────────────┐
           │                    Layer 1: @auth                            │  8 tests
           │                    All Roles Can Authenticate                │  ↑ If L0 fails → skip
           └──────────────────────────────────┬──────────────────────────┘
      ┌───────────────────────────────────────┴───────────────────────────┐
      │                        Layer 0: @critical                          │  3 tests
      │                        App Loads, Login Page Works                 │  SERIAL MODE
      └────────────────────────────────────────────────────────────────────┘
```

---

## User Roles for Testing

| Role | Access Level | Test Coverage |
|------|--------------|---------------|
| **User** | Own resources, dashboard | Layers 1-6 |
| **Admin** | All resources, admin panel | Layers 1-6 |
| **Unauthenticated** | Public pages only | Layer 0 |

---

## Layer Definitions

### Layer 0: @critical (3 tests)

**Purpose**: Absolute minimum viability. If these fail, nothing else matters.

| Test ID | Test Name | Description | Timeout |
|---------|-----------|-------------|---------|
| `00-01` | App loads | Home page returns 200 | 30s |
| `00-02` | Login page renders | Login form is visible | 30s |
| `00-03` | API health check | `/health` endpoint responds | 30s |

**Execution Mode**: Serial (one by one)  
**Fail Behavior**: Stop immediately on first failure  
**Dependencies**: None (first to run)

---

### Layer 1: @auth (8 tests)

**Purpose**: Verify all authentication flows for all roles.

| Test ID | Test Name | Description | Timeout |
|---------|-----------|-------------|---------|
| `01-01` | User registration | New user can register | 60s |
| `01-02` | User login | Existing user can login | 60s |
| `01-03` | User logout | User can logout | 60s |
| `01-04` | Admin login | Admin can login | 60s |
| `01-05` | Admin logout | Admin can logout | 60s |
| `01-06` | Invalid login rejected | Wrong password shows error | 60s |
| `01-07` | Token refresh works | Access token refreshes | 60s |
| `01-08` | Protected route redirect | Unauthenticated → login | 60s |

**Execution Mode**: Parallel (within layer)  
**Fail Behavior**: If any fail → skip Layer 2+  
**Dependencies**: Layer 0 passes

---

### Layer 2: @dashboard (37 tests)

**Purpose**: Every page renders without JavaScript errors.

#### User Dashboard Pages (13 tests)

| Test ID | Test Name | Route | Timeout |
|---------|-----------|-------|---------|
| `02-01` | Dashboard home | `/dashboard` | 60s |
| `02-02` | Reminders list | `/reminders` | 60s |
| `02-03` | New reminder form | `/reminders/new` | 60s |
| `02-04` | Edit reminder form | `/reminders/[id]` | 60s |
| `02-05` | Agents list | `/agents` | 60s |
| `02-06` | Agent configure | `/agents/[id]/configure` | 60s |
| `02-07` | Agent subscriptions | `/agents/subscriptions` | 60s |
| `02-08` | Notifications | `/notifications` | 60s |
| `02-09` | Settings | `/settings` | 60s |
| `02-10` | Profile settings | `/settings/profile` | 60s |
| `02-11` | Escalation profiles list | `/settings/escalation-profiles` | 60s |
| `02-12` | New escalation profile | `/settings/escalation-profiles/new` | 60s |
| `02-13` | Layout renders | Sidebar, header visible | 60s |

#### Admin Dashboard Pages (24 tests)

| Test ID | Test Name | Route | Timeout |
|---------|-----------|-------|---------|
| `02-14` | Admin dashboard | `/admin/dashboard` | 60s |
| `02-15` | Admin redirect | `/admin` → `/admin/dashboard` | 60s |
| `02-16` | Users list | `/admin/users` | 60s |
| `02-17` | User detail | `/admin/users/[id]` | 60s |
| `02-18` | Reminders overview | `/admin/reminders` | 60s |
| `02-19` | Agents management | `/admin/agents` | 60s |
| `02-20` | Audit logs | `/admin/audit` | 60s |
| `02-21` | Billing overview | `/admin/billing` | 60s |
| `02-22` | System settings | `/admin/system` | 60s |
| `02-23` | Admin layout renders | Admin sidebar visible | 60s |
| `02-24` | User cannot access admin | User → 403/redirect | 60s |
| `02-25` | Admin table pagination | Tables paginate | 60s |
| `02-26` | Admin search works | Search filters data | 60s |
| `02-27` | Admin export button | Export is clickable | 60s |
| `02-28` | Dashboard stats load | Stats cards render | 60s |
| `02-29` | Charts render | Activity charts visible | 60s |
| `02-30` | No console errors (user) | Zero JS errors | 60s |
| `02-31` | No console errors (admin) | Zero JS errors | 60s |
| `02-32` | Loading states shown | Spinners visible | 60s |
| `02-33` | Empty states shown | Empty list messages | 60s |
| `02-34` | Mobile responsive (user) | Viewport 375px | 60s |
| `02-35` | Mobile responsive (admin) | Viewport 375px | 60s |
| `02-36` | Dark mode toggle | Theme switches | 60s |
| `02-37` | Page titles correct | Document title set | 60s |

**Execution Mode**: Parallel (within role groups)  
**Fail Behavior**: If any fail → skip Layer 3+  
**Dependencies**: Layer 1 passes

---

### Layer 3: @navigation (40 tests)

**Purpose**: Verify sidebar navigation links work correctly.

#### User Navigation (20 tests)

| Test ID | Test Name | Description | Timeout |
|---------|-----------|-------------|---------|
| `03-01` | Sidebar visible | Sidebar renders | 60s |
| `03-02` | Dashboard link | Click → /dashboard | 60s |
| `03-03` | Reminders link | Click → /reminders | 60s |
| `03-04` | Agents link | Click → /agents | 60s |
| `03-05` | Notifications link | Click → /notifications | 60s |
| `03-06` | Settings link | Click → /settings | 60s |
| `03-07` | Profile link | Click → /settings/profile | 60s |
| `03-08` | Breadcrumbs work | Click breadcrumb → nav | 60s |
| `03-09` | Back button works | History navigation | 60s |
| `03-10` | Active state highlight | Current page highlighted | 60s |
| `03-11` | Sidebar collapse | Collapse/expand works | 60s |
| `03-12` | Keyboard navigation | Tab through links | 60s |
| `03-13` | Quick actions menu | Dropdown works | 60s |
| `03-14` | User menu dropdown | Profile menu opens | 60s |
| `03-15` | Logout from menu | Logout works from menu | 60s |
| `03-16` | New reminder shortcut | Quick create button | 60s |
| `03-17` | Notifications bell | Badge shows count | 60s |
| `03-18` | Help link | Opens help/docs | 60s |
| `03-19` | Logo click | Returns to dashboard | 60s |
| `03-20` | Search focus | / key focuses search | 60s |

#### Admin Navigation (20 tests)

| Test ID | Test Name | Description | Timeout |
|---------|-----------|-------------|---------|
| `03-21` | Admin sidebar visible | Admin sidebar renders | 60s |
| `03-22` | Admin dashboard link | Click → /admin/dashboard | 60s |
| `03-23` | Users link | Click → /admin/users | 60s |
| `03-24` | Reminders link | Click → /admin/reminders | 60s |
| `03-25` | Agents link | Click → /admin/agents | 60s |
| `03-26` | Audit link | Click → /admin/audit | 60s |
| `03-27` | Billing link | Click → /admin/billing | 60s |
| `03-28` | System link | Click → /admin/system | 60s |
| `03-29` | Switch to user view | Admin can view as user | 60s |
| `03-30` | Admin breadcrumbs | Admin breadcrumbs work | 60s |
| `03-31` | Admin back button | History navigation | 60s |
| `03-32` | Admin active state | Current page highlighted | 60s |
| `03-33` | Admin sidebar collapse | Collapse/expand works | 60s |
| `03-34` | Admin keyboard nav | Tab through links | 60s |
| `03-35` | Quick user search | Search in admin header | 60s |
| `03-36` | Admin notifications | Admin alerts badge | 60s |
| `03-37` | System status indicator | Health indicator | 60s |
| `03-38` | Admin help link | Opens admin docs | 60s |
| `03-39` | Admin logo click | Returns to admin dash | 60s |
| `03-40` | Admin global search | / key focuses search | 60s |

**Execution Mode**: Parallel (within role groups)  
**Fail Behavior**: If any fail → skip Layer 4+  
**Dependencies**: Layer 2 passes

---

### Layer 4: @feature (30 tests)

**Purpose**: CRUD operations work for each domain per role.

#### User CRUD Features (18 tests)

| Test ID | Test Name | Description | Timeout |
|---------|-----------|-------------|---------|
| `04-01` | Create reminder | Fill form, submit, success | 60s |
| `04-02` | Read reminder | View reminder details | 60s |
| `04-03` | Update reminder | Edit and save | 60s |
| `04-04` | Delete reminder | Delete with confirm | 60s |
| `04-05` | Snooze reminder | Snooze action works | 60s |
| `04-06` | Complete reminder | Mark as complete | 60s |
| `04-07` | Create escalation profile | Custom profile created | 60s |
| `04-08` | Edit escalation profile | Update profile | 60s |
| `04-09` | Delete escalation profile | Remove profile | 60s |
| `04-10` | Subscribe to agent | Add agent subscription | 60s |
| `04-11` | Configure agent | Update agent config | 60s |
| `04-12` | Unsubscribe agent | Remove subscription | 60s |
| `04-13` | Test agent delivery | Test notification sent | 60s |
| `04-14` | Update profile | Save profile changes | 60s |
| `04-15` | Change password | Password updated | 60s |
| `04-16` | Update preferences | Save preferences | 60s |
| `04-17` | Filter reminders | Status filter works | 60s |
| `04-18` | Sort reminders | Column sorting works | 60s |

#### Admin CRUD Features (12 tests)

| Test ID | Test Name | Description | Timeout |
|---------|-----------|-------------|---------|
| `04-19` | View all users | User list loads | 60s |
| `04-20` | View user detail | User details load | 60s |
| `04-21` | Update user tier | Change subscription | 60s |
| `04-22` | Disable user | User suspended | 60s |
| `04-23` | View all reminders | Global reminder list | 60s |
| `04-24` | View reminder as admin | Cross-user view | 60s |
| `04-25` | Manage agent definitions | Add/edit agents | 60s |
| `04-26` | View audit logs | Audit entries load | 60s |
| `04-27` | Filter audit logs | Date range filter | 60s |
| `04-28` | Export audit logs | CSV download | 60s |
| `04-29` | View billing | Billing stats load | 60s |
| `04-30` | System health check | Health metrics load | 60s |

**Execution Mode**: Parallel (within role groups)  
**Fail Behavior**: If any fail → skip Layer 5+  
**Dependencies**: Layer 3 passes

---

### Layer 5: @integration (5 tests)

**Purpose**: Cross-role and cross-feature workflows.

| Test ID | Test Name | Description | Timeout |
|---------|-----------|-------------|---------|
| `05-01` | User creates, admin views | Admin sees user's reminder | 90s |
| `05-02` | Admin changes tier, user sees | Tier change reflects | 90s |
| `05-03` | Reminder escalation flow | Create → trigger → notify | 120s |
| `05-04` | Agent webhook delivery | Webhook fires on trigger | 90s |
| `05-05` | Full reminder lifecycle | Create → snooze → complete | 120s |

**Execution Mode**: Serial (complex dependencies)  
**Fail Behavior**: If any fail → skip Layer 6  
**Dependencies**: Layer 4 passes

---

### Layer 6: @error (6 tests)

**Purpose**: Error handling and edge cases.

| Test ID | Test Name | Description | Timeout |
|---------|-----------|-------------|---------|
| `06-01` | 404 page renders | Unknown route shows 404 | 60s |
| `06-02` | API error handling | Server error shows message | 60s |
| `06-03` | Form validation | Invalid input shows errors | 60s |
| `06-04` | Network timeout handling | Timeout shows retry | 60s |
| `06-05` | Session expiry | Expired token → re-login | 60s |
| `06-06` | Rate limit response | 429 shows friendly message | 60s |

**Execution Mode**: Parallel  
**Fail Behavior**: Report all failures  
**Dependencies**: Layer 5 passes

---

## File Structure

```
apps/web/e2e/
├── playwright.config.ts           # Playwright configuration
├── global-setup.ts                # Database seeding, auth setup
├── global-teardown.ts             # Cleanup
├── fixtures/
│   ├── auth.fixture.ts            # Authentication helpers
│   ├── test-data.fixture.ts       # Test data factories
│   └── page.fixture.ts            # Page object models
├── helpers/
│   ├── login-as-role.ts           # loginAsRole() helper
│   ├── assert-on-dashboard.ts     # assertOnDashboard() helper
│   ├── assert-no-console-errors.ts
│   └── wait-for-api.ts
├── page-objects/
│   ├── login.page.ts
│   ├── register.page.ts
│   ├── dashboard.page.ts
│   ├── reminders.page.ts
│   ├── agents.page.ts
│   ├── settings.page.ts
│   ├── admin-dashboard.page.ts
│   ├── admin-users.page.ts
│   └── admin-audit.page.ts
├── specs/
│   ├── 00-critical.spec.ts        # Layer 0 tests
│   ├── 01-auth.spec.ts            # Layer 1 tests
│   ├── 02-dashboard/
│   │   ├── 02-user-pages.spec.ts
│   │   └── 02-admin-pages.spec.ts
│   ├── 03-navigation/
│   │   ├── 03-user-nav.spec.ts
│   │   └── 03-admin-nav.spec.ts
│   ├── 04-feature/
│   │   ├── 04-reminders.spec.ts
│   │   ├── 04-agents.spec.ts
│   │   ├── 04-profiles.spec.ts
│   │   ├── 04-settings.spec.ts
│   │   └── 04-admin-features.spec.ts
│   ├── 05-integration.spec.ts     # Layer 5 tests
│   └── 06-error.spec.ts           # Layer 6 tests
└── README.md
```

---

## Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/specs',
  
  // Fail-fast: stop on first failure in critical layer
  fullyParallel: false,
  
  // Global timeout
  timeout: 60000,
  
  // Expect timeout
  expect: { timeout: 10000 },
  
  // Retries in CI only
  retries: process.env.CI ? 2 : 0,
  
  // Workers
  workers: process.env.CI ? 2 : 4,
  
  // Reporter
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'e2e-results.json' }],
    ['list']
  ],
  
  // Global setup/teardown
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
  
  // Projects for ordered execution
  projects: [
    // Layer 0: Critical (serial, stop on failure)
    {
      name: 'critical',
      testMatch: /00-critical\.spec\.ts/,
      fullyParallel: false,
      retries: 0,
      timeout: 30000,
    },
    
    // Layer 1: Auth (depends on critical)
    {
      name: 'auth',
      testMatch: /01-auth\.spec\.ts/,
      dependencies: ['critical'],
      timeout: 60000,
    },
    
    // Layer 2: Dashboard (depends on auth)
    {
      name: 'dashboard',
      testMatch: /02-.*\.spec\.ts/,
      dependencies: ['auth'],
      timeout: 60000,
    },
    
    // Layer 3: Navigation (depends on dashboard)
    {
      name: 'navigation',
      testMatch: /03-.*\.spec\.ts/,
      dependencies: ['dashboard'],
      timeout: 60000,
    },
    
    // Layer 4: Features (depends on navigation)
    {
      name: 'features',
      testMatch: /04-.*\.spec\.ts/,
      dependencies: ['navigation'],
      timeout: 60000,
    },
    
    // Layer 5: Integration (depends on features)
    {
      name: 'integration',
      testMatch: /05-integration\.spec\.ts/,
      dependencies: ['features'],
      fullyParallel: false,
      timeout: 120000,
    },
    
    // Layer 6: Error handling (depends on integration)
    {
      name: 'error',
      testMatch: /06-error\.spec\.ts/,
      dependencies: ['integration'],
      timeout: 60000,
    },
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3800',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

---

## Test Helpers

### loginAsRole()

```typescript
// helpers/login-as-role.ts
import { Page } from '@playwright/test';

export type TestRole = 'user' | 'admin';

const TEST_USERS = {
  user: { email: 'testuser@example.com', password: 'TestUser123!' },
  admin: { email: 'admin@example.com', password: 'AdminPass123!' },
};

export async function loginAsRole(page: Page, role: TestRole): Promise<void> {
  const credentials = TEST_USERS[role];
  
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', credentials.email);
  await page.fill('[data-testid="password-input"]', credentials.password);
  await page.click('[data-testid="login-button"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL(role === 'admin' ? '/admin/dashboard' : '/dashboard');
}
```

### assertOnDashboard()

```typescript
// helpers/assert-on-dashboard.ts
import { Page, expect } from '@playwright/test';

export async function assertOnDashboard(page: Page, role: 'user' | 'admin'): Promise<void> {
  const expectedUrl = role === 'admin' ? '/admin/dashboard' : '/dashboard';
  await expect(page).toHaveURL(new RegExp(expectedUrl));
  
  const sidebar = page.locator('[data-testid="sidebar"]');
  await expect(sidebar).toBeVisible();
  
  const header = page.locator('[data-testid="header"]');
  await expect(header).toBeVisible();
}
```

### assertNoConsoleErrors()

```typescript
// helpers/assert-no-console-errors.ts
import { Page, expect } from '@playwright/test';

export async function assertNoConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Wait for page to settle
  await page.waitForLoadState('networkidle');
  
  // Filter out known acceptable errors
  const criticalErrors = errors.filter(err => 
    !err.includes('favicon') && 
    !err.includes('ResizeObserver')
  );
  
  expect(criticalErrors).toHaveLength(0);
}
```

---

## Test Tags

| Tag | Purpose | Example |
|-----|---------|---------|
| `@critical` | Layer 0 - Must pass first | `test('app loads @critical')` |
| `@auth` | Layer 1 - Authentication | `test('user login @auth')` |
| `@dashboard` | Layer 2 - Page rendering | `test('reminders page @dashboard')` |
| `@navigation` | Layer 3 - Navigation | `test('sidebar links @navigation')` |
| `@feature` | Layer 4 - CRUD operations | `test('create reminder @feature')` |
| `@integration` | Layer 5 - Workflows | `test('full lifecycle @integration')` |
| `@error` | Layer 6 - Error handling | `test('404 page @error')` |
| `@user` | User role tests | `test('user dashboard @user')` |
| `@admin` | Admin role tests | `test('admin users @admin')` |
| `@slow` | Long-running tests | `test('full workflow @slow')` |

---

## Checklist

### Phase 1: Setup (Prerequisites)

- [ ] Install Playwright: `npm install -D @playwright/test`
- [ ] Install Playwright browsers: `npx playwright install`
- [ ] Create `apps/web/e2e/` directory structure
- [ ] Create `playwright.config.ts` with layer dependencies
- [ ] Create `global-setup.ts` for test database seeding
- [ ] Create `global-teardown.ts` for cleanup
- [ ] Add data-testid attributes to all interactive elements
- [ ] Create test user fixtures in database

### Phase 2: Layer 0 - Critical (3 tests)

- [ ] `00-critical.spec.ts` created
- [ ] Test: App loads (home page returns 200)
- [ ] Test: Login page renders (form visible)
- [ ] Test: API health check (`/health` responds)
- [ ] Verify serial execution mode
- [ ] Verify fail-fast behavior (stop on first failure)

### Phase 3: Layer 1 - Auth (8 tests)

- [ ] `01-auth.spec.ts` created
- [ ] Test: User registration
- [ ] Test: User login
- [ ] Test: User logout
- [ ] Test: Admin login
- [ ] Test: Admin logout
- [ ] Test: Invalid login rejected
- [ ] Test: Token refresh works
- [ ] Test: Protected route redirect
- [ ] Verify depends on Layer 0

### Phase 4: Layer 2 - Dashboard (37 tests)

- [ ] `02-user-pages.spec.ts` created
- [ ] `02-admin-pages.spec.ts` created
- [ ] 13 User dashboard page render tests
- [ ] 24 Admin dashboard page render tests
- [ ] Console error assertions on each page
- [ ] Mobile responsive viewport tests
- [ ] Dark mode toggle test
- [ ] Verify depends on Layer 1

### Phase 5: Layer 3 - Navigation (40 tests)

- [ ] `03-user-nav.spec.ts` created
- [ ] `03-admin-nav.spec.ts` created
- [ ] 20 User navigation tests
- [ ] 20 Admin navigation tests
- [ ] Sidebar collapse/expand tests
- [ ] Keyboard navigation tests
- [ ] Breadcrumb tests
- [ ] Verify depends on Layer 2

### Phase 6: Layer 4 - Features (30 tests)

- [ ] `04-reminders.spec.ts` created
- [ ] `04-agents.spec.ts` created
- [ ] `04-profiles.spec.ts` created
- [ ] `04-settings.spec.ts` created
- [ ] `04-admin-features.spec.ts` created
- [ ] 18 User CRUD tests
- [ ] 12 Admin CRUD tests
- [ ] Verify depends on Layer 3

### Phase 7: Layer 5 - Integration (5 tests)

- [ ] `05-integration.spec.ts` created
- [ ] Test: User creates, admin views
- [ ] Test: Admin changes tier, user sees
- [ ] Test: Reminder escalation flow
- [ ] Test: Agent webhook delivery
- [ ] Test: Full reminder lifecycle
- [ ] Verify serial execution mode
- [ ] Verify depends on Layer 4

### Phase 8: Layer 6 - Error Handling (6 tests)

- [ ] `06-error.spec.ts` created
- [ ] Test: 404 page renders
- [ ] Test: API error handling
- [ ] Test: Form validation
- [ ] Test: Network timeout handling
- [ ] Test: Session expiry
- [ ] Test: Rate limit response
- [ ] Verify depends on Layer 5

### Phase 9: CI/CD Integration

- [ ] GitHub Actions workflow for E2E tests
- [ ] Parallel test execution in CI
- [ ] Test artifact upload (screenshots, videos, traces)
- [ ] Slack/Discord notification on failure
- [ ] Test result dashboard integration
- [ ] PR blocking on critical test failures

### Phase 10: Documentation & Maintenance

- [ ] E2E README with run instructions
- [ ] Test naming conventions documented
- [ ] Helper function documentation
- [ ] Page object model documentation
- [ ] Flaky test identification process
- [ ] Test coverage tracking

---

## Running Tests

```bash
# Run all tests (respects layer dependencies)
npx playwright test

# Run specific layer
npx playwright test --project=critical
npx playwright test --project=auth
npx playwright test --project=dashboard

# Run with UI mode
npx playwright test --ui

# Run in headed mode (debugging)
npx playwright test --headed

# Generate test report
npx playwright show-report

# Run only tagged tests
npx playwright test --grep @critical
npx playwright test --grep @user
npx playwright test --grep @admin
```

---

## npm Scripts

```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:critical": "playwright test --project=critical",
    "e2e:auth": "playwright test --project=auth",
    "e2e:dashboard": "playwright test --project=dashboard",
    "e2e:navigation": "playwright test --project=navigation",
    "e2e:features": "playwright test --project=features",
    "e2e:integration": "playwright test --project=integration",
    "e2e:error": "playwright test --project=error",
    "e2e:ui": "playwright test --ui",
    "e2e:headed": "playwright test --headed",
    "e2e:report": "playwright show-report",
    "e2e:codegen": "playwright codegen http://localhost:3800"
  }
}
```

---

## Fail-Fast Summary

| Layer | Tests | Execution | On Failure |
|-------|-------|-----------|------------|
| 0 @critical | 3 | Serial | **STOP ALL** |
| 1 @auth | 8 | Parallel | Skip Layer 2+ |
| 2 @dashboard | 37 | Parallel | Skip Layer 3+ |
| 3 @navigation | 40 | Parallel | Skip Layer 4+ |
| 4 @feature | 30 | Parallel | Skip Layer 5+ |
| 5 @integration | 5 | Serial | Skip Layer 6 |
| 6 @error | 6 | Parallel | Report failures |

**Total Tests**: ~129 tests

---

## Success Criteria

- [ ] All 129 tests pass
- [ ] Critical tests complete in < 30 seconds
- [ ] Full suite completes in < 10 minutes
- [ ] Zero flaky tests (no random failures)
- [ ] 100% coverage of user-facing pages
- [ ] All CRUD operations covered
- [ ] Both User and Admin roles tested
- [ ] Error scenarios handled gracefully

---

*This document serves as the master plan for E2E testing. Update as features are added.*

