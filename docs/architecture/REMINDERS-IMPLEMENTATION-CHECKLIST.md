# Reminders Domain Implementation Checklist

> **Version**: 1.0.0  
> **Last Updated**: December 2024  
> **Role**: Software Architect - Implementation Plan

---

## Overview

This document provides the **complete implementation checklist** for the Reminders domain module. The engineer MUST follow this checklist in order, using **TDD (Test-Driven Development)** and **ISP (Interface Segregation Principle)**.

---

## Implementation Order (CRITICAL - Follow Sequentially)

### Phase 1: Repository Layer (Data Access)

#### ✅ Step 1.1: Create ReminderRepository Tests
**File**: `apps/api/src/domains/reminders/__tests__/reminder.repository.spec.ts`

**Test Cases Required**:
1. `create()` - Creates a reminder successfully
2. `create()` - Handles database errors
3. `findById()` - Returns reminder when exists
4. `findById()` - Returns null when not found
5. `findByUserId()` - Returns paginated reminders for user
6. `findByUserId()` - Filters by status
7. `findByUserId()` - Filters by importance
8. `findByUserId()` - Sorts by nextTriggerAt
9. `findByUserId()` - Handles pagination (page, limit)
10. `update()` - Updates reminder successfully
11. `update()` - Handles partial updates
12. `update()` - Returns null when reminder not found
13. `delete()` - Deletes reminder successfully
14. `delete()` - Handles non-existent reminder
15. `countByUser()` - Returns correct count
16. `findDueForTrigger()` - Returns reminders due for triggering
17. `findDueForTrigger()` - Respects limit parameter
18. `findDueForTrigger()` - Only returns ACTIVE reminders

**Test Pattern**: Follow `auth.repository.spec.ts` as reference.

---

#### ✅ Step 1.2: Implement ReminderRepository
**File**: `apps/api/src/domains/reminders/reminder.repository.ts`

**Requirements**:
- Implements `IReminderRepository` interface (from `@er/interfaces`)
- Uses `PrismaService` for database access
- Handles all Prisma operations
- Maps Prisma types to domain types
- **NO business logic** - only data access

**Methods to Implement**:
```typescript
- create(data: ReminderCreateData): Promise<Reminder>
- findById(id: string): Promise<Reminder | null>
- findByUserId(userId: string, filters: ReminderFilters): Promise<PaginatedResult<Reminder>>
- update(id: string, data: ReminderUpdateData): Promise<Reminder>
- delete(id: string): Promise<void>
- countByUser(userId: string): Promise<number>
- findDueForTrigger(limit: number): Promise<Reminder[]>
```

**Key Implementation Notes**:
- Use Prisma's `findMany` with `skip` and `take` for pagination
- Use Prisma's `where` clause for filtering
- Use Prisma's `orderBy` for sorting
- Handle Prisma errors appropriately
- Return `null` for not found (don't throw)

**Validation**: All tests from Step 1.1 must pass.

---

### Phase 2: Service Layer (Business Logic)

#### ✅ Step 2.1: Create ReminderService Tests
**File**: `apps/api/src/domains/reminders/__tests__/reminder.service.spec.ts`

**Test Cases Required**:

**create() Method**:
1. Creates reminder successfully
2. Validates DTO using Zod schema
3. Checks user subscription tier for quota
4. Throws `QuotaExceededError` when limit exceeded
5. Sets default `nextTriggerAt` from schedule
6. Associates with escalation profile
7. Handles repository errors

**findById() Method**:
1. Returns reminder when exists and user owns it
2. Throws `NotFoundError` when reminder doesn't exist
3. Throws `ForbiddenError` when user doesn't own reminder

**findAll() Method**:
1. Returns paginated reminders for user
2. Applies filters correctly (status, importance)
3. Applies pagination (page, limit)
4. Returns empty array when no reminders
5. Only returns user's own reminders

**update() Method**:
1. Updates reminder successfully
2. Throws `NotFoundError` when reminder doesn't exist
3. Throws `ForbiddenError` when user doesn't own reminder
4. Validates DTO
5. Handles partial updates
6. Updates `nextTriggerAt` if schedule changed

**delete() Method**:
1. Deletes reminder successfully
2. Throws `NotFoundError` when reminder doesn't exist
3. Throws `ForbiddenError` when user doesn't own reminder
4. Cascades deletion (handled by Prisma)

**Test Pattern**: Follow `auth.service.spec.ts` as reference.

---

#### ✅ Step 2.2: Implement ReminderService
**File**: `apps/api/src/domains/reminders/reminder.service.ts`

**Requirements**:
- Implements `IReminderService` interface (from `@er/interfaces`)
- Uses `ReminderRepository` for data access
- Uses validation utilities from `@er/utils`
- Uses constants from `@er/constants` for subscription limits
- **Business logic only** - no data access

**Dependencies**:
- `ReminderRepository` (injected)
- `AuthRepository` (for subscription tier check)
- Validation utilities

**Methods to Implement**:
```typescript
- create(userId: string, dto: CreateReminderDto): Promise<Reminder>
- findById(userId: string, reminderId: string): Promise<Reminder>
- findAll(userId: string, filters: ReminderFilters): Promise<PaginatedResult<Reminder>>
- update(userId: string, reminderId: string, dto: UpdateReminderDto): Promise<Reminder>
- delete(userId: string, reminderId: string): Promise<void>
```

**Key Implementation Notes**:
- **Quota Check**: Use `SUBSCRIPTION_TIERS` from `@er/constants` to check reminder limits
- **Validation**: Use `validateReminder` from `@er/utils` for DTO validation
- **Authorization**: Always verify `userId` matches reminder owner
- **Error Handling**: Use custom exceptions (NotFoundError, ForbiddenError, QuotaExceededError)
- **Default Values**: Set sensible defaults (e.g., `nextTriggerAt` from schedule)

**Validation**: All tests from Step 2.1 must pass.

---

### Phase 3: Controller Layer (HTTP API)

#### ✅ Step 3.1: Create ReminderController Tests
**File**: `apps/api/src/domains/reminders/__tests__/reminder.controller.spec.ts`

**Test Cases Required**:

**POST /reminders**:
1. Creates reminder successfully (201)
2. Returns created reminder
3. Validates request body
4. Returns 400 for invalid DTO
5. Returns 403 for quota exceeded
6. Uses authenticated user ID

**GET /reminders/:id**:
1. Returns reminder (200)
2. Returns 404 when not found
3. Returns 403 when user doesn't own reminder
4. Uses authenticated user ID

**GET /reminders**:
1. Returns paginated reminders (200)
2. Applies query filters
3. Handles pagination parameters
4. Returns empty array when no reminders
5. Uses authenticated user ID

**PATCH /reminders/:id**:
1. Updates reminder successfully (200)
2. Returns updated reminder
3. Returns 404 when not found
4. Returns 403 when user doesn't own reminder
5. Validates request body
6. Handles partial updates

**DELETE /reminders/:id**:
1. Deletes reminder successfully (204)
2. Returns 404 when not found
3. Returns 403 when user doesn't own reminder

**Test Pattern**: Follow `auth.controller.spec.ts` as reference.

---

#### ✅ Step 3.2: Implement ReminderController
**File**: `apps/api/src/domains/reminders/reminder.controller.ts`

**Requirements**:
- Uses NestJS decorators (`@Controller`, `@Get`, `@Post`, etc.)
- Uses `@ApiTags`, `@ApiOperation`, `@ApiResponse` for Swagger
- Uses `JwtAuthGuard` for authentication
- Uses `@Request()` decorator to get authenticated user
- Validates DTOs using class-validator

**Endpoints to Implement**:
```typescript
POST   /reminders          - Create reminder
GET    /reminders/:id      - Get reminder by ID
GET    /reminders          - List reminders (with filters)
PATCH  /reminders/:id      - Update reminder
DELETE /reminders/:id     - Delete reminder
```

**Swagger Documentation**:
- All endpoints must have `@ApiOperation` with summary
- All endpoints must have `@ApiResponse` for success and error cases
- Use DTOs with Swagger decorators

**Request/Response Formats**:
- Follow `API-DESIGN.md` specifications
- Use DTOs from `@er/types`
- Return proper HTTP status codes

**Validation**: All tests from Step 3.1 must pass.

---

### Phase 4: Module Integration

#### ✅ Step 4.1: Create ReminderModule
**File**: `apps/api/src/domains/reminders/reminder.module.ts`

**Requirements**:
- Imports required modules (DatabaseModule, etc.)
- Provides ReminderService and ReminderRepository
- Exports ReminderService (for use in other modules)
- Registers ReminderController

**Module Structure**:
```typescript
@Module({
  imports: [DatabaseModule], // For PrismaService
  controllers: [ReminderController],
  providers: [ReminderService, ReminderRepository],
  exports: [ReminderService],
})
export class ReminderModule {}
```

---

#### ✅ Step 4.2: Integrate with AppModule
**File**: `apps/api/src/app.module.ts`

**Action**: Uncomment and add ReminderModule to imports.

```typescript
import { ReminderModule } from './domains/reminders/reminder.module';

@Module({
  imports: [
    // ... existing imports
    ReminderModule,
  ],
})
```

---

### Phase 5: Type Definitions

#### ✅ Step 5.1: Verify Type Definitions
**Files**: Check `packages/@er/types/src/domains/`

**Required Types** (should already exist):
- `CreateReminderDto`
- `UpdateReminderDto`
- `ReminderFilters`
- `PaginatedResult<Reminder>`
- `Reminder` (from Prisma)

**Action**: Verify these types exist. If not, create them following the Prisma schema.

---

### Phase 6: Validation

#### ✅ Step 6.1: Verify Validation Schemas
**File**: `packages/@er/utils/src/validation/reminder-validation.ts`

**Required**: Should already exist from previous work.

**Action**: Verify validation schemas match the DTOs.

---

## Implementation Standards

### TDD (Test-Driven Development)
1. ✅ Write test first
2. ✅ Run test (should fail)
3. ✅ Write minimal code to pass
4. ✅ Refactor if needed
5. ✅ Repeat

### ISP (Interface Segregation Principle)
- ✅ Repository implements `IReminderRepository` only
- ✅ Service implements `IReminderService` only
- ✅ No direct dependencies on concrete classes
- ✅ Use interfaces for all dependencies

### Error Handling
- ✅ Use custom exceptions (NotFoundError, ForbiddenError, etc.)
- ✅ Map to appropriate HTTP status codes
- ✅ Return consistent error format

### Code Quality
- ✅ 100% test coverage for service and repository
- ✅ Follow NestJS best practices
- ✅ Use dependency injection
- ✅ Document with JSDoc comments

---

## API Endpoint Specifications

### POST /v1/reminders
**Request**:
```json
{
  "title": "Call dentist",
  "description": "Schedule appointment",
  "importance": "HIGH",
  "escalationProfileId": "uuid",
  "schedule": {
    "type": "ONCE",
    "triggerAt": "2024-12-25T10:00:00Z"
  }
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "Call dentist",
  "description": "Schedule appointment",
  "importance": "HIGH",
  "status": "ACTIVE",
  "escalationProfileId": "uuid",
  "nextTriggerAt": "2024-12-25T10:00:00Z",
  "createdAt": "2024-12-20T10:00:00Z",
  "updatedAt": "2024-12-20T10:00:00Z"
}
```

### GET /v1/reminders/:id
**Response** (200):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "Call dentist",
  "description": "Schedule appointment",
  "importance": "HIGH",
  "status": "ACTIVE",
  "escalationProfileId": "uuid",
  "nextTriggerAt": "2024-12-25T10:00:00Z",
  "createdAt": "2024-12-20T10:00:00Z",
  "updatedAt": "2024-12-20T10:00:00Z"
}
```

### GET /v1/reminders
**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `status` (string, optional: ACTIVE, SNOOZED, COMPLETED, ARCHIVED)
- `importance` (string, optional: LOW, MEDIUM, HIGH, CRITICAL)
- `sortBy` (string, default: "nextTriggerAt")
- `sortOrder` (string, default: "asc")

**Response** (200):
```json
{
  "data": [...reminders],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### PATCH /v1/reminders/:id
**Request**:
```json
{
  "title": "Updated title",
  "description": "Updated description"
}
```

**Response** (200): Same as GET /v1/reminders/:id

### DELETE /v1/reminders/:id
**Response** (204): No content

---

## Database Schema Reference

**Reminder Model** (from Prisma schema):
```prisma
model Reminder {
  id                  String             @id @default(uuid())
  userId              String             @map("user_id")
  title               String
  description         String?
  importance          ReminderImportance  @default(MEDIUM)
  status              ReminderStatus      @default(ACTIVE)
  escalationProfileId String             @map("escalation_profile_id")
  nextTriggerAt       DateTime?          @map("next_trigger_at")
  lastTriggeredAt     DateTime?          @map("last_triggered_at")
  completedAt         DateTime?          @map("completed_at")
  createdAt           DateTime           @default(now()) @map("created_at")
  updatedAt           DateTime           @updatedAt @map("updated_at")
  
  // Relations
  user               User
  escalationProfile  EscalationProfile
  schedule           ReminderSchedule?
  snoozes            ReminderSnooze[]
  // ... other relations
}
```

---

## Subscription Quota Limits

**From `@er/constants`**:
- FREE: 5 reminders
- PERSONAL: 50 reminders
- PRO: 500 reminders
- FAMILY: 2000 reminders

**Implementation**: Check user's subscription tier and enforce limits in `ReminderService.create()`.

---

## Testing Checklist

### Unit Tests
- ✅ Repository: 18 test cases
- ✅ Service: ~25 test cases
- ✅ Controller: ~15 test cases
- ✅ **Total**: ~58 test cases

### Integration Tests (Future)
- ✅ End-to-end API tests
- ✅ Database integration tests

---

## Completion Criteria

✅ **Phase 1 Complete** when:
- All repository tests pass
- Repository implements all interface methods
- Code coverage ≥ 100%

✅ **Phase 2 Complete** when:
- All service tests pass
- Service implements all interface methods
- Code coverage ≥ 100%

✅ **Phase 3 Complete** when:
- All controller tests pass
- All endpoints work via Swagger UI
- Code coverage ≥ 100%

✅ **Phase 4 Complete** when:
- Module integrated into AppModule
- API starts without errors
- Swagger documentation shows all endpoints

✅ **Overall Complete** when:
- All phases complete
- All tests pass
- Swagger documentation complete
- Code review approved

---

## Next Steps After Completion

1. ✅ **Worker Service**: Implement reminder trigger logic
2. ✅ **Scheduler Service**: Implement cron job for finding due reminders
3. ✅ **Frontend**: Create reminder management UI
4. ✅ **E2E Tests**: Add end-to-end tests

---

## Notes for Engineer

1. **Follow TDD strictly**: Write tests first, then implement
2. **Use existing patterns**: Follow Auth domain as reference
3. **ISP compliance**: Only implement interface methods
4. **Error handling**: Use consistent error format
5. **Documentation**: Add JSDoc comments
6. **Swagger**: Document all endpoints properly

---

*This checklist is the authoritative guide for Reminders domain implementation. The engineer MUST follow this order and complete all steps.*

