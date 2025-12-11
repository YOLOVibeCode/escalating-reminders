# E2E Test Suite

End-to-end tests for Escalating Reminders web application using Playwright.

## Test Pyramid Architecture

Tests are organized in 7 layers with fail-fast dependencies:

- **Layer 0** (`@critical`) - 3 tests - App loads, login page works
- **Layer 1** (`@auth`) - 8 tests - Authentication flows
- **Layer 2** (`@dashboard`) - 37 tests - Page rendering
- **Layer 3** (`@navigation`) - 40 tests - Navigation links
- **Layer 4** (`@feature`) - 30 tests - CRUD operations
- **Layer 5** (`@integration`) - 5 tests - Cross-role workflows
- **Layer 6** (`@error`) - 6 tests - Error handling

**Total: 129 tests**

## Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Ensure the web app is running:
   ```bash
   npm run dev
   ```

4. Ensure the API is running (default: http://localhost:3801)

5. Seed test data (automatically done in global-setup, or manually):
   ```bash
   # Via API endpoint (development/test only)
   curl -X POST http://localhost:3801/v1/seeding/seed
   ```

## Running Tests

### Run All Tests
```bash
npm run e2e
```

### Run by Layer
```bash
npm run e2e:critical      # Layer 0
npm run e2e:auth          # Layer 1
npm run e2e:dashboard     # Layer 2
npm run e2e:navigation    # Layer 3
npm run e2e:features      # Layer 4
npm run e2e:integration   # Layer 5
npm run e2e:error         # Layer 6
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

## Test Structure

```
e2e/
├── playwright.config.ts      # Playwright configuration
├── global-setup.ts            # Pre-test setup
├── global-teardown.ts         # Post-test cleanup
├── helpers/                   # Test helper functions
│   ├── login-as-role.ts
│   ├── assert-on-dashboard.ts
│   ├── assert-no-console-errors.ts
│   └── wait-for-api.ts
├── page-objects/             # Page object models
│   ├── login.page.ts
│   └── dashboard.page.ts
└── specs/                     # Test files
    ├── 00-critical.spec.ts
    ├── 01-auth.spec.ts
    ├── 02-dashboard/
    ├── 03-navigation/
    ├── 04-feature/
    ├── 05-integration.spec.ts
    └── 06-error.spec.ts
```

## Test Data

Tests use seeded test data created via the seeding endpoint (`/v1/seeding/seed`):

### Test Users
- **User**: `testuser@example.com` / `TestUser123!`
- **Admin**: `admin@example.com` / `AdminPass123!`

### Seeded Data
- Test users (user + admin)
- Escalation profiles (Gentle, Critical)
- Test reminders (Daily Standup, Soberlink Check, Weekly Review)
- Agent subscriptions (Email, Webhook)

The seeding endpoint automatically runs in `global-setup.ts` before tests. To seed manually:

```bash
# Seed test data
curl -X POST http://localhost:3801/v1/seeding/seed

# Clear test data (optional)
curl -X DELETE http://localhost:3801/v1/seeding/clear
```

**Note**: Seeding is only available when `NODE_ENV=development` or `NODE_ENV=test`.

## Environment Variables

- `BASE_URL` - Web app URL (default: http://localhost:3800)
- `API_BASE_URL` - API URL (default: http://localhost:3801)
- `CI` - Set to `true` in CI environments

## Fail-Fast Behavior

- Layer 0 runs first in serial mode
- If Layer 0 fails, all other layers are skipped
- Each layer depends on previous layers passing
- Tests within a layer run in parallel (except Layer 0 and Layer 5)

## Writing New Tests

1. Use appropriate test tags (`@critical`, `@auth`, etc.)
2. Place tests in the correct layer file
3. Use helper functions from `helpers/`
4. Use page objects from `page-objects/`
5. Follow naming convention: `XX-YY: Test description @tag`

## Debugging

1. Run tests in headed mode: `npm run e2e:headed`
2. Use Playwright Inspector: `PWDEBUG=1 npm run e2e`
3. Check screenshots/videos in `e2e-results/`
4. View traces in Playwright UI: `npm run e2e:ui`

## CI/CD Integration

Tests are configured to run in CI with:
- Retries: 2
- Workers: 2
- Artifact uploads (screenshots, videos, traces)

## Troubleshooting

**Tests fail with "timeout"**
- Ensure web app is running on port 3800
- Ensure API is running on port 3801
- Check network connectivity

**Tests fail with "element not found"**
- Verify `data-testid` attributes exist on elements
- Check if selectors need updating
- Run in headed mode to see what's happening

**Tests are flaky**
- Increase timeouts if needed
- Add explicit waits for dynamic content
- Check for race conditions

## More Information

See [E2E Test Pyramid Plan](../../docs/E2E-TEST-PYRAMID-PLAN.md) for detailed test specifications.
