# E2E Test Suite

End-to-end tests for Escalating Reminders web application using Playwright.

> ⚠️ **Port Assignments**: All services use ports in the **38XX** range. These are FINAL and STABLE.
> - Web App: `http://localhost:3800`
> - API: `http://localhost:3801`

---

## Test Pyramid Architecture

Tests are organized in 7 layers with fail-fast dependencies:

| Layer | Tag | Tests | Purpose |
|-------|-----|-------|---------|
| 0 | `@critical` | 3 | App loads, login page works |
| 1 | `@auth` | 8 | Authentication flows |
| 2 | `@dashboard` | 37 | Page rendering |
| 3 | `@navigation` | 40 | Navigation links |
| 4 | `@feature` | 30 | CRUD operations |
| 5 | `@integration` | 5 | Cross-role workflows |
| 6 | `@error` | 6 | Error handling |

**Total: 129 tests**

---

## Multi-Environment Support

Tests can be run against **local**, **staging**, or **production** environments.

### Environment URLs

| Environment | Web URL | API URL |
|-------------|---------|---------|
| **Local** | `http://localhost:3800` | `http://localhost:3801` |
| **Staging** | `https://staging.escalating-reminders.com` | `https://api.staging.escalating-reminders.com` |
| **Production** | `https://escalating-reminders.com` | `https://api.escalating-reminders.com` |

### Running Against Different Environments

```bash
# Local development (default)
npm run e2e

# Or explicitly
npm run e2e:local

# Staging environment
BASE_URL=https://staging.escalating-reminders.com \
API_BASE_URL=https://api.staging.escalating-reminders.com \
npm run e2e:staging

# Production environment (smoke tests only)
BASE_URL=https://escalating-reminders.com \
API_BASE_URL=https://api.escalating-reminders.com \
npm run e2e:production

# Quick smoke tests (critical + auth only)
npm run e2e:smoke                   # Production
npm run e2e:smoke:staging           # Staging
```

### Production Safety

When running against production:

- ✅ **Database seeding is disabled** - Uses existing production data
- ✅ **Destructive tests are skipped** - No create/update/delete operations
- ✅ **Read-only smoke tests only** - Validates pages load and auth works
- ⚠️ **Test users must exist** - Pre-create dedicated test accounts in production

To enable destructive tests in production (NOT RECOMMENDED):
```bash
ALLOW_DESTRUCTIVE_TESTS=true npm run e2e:production
```

---

## Prerequisites

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

### 3. Start Services (Local Development)
```bash
# Terminal 1: Start infrastructure
cd infrastructure && make up

# Terminal 2: Start API
cd apps/api && npm run dev

# Terminal 3: Start Web App
cd apps/web && npm run dev
```

### 4. Seed Test Data (Local/Staging Only)
```bash
# Automatically done in global-setup, or manually:
curl -X POST http://localhost:3801/v1/seeding/seed
```

---

## Running Tests

### Run All Tests
```bash
npm run e2e
```

### Run by Layer
```bash
npm run e2e:critical      # Layer 0 - Critical
npm run e2e:auth          # Layer 1 - Authentication
npm run e2e:dashboard     # Layer 2 - Dashboard pages
npm run e2e:navigation    # Layer 3 - Navigation
npm run e2e:features      # Layer 4 - CRUD features
npm run e2e:integration   # Layer 5 - Integration
npm run e2e:error         # Layer 6 - Error handling
```

### Run by Environment
```bash
npm run e2e:local         # Local development
npm run e2e:staging       # Staging environment
npm run e2e:production    # Production (smoke tests)
npm run e2e:smoke         # Quick smoke tests (critical + auth)
npm run e2e:smoke:staging # Staging smoke tests
```

### Interactive Mode
```bash
npm run e2e:ui            # Playwright UI mode
npm run e2e:headed        # Run in headed browser
```

### View Reports
```bash
npm run e2e:report        # Open HTML report
```

### Generate Test Code
```bash
npm run e2e:codegen       # Record new tests
```

---

## Test Structure

```
e2e/
├── playwright.config.ts       # Playwright configuration
├── global-setup.ts            # Pre-test setup (env detection, seeding)
├── global-teardown.ts         # Post-test cleanup
├── helpers/                   # Test helper functions
│   ├── login-as-role.ts       # loginAsRole() helper
│   ├── assert-on-dashboard.ts # assertOnDashboard() helper
│   ├── assert-no-console-errors.ts
│   ├── seed-test-data.ts      # Seeding API calls
│   └── wait-for-api.ts
├── page-objects/              # Page object models
│   ├── login.page.ts
│   └── dashboard.page.ts
└── specs/                     # Test files (by layer)
    ├── 00-critical.spec.ts
    ├── 01-auth.spec.ts
    ├── 02-dashboard/
    │   ├── 02-user-pages.spec.ts
    │   └── 02-admin-pages.spec.ts
    ├── 03-navigation/
    │   ├── 03-user-nav.spec.ts
    │   └── 03-admin-nav.spec.ts
    ├── 04-feature/
    │   ├── 04-reminders.spec.ts
    │   ├── 04-agents.spec.ts
    │   ├── 04-profiles.spec.ts
    │   ├── 04-settings.spec.ts
    │   └── 04-admin-features.spec.ts
    ├── 05-integration.spec.ts
    └── 06-error.spec.ts
```

---

## Specification Coverage

These E2E tests cover the core user stories from `SPECIFICATION.md`:

### ✅ Registration & Onboarding
- User registration with email/password (`01-auth.spec.ts`)
- Login/logout flows (`01-auth.spec.ts`)
- Protected route redirection (`01-auth.spec.ts`)

### ✅ Reminder Management
- Create reminders with scheduling (`04-reminders.spec.ts`)
- Edit and update reminders (`04-reminders.spec.ts`)
- Delete reminders (`04-reminders.spec.ts`)
- Snooze reminders (`04-reminders.spec.ts`)
- Complete reminders (`04-reminders.spec.ts`)
- Filter and sort reminders (`04-reminders.spec.ts`)

### ✅ Escalation Profiles
- Create custom profiles (`04-profiles.spec.ts`)
- Edit escalation profiles (`04-profiles.spec.ts`)
- Delete profiles (`04-profiles.spec.ts`)

### ✅ Notification Agents
- Subscribe to agents (`04-agents.spec.ts`)
- Configure agent credentials (`04-agents.spec.ts`)
- Test agent delivery (`04-agents.spec.ts`)
- Unsubscribe from agents (`04-agents.spec.ts`)

### ✅ Admin Dashboard
- View all users (`04-admin-features.spec.ts`)
- View user details (`04-admin-features.spec.ts`)
- Change user subscription tier (`04-admin-features.spec.ts`)
- View all reminders (`04-admin-features.spec.ts`)
- View audit logs (`04-admin-features.spec.ts`)
- View billing stats (`04-admin-features.spec.ts`)
- System health monitoring (`04-admin-features.spec.ts`)

### ✅ Cross-Role Workflows
- User creates, admin views (`05-integration.spec.ts`)
- Admin changes tier, user sees (`05-integration.spec.ts`)
- Reminder escalation flow (`05-integration.spec.ts`)
- Full reminder lifecycle (`05-integration.spec.ts`)

### ✅ Error Handling
- 404 page rendering (`06-error.spec.ts`)
- API error display (`06-error.spec.ts`)
- Form validation (`06-error.spec.ts`)
- Network timeout handling (`06-error.spec.ts`)
- Session expiry (`06-error.spec.ts`)

---

## Test Users

### Local Development (Seeded)
| Role | Email | Password |
|------|-------|----------|
| **User** | `testuser@example.com` | `TestUser123!` |
| **Admin** | `admin@example.com` | `AdminPass123!` |

### Production (Pre-created)
Create dedicated test accounts in production with predictable credentials:
| Role | Email | Password |
|------|-------|----------|
| **User** | `e2e-test@yourdomain.com` | (secure password) |
| **Admin** | `e2e-admin@yourdomain.com` | (secure password) |

Set these via environment variables for production tests:
```bash
TEST_USER_EMAIL=e2e-test@yourdomain.com
TEST_USER_PASSWORD=SecurePassword123!
TEST_ADMIN_EMAIL=e2e-admin@yourdomain.com
TEST_ADMIN_PASSWORD=SecureAdminPassword123!
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:3800` | Web app URL |
| `API_BASE_URL` | `http://localhost:3801` | API URL |
| `E2E_ENV` | `local` | Environment name (local, staging, production) |
| `CI` | `false` | CI mode (enables retries, changes parallelism) |
| `SKIP_SEEDING` | `false` | Skip database seeding |
| `ALLOW_DESTRUCTIVE_TESTS` | `false` | Allow destructive tests in production |
| `DEBUG` | `false` | Enable debug screenshots and logs |
| `TEST_USER_EMAIL` | - | Override test user email |
| `TEST_USER_PASSWORD` | - | Override test user password |
| `TEST_ADMIN_EMAIL` | - | Override admin email |
| `TEST_ADMIN_PASSWORD` | - | Override admin password |

---

## Fail-Fast Behavior

```
Layer 0 fails → ALL TESTS STOP
Layer 1 fails → Skip Layer 2-6
Layer 2 fails → Skip Layer 3-6
Layer 3 fails → Skip Layer 4-6
Layer 4 fails → Skip Layer 5-6
Layer 5 fails → Skip Layer 6
Layer 6 fails → Report failures
```

- Layer 0 runs first in **serial mode** (stop on first failure)
- Each layer depends on previous layers passing
- Tests within a layer run in **parallel** (except Layer 0 and Layer 5)

---

## CI/CD Integration

Tests are configured for CI with:
- **Retries**: 2
- **Workers**: 2
- **Artifacts**: Screenshots, videos, traces uploaded on failure

### GitHub Actions Example

```yaml
- name: Run E2E Tests
  run: npm run e2e
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
    API_BASE_URL: ${{ secrets.STAGING_API_URL }}
    E2E_ENV: staging
    CI: true
```

---

## Debugging

1. **Headed Mode**: `npm run e2e:headed`
2. **Playwright Inspector**: `PWDEBUG=1 npm run e2e`
3. **UI Mode**: `npm run e2e:ui`
4. **Check Artifacts**: `e2e-results/` (screenshots, videos, traces)
5. **Debug Logging**: `DEBUG=true npm run e2e`

---

## Troubleshooting

### Tests timeout
- Ensure web app is running on port 3800
- Ensure API is running on port 3801
- Check network connectivity to staging/production

### Element not found
- Verify `data-testid` attributes exist
- Run in headed mode to observe behavior
- Check for dynamic content loading

### Flaky tests
- Increase timeouts
- Add explicit waits for dynamic content
- Check for race conditions

### Production tests fail
- Verify test users exist in production database
- Check `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are set
- Ensure production endpoints are accessible

---

## More Information

- [E2E Test Pyramid Plan](../../../docs/E2E-TEST-PYRAMID-PLAN.md) - Detailed test specifications
- [Specification](../../../SPECIFICATION.md) - Master specification document
- [Port Assignments](../../../docs/PORT-ASSIGNMENTS.md) - All port configurations

---

*Last Updated: December 2024*
