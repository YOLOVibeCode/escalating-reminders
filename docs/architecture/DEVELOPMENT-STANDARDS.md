# Development Standards & Best Practices

> **Version**: 1.0.0  
> **Last Updated**: December 2024  
> **Enforcement**: Mandatory for all contributors

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Repository Structure](#repository-structure)
3. [Package Architecture](#package-architecture)
4. [Test-Driven Development](#test-driven-development)
5. [Interface Segregation Principle](#interface-segregation-principle)
6. [TypeScript Standards](#typescript-standards)
7. [Naming Conventions](#naming-conventions)
8. [API Design (Swagger-First)](#api-design-swagger-first)
9. [Database (Prisma-First)](#database-prisma-first)
10. [Testing Standards](#testing-standards)
11. [Code Quality Tools](#code-quality-tools)
12. [Documentation Standards](#documentation-standards)

---

## Core Principles

### Development Philosophy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT PRINCIPLES                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   1. TDD (Test-Driven Development)                                      │
│      ────────────────────────────                                       │
│      Write tests FIRST, then implementation                             │
│      Red → Green → Refactor cycle                                       │
│      100% test coverage requirement                                     │
│                                                                          │
│   2. ISP (Interface Segregation Principle)                              │
│      ─────────────────────────────────────                              │
│      Clients should not depend on interfaces they don't use            │
│      Many small, focused interfaces over large, general ones           │
│      Interfaces live in dedicated package                               │
│                                                                          │
│   3. COMPONENTIZATION                                                    │
│      ─────────────────                                                   │
│      Everything is a package                                            │
│      Clear boundaries and dependencies                                  │
│      Independently testable and deployable                              │
│                                                                          │
│   4. SWAGGER-FIRST API                                                   │
│      ─────────────────                                                   │
│      Define OpenAPI spec before implementation                          │
│      Generate types from spec                                           │
│      Contract-driven development                                        │
│                                                                          │
│   5. PRISMA-FIRST DATABASE                                              │
│      ────────────────────                                               │
│      Schema is source of truth                                          │
│      Generate types from schema                                         │
│      Migration-driven database changes                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Quality Gates

| Gate | Requirement | Enforcement |
|------|-------------|-------------|
| **Test Coverage** | 100% line coverage | CI blocks merge |
| **Type Safety** | Zero `any` types | ESLint rule |
| **Linting** | Zero errors | CI blocks merge |
| **Documentation** | All public APIs documented | TSDoc required |
| **Code Review** | 1 approval minimum | Branch protection |

---

## Repository Structure

### Monorepo Layout

```
escalating-reminders/
│
├── packages/                          # 📦 SHARED PACKAGES (npm publishable)
│   │
│   ├── @er/interfaces/                # 🔷 ALL INTERFACES (ISP)
│   │   ├── src/
│   │   │   ├── domains/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── IAuthService.ts
│   │   │   │   │   ├── ITokenService.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── reminders/
│   │   │   │   │   ├── IReminderService.ts
│   │   │   │   │   ├── IReminderRepository.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── escalation/
│   │   │   │   ├── notifications/
│   │   │   │   ├── agents/
│   │   │   │   ├── watchers/
│   │   │   │   ├── billing/
│   │   │   │   └── calendar/
│   │   │   ├── infrastructure/
│   │   │   │   ├── ILogger.ts
│   │   │   │   ├── ICache.ts
│   │   │   │   ├── IQueue.ts
│   │   │   │   └── IEventBus.ts
│   │   │   └── index.ts               # Barrel export
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @er/types/                     # 📝 SHARED TYPES & ENUMS
│   │   ├── src/
│   │   │   ├── domains/
│   │   │   │   ├── user.types.ts
│   │   │   │   ├── reminder.types.ts
│   │   │   │   ├── escalation.types.ts
│   │   │   │   ├── notification.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── api/
│   │   │   │   ├── requests.types.ts
│   │   │   │   ├── responses.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── events/
│   │   │   │   ├── domain-events.types.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @er/constants/                 # 🔢 CONSTANTS & CONFIGURATION
│   │   ├── src/
│   │   │   ├── subscription-tiers.ts
│   │   │   ├── escalation-presets.ts
│   │   │   ├── rate-limits.ts
│   │   │   ├── error-codes.ts
│   │   │   ├── regex-patterns.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @er/utils/                     # 🛠️ UTILITY FUNCTIONS
│   │   ├── src/
│   │   │   ├── date/
│   │   │   │   ├── natural-language-parser.ts
│   │   │   │   ├── timezone.ts
│   │   │   │   └── index.ts
│   │   │   ├── validation/
│   │   │   │   ├── schemas.ts
│   │   │   │   └── index.ts
│   │   │   ├── crypto/
│   │   │   │   ├── encryption.ts
│   │   │   │   ├── hashing.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── __tests__/                 # Unit tests
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @er/ui-components/             # 🎨 REACT UI COMPONENTS
│   │   ├── src/
│   │   │   ├── atoms/
│   │   │   │   ├── Button/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Button.test.tsx
│   │   │   │   │   ├── Button.stories.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Input/
│   │   │   │   └── index.ts
│   │   │   ├── molecules/
│   │   │   │   ├── ReminderCard/
│   │   │   │   ├── EscalationTierBadge/
│   │   │   │   └── index.ts
│   │   │   ├── organisms/
│   │   │   │   ├── ReminderForm/
│   │   │   │   ├── EscalationProfileEditor/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── @er/api-client/                # 🌐 TYPE-SAFE API CLIENT
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── endpoints/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── @er/agent-sdk/                 # 🔌 AGENT SDK (Open Source)
│       ├── src/
│       │   ├── interfaces/
│       │   ├── base/
│       │   ├── testing/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── apps/                              # 📱 APPLICATIONS
│   │
│   ├── api/                           # Backend API
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── domains/               # Domain implementations
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.service.spec.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.controller.spec.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── ...
│   │   │   ├── infrastructure/
│   │   │   └── swagger/
│   │   │       └── openapi.yaml       # SWAGGER SPEC (Source of Truth)
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # PRISMA SCHEMA (Source of Truth)
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── __tests__/
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                           # Frontend Web App
│       ├── src/
│       │   ├── app/                   # Next.js App Router
│       │   ├── features/              # Feature modules
│       │   ├── hooks/
│       │   └── services/
│       ├── __tests__/
│       ├── package.json
│       └── tsconfig.json
│
├── agents/                            # 🔔 OFFICIAL NOTIFICATION AGENTS
│   ├── email-agent/
│   ├── sms-agent/
│   └── webhook-agent/
│
├── tools/                             # 🔧 DEVELOPMENT TOOLS
│   ├── generators/                    # Code generators
│   ├── scripts/                       # Build/deploy scripts
│   └── openapi-codegen/               # Swagger code generation
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── release.yml
│       └── coverage.yml
│
├── package.json                       # Workspace root
├── turbo.json                         # Turborepo configuration
├── tsconfig.base.json                 # Base TypeScript config
├── .eslintrc.js                       # ESLint configuration
├── .prettierrc                        # Prettier configuration
├── jest.config.ts                     # Jest configuration
└── SPECIFICATION.md
```

### Package Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PACKAGE DEPENDENCY GRAPH                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   LEVEL 0: NO DEPENDENCIES (Foundation)                                 │
│   ─────────────────────────────────────                                  │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │
│   │ @er/interfaces │  │   @er/types    │  │ @er/constants  │           │
│   │                │  │                │  │                │           │
│   │  Pure TS       │  │  Pure TS       │  │  Pure TS       │           │
│   │  Zero deps     │  │  Zero deps     │  │  Zero deps     │           │
│   └────────────────┘  └────────────────┘  └────────────────┘           │
│           │                   │                   │                     │
│           └───────────────────┼───────────────────┘                     │
│                               │                                          │
│   LEVEL 1: UTILITIES                                                     │
│   ──────────────────                                                     │
│                               ▼                                          │
│                     ┌────────────────┐                                  │
│                     │   @er/utils    │                                  │
│                     │                │                                  │
│                     │  Depends on:   │                                  │
│                     │  - interfaces  │                                  │
│                     │  - types       │                                  │
│                     │  - constants   │                                  │
│                     └────────────────┘                                  │
│                               │                                          │
│   LEVEL 2: COMPONENTS                                                    │
│   ───────────────────                                                    │
│           ┌───────────────────┼───────────────────┐                     │
│           ▼                   ▼                   ▼                     │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │
│   │@er/ui-components│ │ @er/api-client │  │ @er/agent-sdk  │           │
│   └────────────────┘  └────────────────┘  └────────────────┘           │
│           │                   │                   │                     │
│   LEVEL 3: APPLICATIONS                                                  │
│   ─────────────────────                                                  │
│           └───────────────────┼───────────────────┘                     │
│                               ▼                                          │
│                     ┌────────────────┐                                  │
│                     │   apps/api     │                                  │
│                     │   apps/web     │                                  │
│                     └────────────────┘                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Package Architecture

### @er/interfaces Package

**Purpose**: Contains ALL interfaces following ISP. No implementations.

```typescript
// packages/@er/interfaces/src/domains/reminders/IReminderService.ts

/**
 * Service interface for reminder operations.
 * Follows ISP - only reminder-specific methods.
 */
export interface IReminderService {
  /**
   * Create a new reminder for a user.
   * @throws {ValidationError} If DTO is invalid
   * @throws {QuotaExceededError} If user exceeds reminder limit
   */
  create(userId: string, dto: CreateReminderDto): Promise<Reminder>;
  
  /**
   * Find a reminder by ID.
   * @throws {NotFoundError} If reminder doesn't exist
   * @throws {ForbiddenError} If user doesn't own reminder
   */
  findById(userId: string, reminderId: string): Promise<Reminder>;
  
  /**
   * Update a reminder.
   * @throws {NotFoundError} If reminder doesn't exist
   * @throws {ForbiddenError} If user doesn't own reminder
   */
  update(userId: string, reminderId: string, dto: UpdateReminderDto): Promise<Reminder>;
  
  /**
   * Delete a reminder.
   * @throws {NotFoundError} If reminder doesn't exist
   * @throws {ForbiddenError} If user doesn't own reminder
   */
  delete(userId: string, reminderId: string): Promise<void>;
}

// Separate interface for snooze operations (ISP)
export interface IReminderSnoozeService {
  /**
   * Snooze a reminder.
   * @param duration - Natural language duration (e.g., "until next Friday")
   */
  snooze(userId: string, reminderId: string, duration: string): Promise<ReminderSnooze>;
  
  /**
   * Cancel an active snooze.
   */
  cancelSnooze(userId: string, reminderId: string): Promise<void>;
}

// Separate interface for completion (ISP)
export interface IReminderCompletionService {
  /**
   * Mark reminder as complete.
   */
  complete(userId: string, reminderId: string, source: CompletionSource): Promise<void>;
  
  /**
   * Acknowledge reminder (stop escalation without completing).
   */
  acknowledge(userId: string, reminderId: string): Promise<void>;
}
```

### @er/types Package

**Purpose**: Contains all TypeScript types, DTOs, and enums.

```typescript
// packages/@er/types/src/domains/reminder.types.ts

/**
 * Reminder importance levels.
 * Maps to escalation urgency.
 */
export enum ReminderImportance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Reminder status in lifecycle.
 */
export enum ReminderStatus {
  ACTIVE = 'active',
  SNOOZED = 'snoozed',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

/**
 * Core reminder entity type.
 * Generated from Prisma schema.
 */
export interface Reminder {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string | null;
  readonly importance: ReminderImportance;
  readonly status: ReminderStatus;
  readonly escalationProfileId: string;
  readonly nextTriggerAt: Date | null;
  readonly lastTriggeredAt: Date | null;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * DTO for creating a reminder.
 * Validated via Zod schema.
 */
export interface CreateReminderDto {
  readonly title: string;
  readonly description?: string;
  readonly importance: ReminderImportance;
  readonly escalationProfileId: string;
  readonly schedule: CreateScheduleDto;
  readonly completionCriteria?: CreateCompletionCriteriaDto;
}

/**
 * DTO for updating a reminder.
 * All fields optional.
 */
export interface UpdateReminderDto {
  readonly title?: string;
  readonly description?: string;
  readonly importance?: ReminderImportance;
  readonly escalationProfileId?: string;
}
```

### @er/constants Package

**Purpose**: Contains all literal strings, configuration constants, and presets.

```typescript
// packages/@er/constants/src/subscription-tiers.ts

import type { SubscriptionTier } from '@er/types';

/**
 * Subscription tier configuration.
 * Single source of truth for tier limits.
 */
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    limits: {
      maxReminders: 3,
      maxAgents: 1,
      maxTrustedContacts: 0,
      emailWatchers: false,
      calendarSync: false,
      socialEscalation: false,
    },
  },
  PERSONAL: {
    id: 'personal',
    name: 'Personal',
    price: 500, // cents
    limits: {
      maxReminders: 20,
      maxAgents: 5,
      maxTrustedContacts: 2,
      emailWatchers: true,
      calendarSync: true,
      socialEscalation: false,
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 1500, // cents
    limits: {
      maxReminders: -1, // unlimited
      maxAgents: -1,
      maxTrustedContacts: 10,
      emailWatchers: true,
      calendarSync: true,
      socialEscalation: true,
    },
  },
  FAMILY: {
    id: 'family',
    name: 'Family',
    price: 2500, // cents
    limits: {
      maxReminders: -1,
      maxAgents: -1,
      maxTrustedContacts: 20,
      emailWatchers: true,
      calendarSync: true,
      socialEscalation: true,
      sharedReminders: true,
    },
  },
} as const satisfies Record<string, SubscriptionTierConfig>;

// Type-safe tier IDs
export type SubscriptionTierId = keyof typeof SUBSCRIPTION_TIERS;
```

```typescript
// packages/@er/constants/src/error-codes.ts

/**
 * Application error codes.
 * Used for consistent error handling across all packages.
 */
export const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  
  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  
  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_FORBIDDEN: 'RESOURCE_FORBIDDEN',
  
  // Business Logic
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT: 'EXTERNAL_SERVICE_TIMEOUT',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
```

---

## Test-Driven Development

### TDD Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TDD DEVELOPMENT CYCLE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   STEP 1: DEFINE INTERFACE (in @er/interfaces)                          │
│   ────────────────────────────────────────────                          │
│   Write the interface contract first                                    │
│   Document expected behavior with TSDoc                                 │
│                                                                          │
│   STEP 2: WRITE FAILING TEST (Red)                                      │
│   ────────────────────────────────                                       │
│   Write test cases for each interface method                           │
│   Test MUST fail initially (no implementation)                         │
│                                                                          │
│   STEP 3: IMPLEMENT (Green)                                             │
│   ─────────────────────────                                              │
│   Write minimal implementation to pass tests                           │
│   No premature optimization                                             │
│                                                                          │
│   STEP 4: REFACTOR                                                       │
│   ────────────────────                                                   │
│   Clean up implementation                                               │
│   Tests MUST still pass                                                 │
│                                                                          │
│   STEP 5: VERIFY COVERAGE                                               │
│   ───────────────────────                                                │
│   Check 100% coverage                                                   │
│   Add tests for edge cases                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### TDD Example

```typescript
// STEP 1: Define Interface (packages/@er/interfaces)
// IReminderService.ts
export interface IReminderService {
  create(userId: string, dto: CreateReminderDto): Promise<Reminder>;
}

// STEP 2: Write Failing Test (apps/api/__tests__)
// reminder.service.spec.ts
describe('ReminderService', () => {
  let service: IReminderService;
  let mockRepository: jest.Mocked<IReminderRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mockRepository = createMockReminderRepository();
    mockEventBus = createMockEventBus();
    service = new ReminderService(mockRepository, mockEventBus);
  });

  describe('create', () => {
    it('should create a reminder with valid data', async () => {
      // Arrange
      const userId = 'usr_123';
      const dto: CreateReminderDto = {
        title: 'Test Reminder',
        importance: ReminderImportance.HIGH,
        escalationProfileId: 'esc_456',
        schedule: {
          type: ScheduleType.ONCE,
          timezone: 'America/New_York',
          triggerAt: new Date('2024-01-20T09:00:00Z'),
        },
      };

      mockRepository.create.mockResolvedValue({
        id: 'rem_789',
        userId,
        ...dto,
        status: ReminderStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await service.create(userId, dto);

      // Assert
      expect(result.id).toBe('rem_789');
      expect(result.title).toBe('Test Reminder');
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        ...dto,
        status: ReminderStatus.ACTIVE,
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'reminder.created',
        }),
      );
    });

    it('should throw ValidationError for invalid title', async () => {
      // Arrange
      const dto = {
        title: '', // Invalid: empty title
        importance: ReminderImportance.HIGH,
        escalationProfileId: 'esc_456',
      };

      // Act & Assert
      await expect(service.create('usr_123', dto)).rejects.toThrow(
        ValidationError,
      );
    });

    it('should throw QuotaExceededError when limit reached', async () => {
      // Arrange
      mockRepository.countByUser.mockResolvedValue(3); // At limit for free tier

      // Act & Assert
      await expect(service.create('usr_123', validDto)).rejects.toThrow(
        QuotaExceededError,
      );
    });
  });
});

// STEP 3: Implement (apps/api/src/domains/reminders)
// reminder.service.ts
@Injectable()
export class ReminderService implements IReminderService {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly repository: IReminderRepository,
    @Inject(EVENT_BUS)
    private readonly eventBus: IEventBus,
  ) {}

  async create(userId: string, dto: CreateReminderDto): Promise<Reminder> {
    // Validate
    const validatedDto = await this.validateCreateDto(dto);
    
    // Check quota
    await this.checkQuota(userId);
    
    // Create
    const reminder = await this.repository.create({
      userId,
      ...validatedDto,
      status: ReminderStatus.ACTIVE,
    });
    
    // Publish event
    await this.eventBus.publish({
      type: 'reminder.created',
      payload: { reminderId: reminder.id, userId },
    });
    
    return reminder;
  }
}
```

### Test File Structure

```
__tests__/
├── unit/                              # Unit tests (fast, isolated)
│   ├── services/
│   │   ├── reminder.service.spec.ts
│   │   ├── escalation.service.spec.ts
│   │   └── notification.service.spec.ts
│   ├── utils/
│   │   └── date-parser.spec.ts
│   └── validators/
│       └── reminder.validator.spec.ts
│
├── integration/                       # Integration tests (database, cache)
│   ├── repositories/
│   │   ├── reminder.repository.spec.ts
│   │   └── user.repository.spec.ts
│   └── services/
│       └── auth.integration.spec.ts
│
└── e2e/                               # End-to-end tests (full API)
    ├── auth.e2e-spec.ts
    ├── reminders.e2e-spec.ts
    └── billing.e2e-spec.ts
```

---

## Interface Segregation Principle

### ISP Guidelines

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INTERFACE SEGREGATION RULES                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ✅ DO:                                                                │
│   ─────                                                                 │
│   • Create small, focused interfaces (5-7 methods max)                 │
│   • Group related methods by responsibility                            │
│   • Use composition: implement multiple interfaces                     │
│   • Name interfaces by capability (IReadable, IWritable)               │
│                                                                          │
│   ❌ DON'T:                                                              │
│   ─────────                                                              │
│   • Create "god" interfaces with 20+ methods                           │
│   • Force clients to depend on methods they don't use                  │
│   • Mix read and write operations in same interface                    │
│   • Mix sync and async operations without reason                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### ISP Example: Notification Agent

```typescript
// ❌ BAD: Monolithic interface
interface INotificationAgent {
  sendNotification(payload: Payload): Promise<Result>;
  getPendingNotifications(userId: string): Promise<Notification[]>;
  handleCommand(command: Command): Promise<Result>;
  validateConfiguration(config: unknown): Promise<ValidationResult>;
  testConfiguration(config: unknown): Promise<TestResult>;
  getConfigurationSchema(): ConfigurationSchema;
  onConnect(): Promise<void>;
  onDisconnect(): Promise<void>;
  getMetrics(): AgentMetrics;
}

// ✅ GOOD: Segregated interfaces
interface INotificationSender {
  sendNotification(payload: NotificationPayload): Promise<SendResult>;
}

interface INotificationPoller {
  getPendingNotifications(userId: string): Promise<PendingNotification[]>;
  markAsDelivered(notificationId: string): Promise<void>;
}

interface ICommandHandler {
  handleCommand(command: AgentCommand): Promise<CommandResult>;
  getSupportedCommands(): CommandType[];
}

interface IConfigurable {
  getConfigurationSchema(): ConfigurationSchema;
  validateConfiguration(config: unknown): Promise<ValidationResult>;
  testConfiguration?(config: unknown): Promise<TestResult>;
}

interface ILifecycle {
  onConnect(): Promise<void>;
  onDisconnect(): Promise<void>;
}

interface IMetricsProvider {
  getMetrics(): AgentMetrics;
}

// Agent implements only what it needs
class SmsAgent implements INotificationSender, ICommandHandler, IConfigurable {
  // Only implements 3 interfaces, not 9 unused methods
}

class WebhookAgent implements INotificationSender, INotificationPoller, IConfigurable {
  // Different capability set
}
```

---

## TypeScript Standards

### TypeScript Configuration

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

### TypeScript Rules

```typescript
// ❌ FORBIDDEN
const data: any = fetchData();           // No 'any'
// @ts-ignore                             // No ts-ignore
const x = obj!.property;                 // Avoid non-null assertion

// ✅ REQUIRED
const data: unknown = fetchData();       // Use 'unknown' and narrow
// @ts-expect-error Reason documented    // If needed, document why
if (obj) { const x = obj.property; }     // Proper null checking
```

### Strict Type Patterns

```typescript
// Use branded types for IDs
declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

type UserId = Brand<string, 'UserId'>;
type ReminderId = Brand<string, 'ReminderId'>;

function createUserId(id: string): UserId {
  return id as UserId;
}

// Prevents mixing IDs
function findReminder(reminderId: ReminderId): Promise<Reminder>;
// findReminder(userId); // ❌ Type error!

// Use const assertions for literals
const ACTIONS = ['snooze', 'dismiss', 'complete'] as const;
type Action = typeof ACTIONS[number]; // 'snooze' | 'dismiss' | 'complete'

// Use satisfies for type checking with inference
const config = {
  port: 8000,
  host: 'localhost',
} satisfies ServerConfig;
```

---

## Naming Conventions

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Interfaces | `I{Name}.ts` | `IReminderService.ts` |
| Types | `{name}.types.ts` | `reminder.types.ts` |
| Services | `{name}.service.ts` | `reminder.service.ts` |
| Controllers | `{name}.controller.ts` | `reminder.controller.ts` |
| Repositories | `{name}.repository.ts` | `reminder.repository.ts` |
| Tests | `{name}.spec.ts` | `reminder.service.spec.ts` |
| E2E Tests | `{name}.e2e-spec.ts` | `reminders.e2e-spec.ts` |
| Constants | `{name}.constants.ts` | `error.constants.ts` |
| DTOs | `{name}.dto.ts` | `create-reminder.dto.ts` |

### Code Naming

```typescript
// INTERFACES: PascalCase with 'I' prefix
interface IReminderService {}
interface INotificationSender {}

// TYPES & ENUMS: PascalCase
type ReminderStatus = 'active' | 'completed';
enum SubscriptionTier { FREE, PERSONAL, PRO }

// CLASSES: PascalCase
class ReminderService implements IReminderService {}
class ValidationError extends Error {}

// FUNCTIONS & METHODS: camelCase
function calculateNextTrigger(): Date {}
async function sendNotification(): Promise<void> {}

// CONSTANTS: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 5;
const DEFAULT_TIMEZONE = 'America/New_York';

// PRIVATE PROPERTIES: camelCase (no underscore prefix)
class Service {
  private readonly repository: IRepository; // ✅
  private _repository: IRepository;          // ❌
}

// BOOLEAN NAMES: is/has/can/should prefix
const isActive = true;
const hasPermission = false;
const canDelete = true;
const shouldRetry = false;

// EVENT NAMES: past tense, dot notation
const EVENT_REMINDER_CREATED = 'reminder.created';
const EVENT_ESCALATION_ADVANCED = 'escalation.advanced';
```

---

## Source of Truth: Prisma Schema

> ⚠️ **CRITICAL**: `prisma/schema.prisma` is THE single source of truth for all data types.
> Keep it simple. No duplication. No drift.

### Prisma-First Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRISMA = SINGLE SOURCE OF TRUTH                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   prisma/schema.prisma                                                  │
│          │                                                               │
│          │ npx prisma generate                                          │
│          ▼                                                               │
│   ┌─────────────────┐                                                   │
│   │  Prisma Client  │  ← All entity types, enums, input types          │
│   │     Types       │                                                   │
│   └────────┬────────┘                                                   │
│            │                                                             │
│            │ Re-export (no transformation)                              │
│            ▼                                                             │
│   ┌─────────────────┐                                                   │
│   │   @er/types     │  ← Shared across all apps                        │
│   └────────┬────────┘                                                   │
│            │                                                             │
│     ┌──────┴──────┐                                                     │
│     ▼             ▼                                                     │
│  apps/api     apps/web                                                  │
│                                                                          │
│   ONE SOURCE → MANY CONSUMERS                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Development Workflow

```bash
# 1. Edit schema
vim apps/api/prisma/schema.prisma

# 2. Generate migration + client
cd apps/api
npx prisma migrate dev --name add_feature

# 3. Types are now available everywhere
# Import from @er/types (which re-exports Prisma types)
```

### What Prisma Generates (USE THESE)

| Generated | Example |
|-----------|---------|
| Entity types | `User`, `Reminder`, `Subscription` |
| Enum types | `ReminderStatus`, `SubscriptionTier` |
| Input types | `UserCreateInput`, `ReminderUpdateInput` |
| Relation types | `UserWithProfile`, `ReminderWithSchedule` |

### What We Define Manually (MINIMAL)

| Manual Types | Purpose |
|--------------|---------|
| `ApiResponse<T>` | Wrap responses with success/meta |
| `PaginatedResult<T>` | Pagination wrapper |
| `ErrorResponse` | Error format |
| Interface contracts | `IReminderService` (behavior, not data) |

### ❌ DON'T DO THIS

```typescript
// ❌ WRONG: Duplicating Prisma types
interface Reminder {
  id: string;
  title: string;
  // ... manually copying fields
}

// ❌ WRONG: Generating types from OpenAPI
// (types come from Prisma, not Swagger)
```

### ✅ DO THIS

```typescript
// ✅ CORRECT: Re-export from Prisma
export type { Reminder, User, Subscription } from '@prisma/client';

// ✅ CORRECT: Thin DTO wrappers when needed
import type { Reminder } from '@prisma/client';

export type CreateReminderDto = Pick<Reminder, 'title' | 'description' | 'importance'> & {
  escalationProfileId: string;
  schedule: ScheduleInput;
};
```

---

## API Documentation (Swagger)

> **Note**: Swagger documents the API. Types come from Prisma, not Swagger.

### Swagger's Role

| Swagger Does | Swagger Doesn't |
|--------------|-----------------|
| Document endpoints | Generate types (Prisma does) |
| Show request/response examples | Be source of truth |
| Enable API exploration | Duplicate type definitions |
| Validate requests at runtime | Replace Prisma schema |

### NestJS Swagger Decorators

```typescript
// Use decorators to generate Swagger docs from code
// Types still come from Prisma

import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import type { Reminder } from '@er/types';

export class ReminderResponseDto implements Reminder {
  @ApiProperty({ example: 'rem_abc123' })
  id: string;

  @ApiProperty({ example: 'Daily Medication' })
  title: string;
  
  // ... Prisma type with Swagger decorations
}
```

### Swagger Config

```typescript
// apps/api/src/main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Escalating Reminders API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

Access Swagger UI at: `/api/docs`

### Prisma Schema Standards

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

generator typesExport {
  provider = "prisma-types-generator"
  output   = "../packages/@er/types/src/generated"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

/// User account in the system.
/// @namespace auth
model User {
  /// Unique identifier (UUID v4)
  id            String   @id @default(uuid()) @db.Uuid
  
  /// User's email address (unique, lowercase)
  email         String   @unique @db.VarChar(255)
  
  /// Bcrypt password hash
  passwordHash  String   @map("password_hash") @db.VarChar(255)
  
  /// Whether email has been verified
  emailVerified Boolean  @default(false) @map("email_verified")
  
  /// Account creation timestamp
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  
  /// Last update timestamp
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  profile      UserProfile?
  subscription Subscription?
  reminders    Reminder[]

  @@map("users")
}
```

---

## Testing Standards

### Coverage Requirements

| Metric | Requirement |
|--------|-------------|
| Line Coverage | 100% |
| Branch Coverage | 100% |
| Function Coverage | 100% |
| Statement Coverage | 100% |

### Jest Configuration

```typescript
// jest.config.ts

import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/main.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@er/interfaces$': '<rootDir>/../../packages/@er/interfaces/src',
    '^@er/types$': '<rootDir>/../../packages/@er/types/src',
    '^@er/constants$': '<rootDir>/../../packages/@er/constants/src',
    '^@er/utils$': '<rootDir>/../../packages/@er/utils/src',
  },
};

export default config;
```

### Test Patterns

```typescript
// UNIT TEST PATTERN
describe('ReminderService', () => {
  // Setup
  let service: ReminderService;
  let mockDeps: MockDependencies;

  beforeEach(() => {
    mockDeps = createMockDependencies();
    service = new ReminderService(mockDeps);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    describe('when condition A', () => {
      it('should do X', async () => {
        // Arrange
        // Act
        // Assert
      });
    });

    describe('when condition B', () => {
      it('should do Y', async () => {
        // ...
      });
    });

    describe('error handling', () => {
      it('should throw ErrorType when invalid', async () => {
        // ...
      });
    });
  });
});

// INTEGRATION TEST PATTERN
describe('ReminderRepository (Integration)', () => {
  let repository: ReminderRepository;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.reminder.deleteMany();
    repository = new ReminderRepository(prisma);
  });

  it('should create and retrieve reminder', async () => {
    // ...
  });
});

// E2E TEST PATTERN
describe('Reminders API (E2E)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    authToken = await loginTestUser(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /reminders', () => {
    it('should create reminder with valid data', () => {
      return request(app.getHttpServer())
        .post('/v1/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validReminderDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.data.id).toBeDefined();
          expect(res.body.data.title).toBe(validReminderDto.title);
        });
    });
  });
});
```

---

## Code Quality Tools

### ESLint Configuration

```javascript
// .eslintrc.js

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'jest',
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:import/typescript',
    'plugin:jest/recommended',
    'prettier',
  ],
  rules: {
    // No any
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',

    // Strict null checks
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',

    // Naming conventions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I'],
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
      {
        selector: 'enum',
        format: ['PascalCase'],
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
      },
      {
        selector: 'function',
        format: ['camelCase'],
      },
      {
        selector: 'method',
        format: ['camelCase'],
      },
      {
        selector: 'class',
        format: ['PascalCase'],
      },
    ],

    // Import order
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],

    // No unused
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_' },
    ],

    // Explicit return types
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
  },
};
```

### Pre-commit Hooks

```json
// package.json

{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:coverage"
    }
  },
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yaml}": [
      "prettier --write"
    ]
  }
}
```

---

## Documentation Standards

### TSDoc Comments

```typescript
/**
 * Creates a new reminder for a user.
 *
 * @remarks
 * This method validates the input, checks user quota,
 * creates the reminder, and publishes a domain event.
 *
 * @param userId - The ID of the user creating the reminder
 * @param dto - The reminder creation data
 * @returns The created reminder
 *
 * @throws {@link ValidationError}
 * Thrown if the DTO validation fails.
 *
 * @throws {@link QuotaExceededError}
 * Thrown if the user has reached their reminder limit.
 *
 * @example
 * ```typescript
 * const reminder = await service.create('usr_123', {
 *   title: 'Daily Medication',
 *   importance: ReminderImportance.HIGH,
 *   escalationProfileId: 'esc_456',
 *   schedule: {
 *     type: ScheduleType.RECURRING,
 *     cronExpression: '0 9 * * *',
 *     timezone: 'America/New_York',
 *   },
 * });
 * ```
 */
async create(userId: string, dto: CreateReminderDto): Promise<Reminder>;
```

### README Template

```markdown
# @er/package-name

Brief description of what this package does.

## Installation

\`\`\`bash
npm install @er/package-name
\`\`\`

## Usage

\`\`\`typescript
import { Something } from '@er/package-name';

const result = Something.doThing();
\`\`\`

## API Reference

### `functionName(param: Type): ReturnType`

Description of what the function does.

**Parameters:**
- `param` - Description of parameter

**Returns:** Description of return value

**Example:**
\`\`\`typescript
const result = functionName('value');
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## License

MIT
```

---

*These standards are mandatory for all code contributions. CI/CD pipelines enforce these requirements.*

