# Architecture Specification

> **Version**: 1.0.0  
> **Last Updated**: December 2024

---

## Overview

Escalating Reminders uses a **modular monolith** architecture with **event-driven communication** between domains. The system is designed for:

- **Scalability**: Independent scaling of API and workers
- **Reliability**: Reminders must fire on time, every time
- **Extensibility**: Easy to add new notification agents
- **Simplicity**: Start simple, evolve when needed

---

## Architecture Principles

### 1. API-First Design
The backend is a REST API that can serve multiple clients (web, mobile, third-party integrations).

### 2. Event-Driven Communication
Domains communicate through events, not direct method calls. This enables:
- Loose coupling between modules
- Audit trail of all actions
- Easy addition of new event handlers

### 3. Single Codebase, Multiple Entry Points
One codebase with different entry points for:
- API server
- Background workers
- Scheduler

### 4. Native Builds for Production ✅
Railway builds from source (no Docker) to avoid platform compatibility issues.

**Infrastructure Decision**: Railway selected as backend hosting platform.  
See [INFRASTRUCTURE-DECISION.md](INFRASTRUCTURE-DECISION.md) for full details.

### 5. Docker for Local Development Only
Docker Compose provides local Postgres and Redis, but the app runs natively.

---

## System Components

### 1. Web Application (Next.js)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WEB APPLICATION                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   DEPLOYMENT: Vercel                                                     │
│   FRAMEWORK: Next.js 14 (App Router)                                    │
│                                                                          │
│   RESPONSIBILITIES:                                                      │
│   • User interface for all features                                     │
│   • Authentication flows (login, register)                              │
│   • Dashboard and reminder management                                    │
│   • Agent configuration wizard                                          │
│   • Billing and subscription management                                 │
│   • Settings and preferences                                            │
│                                                                          │
│   COMMUNICATION:                                                         │
│   • REST API calls to backend                                           │
│   • JWT tokens for authentication                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Backend API (NestJS)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   DEPLOYMENT: Railway (native build)                                    │
│   FRAMEWORK: NestJS with TypeScript                                     │
│                                                                          │
│   DOMAIN MODULES:                                                        │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  auth/          Authentication, users, sessions                  │   │
│   │  billing/       Square subscriptions, payment history           │   │
│   │  reminders/     Reminder CRUD, scheduling, completion           │   │
│   │  escalation/    Escalation profiles, state machine, tiers       │   │
│   │  agents/        Agent registry, subscriptions, credentials      │   │
│   │  watchers/      Email watchers, pattern matching, polling       │   │
│   │  calendar/      Calendar sync, label rules, holidays            │   │
│   │  notifications/ Notification orchestration, delivery, logging   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   INFRASTRUCTURE:                                                        │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  database/      Prisma client, repositories                     │   │
│   │  cache/         Redis client, caching strategies                │   │
│   │  queue/         BullMQ producers, job definitions               │   │
│   │  external/      Twilio, SendGrid, Square, OpenAI clients        │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3. Background Workers (BullMQ)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKGROUND WORKERS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   DEPLOYMENT: Railway (separate service, same codebase)                 │
│   FRAMEWORK: BullMQ with TypeScript                                     │
│                                                                          │
│   QUEUES:                                                                │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  high-priority     Reminder triggers, escalation advances       │   │
│   │  default           Notifications, API calls, general tasks      │   │
│   │  low-priority      Analytics, cleanup, reports                  │   │
│   │  scheduled         Future-dated tasks, cron jobs                │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   WORKER TYPES:                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  ReminderWorker       Process reminder triggers                 │   │
│   │  EscalationWorker     Advance escalation tiers                  │   │
│   │  NotificationWorker   Send notifications via agents             │   │
│   │  WatcherWorker        Poll email inboxes                        │   │
│   │  CalendarWorker       Sync calendars, detect holidays           │   │
│   │  CleanupWorker        Archive old data, prune logs              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4. Scheduler (BullMQ Cron)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SCHEDULER                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   DEPLOYMENT: Railway (separate service, singleton)                     │
│   FRAMEWORK: BullMQ with repeatable jobs                                │
│                                                                          │
│   SCHEDULED JOBS:                                                        │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  every minute      Check reminders due for triggering           │   │
│   │  every minute      Check escalations due for advancement        │   │
│   │  every 5 minutes   Poll email watchers                          │   │
│   │  every hour        Sync calendars                               │   │
│   │  daily @ 2am       Cleanup old data                             │   │
│   │  daily @ 3am       Generate usage reports                       │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   CRITICAL: Only ONE scheduler instance must run (singleton)            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Domain Architecture

### Domain Boundaries

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DOMAIN MAP                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌───────────────────────────────────────────────────────────────┐     │
│   │                     CORE DOMAIN                                │     │
│   │                                                                │     │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │     │
│   │   │  Reminders  │◀──▶│ Escalation  │◀──▶│  Notifications  │  │     │
│   │   └─────────────┘    └─────────────┘    └─────────────────┘  │     │
│   │         │                  │                     │           │     │
│   │         ▼                  ▼                     ▼           │     │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │     │
│   │   │  Watchers   │    │  Calendar   │    │     Agents      │  │     │
│   │   └─────────────┘    └─────────────┘    └─────────────────┘  │     │
│   │                                                                │     │
│   └───────────────────────────────────────────────────────────────┘     │
│                                                                          │
│   ┌───────────────────────────────────────────────────────────────┐     │
│   │                   SUPPORTING DOMAIN                            │     │
│   │                                                                │     │
│   │   ┌─────────────┐    ┌─────────────┐                          │     │
│   │   │    Auth     │    │   Billing   │                          │     │
│   │   └─────────────┘    └─────────────┘                          │     │
│   │                                                                │     │
│   └───────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Domain Dependencies

```
Auth ◀── Billing ◀── Reminders ◀── Escalation ◀── Notifications
                         │              │              │
                         ▼              ▼              ▼
                    Watchers       Calendar        Agents
```

---

## Communication Patterns

### 1. Synchronous (API Calls)

For immediate responses:
- Frontend → API: All user interactions
- API → External Services: Square, Twilio (when immediate feedback needed)

### 2. Asynchronous (Event Bus)

For decoupled processing:
- Domain events published to internal event bus
- Event handlers in same or different domains
- No direct coupling between domains

### 3. Job Queues (BullMQ)

For background processing:
- Long-running tasks
- Scheduled operations
- Retry-able operations

---

## Scalability Strategy

### Horizontal Scaling

| Component | Scaling Strategy |
|-----------|------------------|
| API | Multiple instances behind load balancer |
| Workers | Multiple instances consuming from queues |
| Scheduler | Single instance (singleton) |
| Database | Supabase/Railway managed scaling |
| Redis | Upstash serverless scaling |

### Bottleneck Mitigation

| Bottleneck | Mitigation |
|------------|------------|
| Database queries | Connection pooling, read replicas, caching |
| Email sending | Rate limiting, queue batching |
| External API limits | Queue-based rate limiting |
| Large user base | Partition queues by user ID |

---

## Reliability Guarantees

### Reminder Delivery SLA

| Metric | Target |
|--------|--------|
| On-time delivery | 99.5% within 1 minute |
| Escalation accuracy | 100% (never skip tiers) |
| Data durability | 99.999% |

### Failure Handling

| Failure | Response |
|---------|----------|
| API down | Scheduler/workers continue independently |
| Worker crash | Jobs retry from queue |
| Scheduler crash | Auto-restart, jobs wait in queue |
| Database down | Circuit breaker, retry with backoff |
| External API down | Queue for retry, alert user |

---

## Security Architecture

See: [SECURITY.md](SECURITY.md)

### Key Points
- JWT-based authentication
- HMAC-signed webhooks
- Encrypted secrets at rest
- Row-level security in database
- Rate limiting per user/tier

---

## Deployment Architecture

See: [INFRASTRUCTURE.md](INFRASTRUCTURE.md)

### Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local testing | localhost:3000, localhost:8000 |
| Staging | Pre-production testing | staging.escalating-reminders.com |
| Production | Live users | escalating-reminders.com |

### Deployment Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Commit  │───▶│   CI     │───▶│  Staging │───▶│Production│
│          │    │  Tests   │    │  Deploy  │    │  Deploy  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │
                     ▼
              ┌──────────┐
              │  Lint +  │
              │  Build   │
              └──────────┘
```

---

## Technology Decisions

### Why NestJS over Express?

| Factor | NestJS | Express |
|--------|--------|---------|
| Structure | Opinionated, modular | Flexible, manual |
| TypeScript | First-class | Manual setup |
| Dependency Injection | Built-in | Manual |
| Testing | Built-in support | Manual setup |
| Learning curve | Steeper | Easier |

**Decision**: NestJS for better structure and maintainability at scale.

### Why BullMQ over Agenda/node-cron?

| Factor | BullMQ | Agenda | node-cron |
|--------|--------|--------|-----------|
| Redis-backed | ✅ | MongoDB | ❌ |
| Distributed | ✅ | ✅ | ❌ |
| Retries | ✅ | ✅ | ❌ |
| Priority queues | ✅ | ❌ | ❌ |
| Dashboard | ✅ (Bull Board) | ✅ | ❌ |

**Decision**: BullMQ for reliability and scalability.

### Why Railway Native Builds over Docker?

| Factor | Railway Native | Docker |
|--------|----------------|--------|
| Platform compatibility | ✅ No issues | ❌ ARM vs x86 |
| Build speed | Fast | Slow (emulation) |
| Complexity | Simple | More config |
| Reproducibility | Good | Better |

**Decision**: Railway native for simplicity and avoiding platform issues.

---

## Appendix: Architecture Decision Records

### ADR-001: Modular Monolith over Microservices
**Decision**: Start with modular monolith, extract services if needed.
**Rationale**: Simpler to develop, deploy, and debug. Can evolve to microservices.

### ADR-002: TypeScript Full Stack
**Decision**: Use TypeScript for both frontend and backend.
**Rationale**: Type safety, code sharing, single language for team.

### ADR-003: Event-Driven Internal Communication
**Decision**: Use events between domains instead of direct calls.
**Rationale**: Loose coupling, audit trail, easier testing.

### ADR-004: Railway for Backend Hosting
**Decision**: Use Railway with native builds instead of Docker.
**Rationale**: Avoids platform compatibility issues, simpler deployment.

### ADR-005: Vercel for Frontend
**Decision**: Use Vercel for Next.js frontend.
**Rationale**: Native Next.js support, excellent edge performance.

