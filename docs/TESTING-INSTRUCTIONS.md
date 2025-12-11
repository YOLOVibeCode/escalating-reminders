# Testing Instructions - Manual Execution

> **Status**: Services need to be started manually  
> **Date**: December 2024

---

## ⚠️ Current Situation

The automated test execution requires services to be running. Due to dependency installation issues in the monorepo, please follow these manual steps:

---

## Step-by-Step Execution

### 1. Install Dependencies (If Not Already Done)

```bash
cd /Users/admin/Dev/YOLOProjects/escalating-reminders

# Try standard install
npm install

# If workspace protocol errors, try:
npm install --legacy-peer-deps

# Or install in each workspace:
cd apps/api && npm install
cd ../web && npm install
```

### 2. Install Playwright

```bash
cd apps/web
npx playwright install chromium
```

### 3. Start API Server

**Terminal 1:**
```bash
cd apps/api
npm run dev
# Should see: "🚀 API server running on http://localhost:3801"
```

**Wait for API to be ready** - Check with:
```bash
curl http://localhost:3801/v1/seeding/seed
```

### 4. Start Web App

**Terminal 2:**
```bash
cd apps/web
npm run dev
# Should see: "Ready on http://localhost:3800"
```

**Wait for Web app to be ready** - Check with:
```bash
curl http://localhost:3800
```

### 5. Test Seeding Endpoint

**Terminal 3:**
```bash
cd apps/web

# Run seeding test script
./e2e/test-seeding.sh

# Or manually:
curl -X POST http://localhost:3801/v1/seeding/seed | jq
```

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "users": { "user": {...}, "admin": {...} },
    "reminders": [...],
    "escalationProfiles": [...],
    "agentSubscriptions": [...]
  },
  "message": "Test data seeded successfully"
}
```

### 6. Run E2E Tests - Fail-Fast Pyramid

**Terminal 3:**

```bash
cd apps/web

# Option 1: Use test execution script
./e2e/test-execution.sh

# Option 2: Run layer by layer manually
npm run e2e:critical    # Layer 0 - MUST PASS FIRST
npm run e2e:auth        # Layer 1 - Only if Layer 0 passes
npm run e2e:dashboard   # Layer 2 - Only if Layer 1 passes
npm run e2e:navigation  # Layer 3 - Only if Layer 2 passes
npm run e2e:features    # Layer 4 - Only if Layer 3 passes
npm run e2e:integration # Layer 5 - Only if Layer 4 passes
npm run e2e:error       # Layer 6 - Only if Layer 5 passes

# Option 3: Run all (respects dependencies)
npm run e2e
```

---

## Fail-Fast Behavior

The tests are designed to **stop immediately** if any layer fails:

- ✅ **Layer 0 passes** → Continue to Layer 1
- ❌ **Layer 0 fails** → **STOP ALL TESTS**

This ensures you fix critical issues first before wasting time on dependent tests.

---

## Troubleshooting

### "next: command not found"
```bash
cd apps/web
npm install
```

### "playwright: command not found"
```bash
cd apps/web
npx playwright install
```

### "API not accessible"
- Check API is running: `ps aux | grep "nest start"`
- Check port 3801: `lsof -i :3801`
- Check API logs for errors

### "Web app not accessible"
- Check Web is running: `ps aux | grep "next dev"`
- Check port 3800: `lsof -i :3800`
- Check Web logs for errors

### Tests fail with "Element not found"
- Run in headed mode to see what's happening:
  ```bash
  npm run e2e:headed
  ```
- Check if `data-testid` attributes exist in components
- Verify selectors match actual DOM structure

---

## Expected Test Results

### Successful Run:
```
🧪 E2E Test Execution - Fail-Fast Pyramid
✅ API is running
✅ Web app is running
🌱 Seeding test data...
✅ Test data seeded successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 Layer 0: @critical
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Layer 0 (@critical) PASSED

... (continues through all layers)

🎉 ALL TESTS PASSED!
```

### Fail-Fast Example:
```
❌ Layer 0 (@critical) FAILED
🛑 STOPPING - Fail-fast enabled

═══════════════════════════════════════════════
  TEST EXECUTION STOPPED - Layer 0 Failed
═══════════════════════════════════════════════
```

---

## View Test Results

After tests complete:

```bash
# View HTML report
npm run e2e:report

# Or open directly
open e2e-results/html/index.html
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run e2e:critical` | Run Layer 0 (3 tests) |
| `npm run e2e:auth` | Run Layer 1 (8 tests) |
| `npm run e2e:dashboard` | Run Layer 2 (37 tests) |
| `npm run e2e:navigation` | Run Layer 3 (40 tests) |
| `npm run e2e:features` | Run Layer 4 (30 tests) |
| `npm run e2e:integration` | Run Layer 5 (5 tests) |
| `npm run e2e:error` | Run Layer 6 (6 tests) |
| `npm run e2e` | Run all (129 tests) |
| `npm run e2e:ui` | Interactive UI mode |
| `npm run e2e:headed` | See browser |

---

*Follow these instructions to execute tests manually. The fail-fast pyramid will ensure you fix critical issues first.*
