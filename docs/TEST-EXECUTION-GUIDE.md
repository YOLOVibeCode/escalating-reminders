# Test Execution Guide - Fail-Fast Pyramid

> **Engineer**: Software Engineer  
> **Date**: December 2024  
> **Methodology**: Fail-Fast Pyramid Testing

---

## Quick Start

### 1. Prerequisites

```bash
# Install Playwright (if not already installed)
cd apps/web
npm install

# Install Playwright browsers
npx playwright install
```

### 2. Start Services

**Terminal 1 - API Server:**
```bash
cd apps/api
npm run dev
# Should start on http://localhost:3801
```

**Terminal 2 - Web App:**
```bash
cd apps/web
npm run dev
# Should start on http://localhost:3800
```

### 3. Test Seeding Endpoint First

**Terminal 3 - Test Seeding:**
```bash
cd apps/web
./e2e/test-seeding.sh
```

This will:
- ✅ Clear existing test data
- ✅ Seed new test data
- ✅ Test idempotency
- ✅ Verify user authentication

### 4. Run E2E Tests (Fail-Fast Pyramid)

**Terminal 3 - Run Tests:**
```bash
cd apps/web
./e2e/test-execution.sh
```

Or run manually layer by layer:

```bash
# Layer 0: Critical (MUST pass first)
npm run e2e:critical

# If Layer 0 passes, continue to Layer 1
npm run e2e:auth

# If Layer 1 passes, continue to Layer 2
npm run e2e:dashboard

# Continue up the pyramid...
npm run e2e:navigation
npm run e2e:features
npm run e2e:integration
npm run e2e:error

# Or run all at once (respects dependencies)
npm run e2e
```

---

## Fail-Fast Behavior

The test pyramid is designed to **stop immediately** if any layer fails:

```
Layer 0 (@critical) fails → STOP ALL TESTS
Layer 1 (@auth) fails → Skip Layers 2-6
Layer 2 (@dashboard) fails → Skip Layers 3-6
... and so on
```

This ensures:
- ⚡ **Fast feedback** - Know immediately if critical paths are broken
- 💰 **Cost savings** - Don't waste time on tests that depend on broken functionality
- 🎯 **Clear priorities** - Fix critical issues first

---

## Manual Test Execution

### Test Seeding Endpoint

```bash
# 1. Clear test data
curl -X DELETE http://localhost:3801/v1/seeding/clear | jq

# 2. Seed test data
curl -X POST http://localhost:3801/v1/seeding/seed | jq

# 3. Verify user can login
curl -X POST http://localhost:3801/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"TestUser123!"}' | jq

# 4. Verify admin can login
curl -X POST http://localhost:3801/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPass123!"}' | jq
```

### Test Individual Layers

```bash
# Test Layer 0 only
npx playwright test --config=e2e/playwright.config.ts --project=critical

# Test Layer 1 only
npx playwright test --config=e2e/playwright.config.ts --project=auth

# Test specific test file
npx playwright test e2e/specs/00-critical.spec.ts

# Run with UI (interactive)
npx playwright test --config=e2e/playwright.config.ts --ui

# Run in headed mode (see browser)
npx playwright test --config=e2e/playwright.config.ts --headed
```

---

## Expected Test Flow

### ✅ Successful Execution

```
🧪 E2E Test Execution - Fail-Fast Pyramid
==========================================
✅ API is running
✅ Web app is running
🌱 Seeding test data...
✅ Test data seeded successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 Layer 0: @critical
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Layer 0 (@critical) PASSED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 Layer 1: @auth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Layer 1 (@auth) PASSED

... (continues through all layers)

🎉 ALL TESTS PASSED!
```

### ❌ Fail-Fast Example

```
🧪 E2E Test Execution - Fail-Fast Pyramid
==========================================
✅ API is running
✅ Web app is running
🌱 Seeding test data...
✅ Test data seeded successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 Layer 0: @critical
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Layer 0 (@critical) FAILED
🛑 STOPPING - Fail-fast enabled

═══════════════════════════════════════════════
  TEST EXECUTION STOPPED - Layer 0 Failed
═══════════════════════════════════════════════
```

---

## Troubleshooting

### API Not Running
```bash
# Check if API is running
curl http://localhost:3801/v1/seeding/seed

# Start API
cd apps/api
npm run dev
```

### Web App Not Running
```bash
# Check if web app is running
curl http://localhost:3800

# Start web app
cd apps/web
npm run dev
```

### Playwright Not Installed
```bash
cd apps/web
npm install
npx playwright install
```

### Tests Fail with "Element not found"
- Check if `data-testid` attributes exist in components
- Verify selectors in test files match actual DOM
- Run in headed mode to see what's happening: `npm run e2e:headed`

### Seeding Fails
- Check `NODE_ENV` is set to `development` or `test`
- Verify database is accessible
- Check API logs for errors

---

## Test Results

Results are saved in:
- **HTML Report**: `e2e-results/html/index.html`
- **JSON Results**: `e2e-results/results.json`
- **Screenshots**: `e2e-results/` (on failure)
- **Videos**: `e2e-results/` (on failure)

View report:
```bash
npm run e2e:report
```

---

## Next Steps After Testing

1. ✅ Document test results in `docs/TEST-EXECUTION-RESULTS.md`
2. ✅ Fix any failing tests
3. ✅ Update test selectors if UI changed
4. ✅ Add `data-testid` attributes to new components
5. ✅ Re-run tests to verify fixes

---

*Follow this guide to execute tests systematically using the fail-fast pyramid methodology.*
