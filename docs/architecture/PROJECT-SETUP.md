# Project Setup Specification

> **Version**: 1.0.0  
> **Last Updated**: December 2024

---

## Repository

| Item | Value |
|------|-------|
| **GitHub Repository** | [https://github.com/YOLOVibeCode/escalating-reminders.git](https://github.com/YOLOVibeCode/escalating-reminders) |
| **Organization** | YOLOVibeCode |

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/YOLOVibeCode/escalating-reminders.git
cd escalating-reminders

# Or using GitHub CLI (if configured)
gh repo clone YOLOVibeCode/escalating-reminders
cd escalating-reminders

# Initialize the project
npm install
npm run build
```

---

## Source of Truth: Prisma Schema

> ⚠️ **CRITICAL**: `prisma/schema.prisma` is THE single source of truth for all data types.

### Type Flow (Keep It Simple)

```
prisma/schema.prisma
        │
        │ npx prisma generate
        ▼
   Prisma Client Types (@prisma/client)
        │
        │ Re-export
        ▼
   @er/types (shared package)
        │
        ├──▶ apps/api (backend)
        │
        └──▶ apps/web (frontend)
```

### What This Means

| Aspect | Approach |
|--------|----------|
| **Adding a new entity** | Add to `schema.prisma` → run `prisma generate` |
| **Changing a field** | Edit `schema.prisma` → run `prisma generate` |
| **API types** | Use Prisma types directly or create thin DTO wrappers |
| **Frontend types** | Import from `@er/types` (which re-exports Prisma types) |
| **No duplicate definitions** | Never manually duplicate Prisma types |

### @er/types Package Structure (Simplified)

```typescript
// packages/@er/types/src/index.ts

// Re-export ALL Prisma types as the source of truth
export type {
  User,
  UserProfile,
  Reminder,
  ReminderSchedule,
  ReminderSnooze,
  EscalationProfile,
  EscalationState,
  Subscription,
  // ... all entities
} from '@prisma/client';

// Re-export Prisma enums
export {
  ReminderImportance,
  ReminderStatus,
  SubscriptionTier,
  SubscriptionStatus,
  ScheduleType,
  // ... all enums
} from '@prisma/client';

// Only define what Prisma DOESN'T generate:
// - API wrapper types
// - Pagination types
// - Error types

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
```

---

## Overview

This document provides the exact configuration files and setup instructions for initializing the Escalating Reminders monorepo with proper componentization, TDD, and ISP support.

---

## Monorepo Configuration

### Root package.json

```json
{
  "name": "escalating-reminders",
  "version": "0.0.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*",
    "agents/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "test:coverage": "turbo run test:coverage",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean && rm -rf node_modules",
    "codegen": "turbo run codegen",
    "codegen:api": "tsx tools/openapi-codegen/generate.ts",
    "codegen:prisma": "cd apps/api && npx prisma generate",
    "db:migrate": "cd apps/api && npx prisma migrate dev",
    "db:push": "cd apps/api && npx prisma db push",
    "db:seed": "cd apps/api && npx prisma db seed",
    "db:studio": "cd apps/api && npx prisma studio",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "prettier": "^3.1.0",
    "turbo": "^1.11.0",
    "tsx": "^4.6.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "npm@10.2.0",
  "engines": {
    "node": ">=20.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yaml,yml}": [
      "prettier --write"
    ]
  }
}
```

### Turborepo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    ".env"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "test:coverage": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "lint:fix": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    },
    "codegen": {
      "outputs": ["src/generated/**"]
    }
  }
}
```

### Base TypeScript Configuration

```json
// tsconfig.base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true,
    "allowJs": false,
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
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  },
  "exclude": [
    "node_modules",
    "dist",
    "coverage"
  ]
}
```

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json', './packages/*/tsconfig.json', './apps/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'jest',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:import/typescript',
    'plugin:jest/recommended',
  ],
  rules: {
    // Strict type safety
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    
    // Explicit types
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    
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
    ],
    
    // Import organization
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],
    'import/no-duplicates': 'error',
    
    // No unused
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    'coverage',
    '*.js',
    '*.d.ts',
  ],
};
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Jest Base Configuration

```typescript
// jest.config.base.ts
import type { Config } from 'jest';

const baseConfig: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
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
  clearMocks: true,
  restoreMocks: true,
};

export default baseConfig;
```

---

## Package Configurations

### @er/interfaces Package

```json
// packages/@er/interfaces/package.json
{
  "name": "@er/interfaces",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

```json
// packages/@er/interfaces/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

```typescript
// packages/@er/interfaces/src/index.ts
// Barrel exports for all interfaces

// Domains
export * from './domains/auth';
export * from './domains/reminders';
export * from './domains/escalation';
export * from './domains/notifications';
export * from './domains/agents';
export * from './domains/watchers';
export * from './domains/billing';
export * from './domains/calendar';

// Infrastructure
export * from './infrastructure';
```

### @er/types Package

```json
// packages/@er/types/package.json
{
  "name": "@er/types",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### @er/constants Package

```json
// packages/@er/constants/package.json
{
  "name": "@er/constants",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### @er/utils Package

```json
// packages/@er/utils/package.json
{
  "name": "@er/utils",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@er/interfaces": "workspace:*",
    "@er/types": "workspace:*",
    "@er/constants": "workspace:*"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.3.0"
  }
}
```

### @er/ui-components Package

```json
// packages/@er/ui-components/package.json
{
  "name": "@er/ui-components",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@er/types": "workspace:*",
    "@er/constants": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@storybook/react": "^7.6.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

---

## Application Configurations

### API Application

```json
// apps/api/package.json
{
  "name": "@er/api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "start:worker": "node dist/worker",
    "start:scheduler": "node dist/scheduler",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest --config ./jest.e2e.config.ts",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist coverage"
  },
  "dependencies": {
    "@er/interfaces": "workspace:*",
    "@er/types": "workspace:*",
    "@er/constants": "workspace:*",
    "@er/utils": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.1.0",
    "@nestjs/event-emitter": "^2.0.0",
    "@prisma/client": "^5.6.0",
    "bullmq": "^4.14.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "helmet": "^7.1.0",
    "ioredis": "^5.3.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0",
    "prisma": "^5.6.0",
    "supertest": "^6.3.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.3.0"
  }
}
```

```json
// apps/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "paths": {
      "@er/interfaces": ["../../packages/@er/interfaces/src"],
      "@er/types": ["../../packages/@er/types/src"],
      "@er/constants": ["../../packages/@er/constants/src"],
      "@er/utils": ["../../packages/@er/utils/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

```typescript
// apps/api/jest.config.ts
import type { Config } from 'jest';
import baseConfig from '../../jest.config.base';

const config: Config = {
  ...baseConfig,
  displayName: 'api',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@er/interfaces$': '<rootDir>/../../packages/@er/interfaces/src',
    '^@er/types$': '<rootDir>/../../packages/@er/types/src',
    '^@er/constants$': '<rootDir>/../../packages/@er/constants/src',
    '^@er/utils$': '<rootDir>/../../packages/@er/utils/src',
  },
};

export default config;
```

### Web Application

```json
// apps/web/package.json
{
  "name": "@er/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .next coverage"
  },
  "dependencies": {
    "@er/types": "workspace:*",
    "@er/constants": "workspace:*",
    "@er/utils": "workspace:*",
    "@er/ui-components": "workspace:*",
    "@er/api-client": "workspace:*",
    "@tanstack/react-query": "^5.8.0",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@types/react": "^18.2.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "typescript": "^5.3.0"
  }
}
```

---

## OpenAPI Codegen Tool

```typescript
// tools/openapi-codegen/generate.ts

import { generateApi } from 'swagger-typescript-api';
import * as path from 'path';

async function generate(): Promise<void> {
  await generateApi({
    name: 'api.generated.ts',
    output: path.resolve(__dirname, '../../packages/@er/types/src/api'),
    input: path.resolve(__dirname, '../../apps/api/swagger/openapi.yaml'),
    httpClientType: 'fetch',
    generateClient: false,
    generateRouteTypes: true,
    extractRequestBody: true,
    extractRequestParams: true,
    extractResponseBody: true,
    extractResponseError: true,
    unwrapResponseData: true,
    prettier: {
      singleQuote: true,
      trailingComma: 'all',
    },
  });

  console.log('✅ API types generated successfully');
}

generate().catch(console.error);
```

---

## Initial Interface Definitions

### Auth Domain Interfaces

```typescript
// packages/@er/interfaces/src/domains/auth/IAuthService.ts

import type { User, CreateUserDto, LoginDto, TokenPair } from '@er/types';

/**
 * Service interface for authentication operations.
 */
export interface IAuthService {
  /**
   * Register a new user.
   * @throws {ValidationError} If DTO is invalid
   * @throws {ConflictError} If email already exists
   */
  register(dto: CreateUserDto): Promise<{ user: User; tokens: TokenPair }>;

  /**
   * Authenticate a user.
   * @throws {UnauthorizedError} If credentials are invalid
   */
  login(dto: LoginDto): Promise<{ user: User; tokens: TokenPair }>;

  /**
   * Refresh access token.
   * @throws {UnauthorizedError} If refresh token is invalid
   */
  refreshToken(refreshToken: string): Promise<TokenPair>;

  /**
   * Invalidate refresh token.
   */
  logout(refreshToken: string): Promise<void>;
}

/**
 * Service interface for token operations.
 */
export interface ITokenService {
  /**
   * Generate access and refresh tokens.
   */
  generateTokenPair(userId: string, email: string): Promise<TokenPair>;

  /**
   * Verify and decode access token.
   * @throws {UnauthorizedError} If token is invalid or expired
   */
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;

  /**
   * Verify refresh token.
   * @throws {UnauthorizedError} If token is invalid or expired
   */
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;

  /**
   * Revoke refresh token.
   */
  revokeRefreshToken(token: string): Promise<void>;
}

/**
 * Service interface for password operations.
 */
export interface IPasswordService {
  /**
   * Hash a password.
   */
  hash(password: string): Promise<string>;

  /**
   * Verify password against hash.
   */
  verify(password: string, hash: string): Promise<boolean>;
}
```

### Reminder Domain Interfaces

```typescript
// packages/@er/interfaces/src/domains/reminders/IReminderService.ts

import type {
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
  ReminderSnooze,
  CompletionSource,
  PaginatedResult,
  ReminderFilters,
} from '@er/types';

/**
 * Service interface for reminder CRUD operations.
 */
export interface IReminderService {
  /**
   * Create a new reminder.
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
   * Find all reminders for a user with pagination.
   */
  findAll(userId: string, filters: ReminderFilters): Promise<PaginatedResult<Reminder>>;

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

/**
 * Service interface for reminder snooze operations.
 * Separated per ISP - not all consumers need snooze functionality.
 */
export interface IReminderSnoozeService {
  /**
   * Snooze a reminder.
   * @param duration - Natural language duration (e.g., "until next Friday")
   * @throws {NotFoundError} If reminder doesn't exist
   * @throws {ForbiddenError} If user doesn't own reminder
   * @throws {ValidationError} If duration cannot be parsed
   */
  snooze(userId: string, reminderId: string, duration: string): Promise<ReminderSnooze>;

  /**
   * Cancel an active snooze.
   * @throws {NotFoundError} If reminder doesn't exist or isn't snoozed
   */
  cancelSnooze(userId: string, reminderId: string): Promise<void>;
}

/**
 * Service interface for reminder completion operations.
 * Separated per ISP - completion logic is distinct from CRUD.
 */
export interface IReminderCompletionService {
  /**
   * Mark reminder as complete.
   * @throws {NotFoundError} If reminder doesn't exist
   * @throws {ForbiddenError} If user doesn't own reminder
   */
  complete(userId: string, reminderId: string, source: CompletionSource): Promise<void>;

  /**
   * Acknowledge reminder (stop escalation without completing).
   * @throws {NotFoundError} If reminder doesn't exist
   */
  acknowledge(userId: string, reminderId: string): Promise<void>;
}

/**
 * Repository interface for reminder data access.
 */
export interface IReminderRepository {
  create(data: CreateReminderData): Promise<Reminder>;
  findById(id: string): Promise<Reminder | null>;
  findByUserId(userId: string, filters: ReminderFilters): Promise<PaginatedResult<Reminder>>;
  update(id: string, data: UpdateReminderData): Promise<Reminder>;
  delete(id: string): Promise<void>;
  countByUser(userId: string): Promise<number>;
}
```

### Infrastructure Interfaces

```typescript
// packages/@er/interfaces/src/infrastructure/IEventBus.ts

import type { DomainEvent } from '@er/types';

/**
 * Interface for publishing and subscribing to domain events.
 */
export interface IEventBus {
  /**
   * Publish an event to all subscribers.
   */
  publish<T extends DomainEvent>(event: T): Promise<void>;

  /**
   * Publish multiple events.
   */
  publishAll(events: DomainEvent[]): Promise<void>;
}

/**
 * Interface for event handlers.
 */
export interface IEventHandler<T extends DomainEvent> {
  /**
   * Handle the event.
   */
  handle(event: T): Promise<void>;
}
```

```typescript
// packages/@er/interfaces/src/infrastructure/ILogger.ts

/**
 * Interface for logging operations.
 */
export interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}
```

```typescript
// packages/@er/interfaces/src/infrastructure/ICache.ts

/**
 * Interface for cache operations.
 */
export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
```

---

## Directory Creation Script

```bash
#!/bin/bash
# tools/scripts/init-project.sh

echo "🚀 Initializing Escalating Reminders project structure..."

# Create package directories
mkdir -p packages/@er/interfaces/src/domains/{auth,reminders,escalation,notifications,agents,watchers,billing,calendar}
mkdir -p packages/@er/interfaces/src/infrastructure
mkdir -p packages/@er/types/src/{domains,api,events}
mkdir -p packages/@er/constants/src
mkdir -p packages/@er/utils/src/{date,validation,crypto}
mkdir -p packages/@er/utils/__tests__
mkdir -p packages/@er/ui-components/src/{atoms,molecules,organisms}
mkdir -p packages/@er/api-client/src/endpoints
mkdir -p packages/@er/agent-sdk/src/{interfaces,base,testing}

# Create app directories
mkdir -p apps/api/src/domains/{auth,reminders,escalation,notifications,agents,watchers,billing,calendar}
mkdir -p apps/api/src/infrastructure/{database,cache,queue,external}
mkdir -p apps/api/swagger
mkdir -p apps/api/prisma/migrations
mkdir -p apps/api/__tests__/{unit,integration,e2e}

mkdir -p apps/web/src/{app,features,hooks,services}
mkdir -p apps/web/__tests__

# Create agent directories
mkdir -p agents/{email-agent,sms-agent,webhook-agent}/src

# Create tools directories
mkdir -p tools/{generators,scripts,openapi-codegen}

# Create infrastructure directory
mkdir -p infrastructure

# Create .github workflows
mkdir -p .github/workflows

echo "✅ Project structure created!"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' to install dependencies"
echo "2. Run 'npm run build' to build all packages"
echo "3. Run 'npm run test' to run all tests"
```

---

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'

jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Cache node_modules
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}

  lint:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run typecheck

  test:
    needs: [lint, typecheck]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

---

*This setup ensures a properly structured monorepo with full componentization, TDD support, and enforced quality standards from day one.*

