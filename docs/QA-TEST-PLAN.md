# QA Test Plan - Seeding Endpoint & E2E Tests

> **QA Engineer**: Testing Seeding Module and E2E Test Suite  
> **Date**: December 2024  
> **Status**: Ready for Testing

---

## Test Objectives

1. ✅ Verify seeding endpoint creates test data correctly
2. ✅ Verify seeding endpoint security (dev/test only)
3. ✅ Verify E2E tests can run with seeded data
4. ✅ Verify data cleanup works correctly
5. ✅ Verify idempotency (can run multiple times)

---

## Test Environment Setup

### Prerequisites
- [ ] API server running on port 3801
- [ ] Web app running on port 3800
- [ ] Database accessible
- [ ] `NODE_ENV=development` or `NODE_ENV=test`

### Pre-Test Checklist
- [ ] Database is accessible
- [ ] API is running: `curl http://localhost:3801/v1/seeding/seed`
- [ ] Web app is accessible: `curl http://localhost:3800`
- [ ] No existing test users in database (or clear first)

---

## Test Cases

### TC-1: Seeding Endpoint - Success Case

**Objective**: Verify seeding endpoint creates all test data

**Steps**:
1. Clear any existing test data: `DELETE /v1/seeding/clear`
2. Call seeding endpoint: `POST /v1/seeding/seed`
3. Verify response status: 200
4. Verify response structure:
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
5. Verify database contains:
   - User: `testuser@example.com`
   - Admin: `admin@example.com`
   - At least 3 reminders
   - At least 2 escalation profiles
   - At least 2 agent subscriptions

**Expected Result**: ✅ All data created successfully

**Status**: ⬜ Not Tested

---

### TC-2: Seeding Endpoint - Idempotency

**Objective**: Verify seeding can be called multiple times safely

**Steps**:
1. Call `POST /v1/seeding/seed` (first time)
2. Verify data created
3. Call `POST /v1/seeding/seed` again (second time)
4. Verify no errors
5. Verify data still exists (not duplicated)

**Expected Result**: ✅ No errors, no duplicate data

**Status**: ⬜ Not Tested

---

### TC-3: Seeding Endpoint - Security (Production Block)

**Objective**: Verify seeding is blocked in production

**Steps**:
1. Set `NODE_ENV=production`
2. Call `POST /v1/seeding/seed`
3. Verify response status: 200 (but with error in body)
4. Verify response:
   ```json
   {
     "success": false,
     "error": {
       "code": "SEEDING_DISABLED",
       "message": "Seeding is only available in development/test environments"
     }
   }
   ```
5. Reset `NODE_ENV=development`

**Expected Result**: ✅ Seeding blocked in production

**Status**: ⬜ Not Tested

---

### TC-4: Clear Endpoint - Success Case

**Objective**: Verify clear endpoint removes all test data

**Steps**:
1. Seed data: `POST /v1/seeding/seed`
2. Verify data exists in database
3. Call clear: `DELETE /v1/seeding/clear`
4. Verify response status: 200
5. Verify response:
   ```json
   {
     "success": true,
     "message": "Test data cleared successfully"
   }
   ```
6. Verify database:
   - No user with email `testuser@example.com`
   - No user with email `admin@example.com`
   - No reminders for test users
   - No escalation profiles for test users
   - No agent subscriptions for test users

**Expected Result**: ✅ All test data removed

**Status**: ⬜ Not Tested

---

### TC-5: Clear Endpoint - Empty Database

**Objective**: Verify clear handles empty database gracefully

**Steps**:
1. Ensure no test data exists (call clear first)
2. Call `DELETE /v1/seeding/clear` again
3. Verify response status: 200
4. Verify no errors

**Expected Result**: ✅ No errors, graceful handling

**Status**: ⬜ Not Tested

---

### TC-6: Test User Authentication

**Objective**: Verify test users can authenticate

**Steps**:
1. Seed data: `POST /v1/seeding/seed`
2. Login as user:
   ```bash
   POST /v1/auth/login
   {
     "email": "testuser@example.com",
     "password": "TestUser123!"
   }
   ```
3. Verify response: 200 with tokens
4. Login as admin:
   ```bash
   POST /v1/auth/login
   {
     "email": "admin@example.com",
     "password": "AdminPass123!"
   }
   ```
5. Verify response: 200 with tokens

**Expected Result**: ✅ Both users can authenticate

**Status**: ⬜ Not Tested

---

### TC-7: E2E Test - Layer 0 Critical

**Objective**: Verify critical E2E tests pass

**Steps**:
1. Ensure API and web app are running
2. Seed data: `POST /v1/seeding/seed`
3. Run Layer 0 tests: `npm run e2e:critical`
4. Verify all 3 tests pass:
   - App loads
   - Login page renders
   - API health check

**Expected Result**: ✅ All critical tests pass

**Status**: ⬜ Not Tested

---

### TC-8: E2E Test - Layer 1 Auth

**Objective**: Verify authentication E2E tests pass

**Steps**:
1. Ensure Layer 0 passed
2. Run Layer 1 tests: `npm run e2e:auth`
3. Verify all 8 tests pass:
   - User registration
   - User login
   - User logout
   - Admin login
   - Admin logout
   - Invalid login rejected
   - Token refresh
   - Protected route redirect

**Expected Result**: ✅ All auth tests pass

**Status**: ⬜ Not Tested

---

### TC-9: E2E Test - Full Suite

**Objective**: Verify all E2E tests can run

**Steps**:
1. Ensure API and web app are running
2. Seed data: `POST /v1/seeding/seed`
3. Run full E2E suite: `npm run e2e`
4. Verify tests execute in correct order (Layer 0 → 1 → 2 → ...)
5. Verify fail-fast behavior (if Layer 0 fails, others skip)

**Expected Result**: ✅ Tests run in correct order with dependencies

**Status**: ⬜ Not Tested

---

### TC-10: Data Integrity

**Objective**: Verify seeded data relationships are correct

**Steps**:
1. Seed data: `POST /v1/seeding/seed`
2. Query database:
   - Verify reminders have correct userId
   - Verify reminders have escalationProfileId (if set)
   - Verify escalation profiles have correct userId
   - Verify agent subscriptions have correct userId and agentDefinitionId
   - Verify admin user has AdminUser record
3. Verify foreign key constraints are satisfied

**Expected Result**: ✅ All relationships valid

**Status**: ⬜ Not Tested

---

## Manual Test Commands

### Test Seeding Endpoint
```bash
# Seed test data
curl -X POST http://localhost:3801/v1/seeding/seed | jq

# Clear test data
curl -X DELETE http://localhost:3801/v1/seeding/clear | jq

# Verify users exist (after seeding)
curl http://localhost:3801/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"TestUser123!"}' | jq
```

### Test E2E Tests
```bash
cd apps/web

# Run critical tests
npm run e2e:critical

# Run auth tests
npm run e2e:auth

# Run all tests
npm run e2e

# Run with UI
npm run e2e:ui
```

---

## Issues Found

### Issue #1: clearTestData nested where clause
**Status**: ✅ FIXED  
**Description**: Prisma deleteMany doesn't support nested where clauses directly. Fixed by finding user IDs first, then deleting by userId.

### Issue #2: [Add issues as found]

---

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-1: Seeding Success | ⬜ | |
| TC-2: Idempotency | ⬜ | |
| TC-3: Security | ⬜ | |
| TC-4: Clear Success | ⬜ | |
| TC-5: Clear Empty | ⬜ | |
| TC-6: Authentication | ⬜ | |
| TC-7: E2E Layer 0 | ⬜ | |
| TC-8: E2E Layer 1 | ⬜ | |
| TC-9: E2E Full Suite | ⬜ | |
| TC-10: Data Integrity | ⬜ | |

**Total Tests**: 10  
**Passed**: 0  
**Failed**: 0  
**Not Tested**: 10

---

## Next Steps

1. ✅ Fix clearTestData nested where clause issue
2. ⬜ Run manual tests using commands above
3. ⬜ Document any issues found
4. ⬜ Verify E2E tests can run end-to-end
5. ⬜ Create automated test suite for seeding endpoint

---

*This test plan will be updated as testing progresses.*
