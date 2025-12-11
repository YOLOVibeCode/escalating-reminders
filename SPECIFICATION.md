# Escalating Reminders - Master Specification

> **Version**: 1.0.0  
> **Last Updated**: December 2024  
> **Status**: Draft

---

## Repository

| Item | Value |
|------|-------|
| **GitHub Repository** | [https://github.com/YOLOVibeCode/escalating-reminders.git](https://github.com/YOLOVibeCode/escalating-reminders) |
| **Organization** | YOLOVibeCode |
| **Visibility** | Public |

### Clone & Setup

```bash
# Clone repository
git clone https://github.com/YOLOVibeCode/escalating-reminders.git
cd escalating-reminders

# Or if GitHub CLI is configured
gh repo clone YOLOVibeCode/escalating-reminders
```

---

## Source of Truth

> ⚠️ **IMPORTANT**: Keep it simple. One source of truth.

### Prisma Schema = THE Source of Truth

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SINGLE SOURCE OF TRUTH                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                     prisma/schema.prisma                                │
│                            │                                             │
│                            │ npx prisma generate                        │
│                            ▼                                             │
│                    ┌───────────────┐                                    │
│                    │ Prisma Client │                                    │
│                    │    Types      │                                    │
│                    └───────┬───────┘                                    │
│                            │                                             │
│            ┌───────────────┼───────────────┐                            │
│            ▼               ▼               ▼                            │
│      @er/types        API DTOs       Frontend Types                     │
│                                                                          │
│   ALL TYPES FLOW FROM PRISMA SCHEMA                                     │
│   No duplication. No drift. One truth.                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Rules:**
1. **Database schema changes** → Edit `schema.prisma` first
2. **New entity types** → Add to Prisma, generate, export
3. **API types** → Derive from Prisma types (DTOs wrap Prisma types)
4. **Frontend types** → Import from shared package (sourced from Prisma)

**What Prisma Generates:**
- All entity types (User, Reminder, etc.)
- All enum types (ReminderStatus, SubscriptionTier, etc.)
- Input types for create/update operations
- Relation types

**What We Define Manually:**
- API request/response wrapper types
- Domain-specific DTOs (thin wrappers around Prisma types)
- Interface contracts (behavioral, not data)

---

## Table of Contents

1. [Vision & Goals](#vision--goals)
2. [Problem Statement](#problem-statement)
3. [Core Features](#core-features)
4. [User Stories](#user-stories)
5. [Architecture Overview](#architecture-overview)
6. [Tech Stack](#tech-stack)
7. [Project Structure](#project-structure)
8. [Specification Documents](#specification-documents)
9. [MVP Scope](#mvp-scope)
10. [Future Roadmap](#future-roadmap)

---

## Vision & Goals

### Vision
Build a smart reminder system that doesn't just nag—it **escalates intelligently** and **knows when to back off**. The system learns user patterns, integrates with multiple notification channels, and automatically detects task completion.

### Goals
1. **Never Miss Critical Reminders**: Escalate notifications through multiple channels until acknowledged
2. **Intelligent Awareness**: Auto-dismiss reminders when completion is detected (email watchers)
3. **Flexible Delivery**: Support multiple notification agents (SMS, Email, Apple Watch, Alexa, Webhooks)
4. **Social Escalation**: Notify trusted contacts when urgency is critical
5. **Context-Aware Scheduling**: Integrate with calendars and understand schedule patterns
6. **Natural Interaction**: Support natural language snooze ("until next Friday")
7. **Extensibility**: Open SDK for community-built notification agents

---

## Problem Statement

Current reminder apps are binary—they either remind you or they don't. They lack:

- **Escalation**: No way to increase urgency over time
- **Multi-channel delivery**: Stuck to one notification method
- **Completion detection**: Keep reminding even after task is done
- **Social backup**: No way to involve trusted contacts
- **Schedule awareness**: Don't understand context (holidays, custody schedules)

**Escalating Reminders** solves these problems by providing an intelligent, multi-channel, context-aware reminder system.

---

## Core Features

### 1. Escalating Notifications
Reminders that increase in urgency and reach based on configurable escalation profiles.

| Tier | Behavior | Example |
|------|----------|---------|
| 1 | Single channel, gentle | Push notification |
| 2 | Multi-channel | Push + SMS |
| 3 | Aggressive | All channels + sound |
| 4 | Social | Notify trusted contacts |
| 5 | Emergency | Repeated alerts to all |

### 2. Notification Agents
Pluggable notification delivery system with both push and pull modes.

**Official Agents:**
- Email Agent
- SMS Agent (Twilio)
- Web Push Agent
- Webhook Agent (Zapier/Make/n8n)
- Apple Watch Agent
- Alexa Agent

**Agent Capabilities:**
- Push: System sends notification to agent
- Pull: External systems poll for pending notifications
- Command: Agents can send actions (snooze, dismiss, complete)

### 3. Event Watchers
Monitor external systems for completion events.

**Watcher Types:**
- Email Watcher (IMAP, Gmail API, Microsoft Graph)
- SMS Watcher (Twilio incoming)
- Webhook Watcher (external systems notify us)
- API Polling Watcher

**AI-Assisted Configuration:**
- Guided setup wizard
- Pattern detection suggestions
- Natural language rule definition

### 4. Calendar Integration
Smart scheduling based on calendar events.

**Capabilities:**
- Connect Google Calendar, Outlook, Apple Calendar
- Label/tag-based schedule rules
- Holiday detection and pre-adjustment
- Custody schedule awareness

### 5. Natural Language Snooze
Flexible snooze with natural language parsing.

**Supported Formats:**
- "until next Friday"
- "for 3 days"
- "until December 25th"
- "until 9am tomorrow"
- "until my kids are back" (calendar lookup)

### 6. Social Escalation
Notify trusted contacts when reminders reach critical escalation tiers.

**Features:**
- Define trusted contacts with relationships
- Per-reminder contact assignment
- Configurable escalation triggers
- Contact notification preferences

### 7. Learning & Intelligence
Simple rule-based learning that adapts to patterns.

**Capabilities:**
- Track completion patterns
- Suggest schedule adjustments
- Holiday awareness
- Usage analytics

---

## User Stories

### Registration & Onboarding
- As a user, I can register with email/password or OAuth
- As a user, I complete an onboarding wizard to set up my first reminder
- As a user, I can subscribe to a paid plan via Square

### Reminder Management
- As a user, I can create reminders with title, schedule, and importance
- As a user, I can choose an escalation profile for each reminder
- As a user, I can define completion criteria (manual, email watcher, webhook)
- As a user, I can snooze reminders using natural language

### Notification Agents
- As a user, I can subscribe to notification agents from the marketplace
- As a user, I can configure agent credentials (API keys, phone numbers)
- As a user, I can test agent delivery
- As a developer, I can build custom agents using the SDK

### Calendar Integration
- As a user, I can connect my calendar accounts
- As a user, I can define label-based schedule rules
- As a user, reminders auto-adjust around holidays

### Social Escalation
- As a user, I can add trusted contacts
- As a user, I can assign contacts to specific reminders
- As a trusted contact, I receive notifications when escalation triggers

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ESCALATING REMINDERS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐        ┌──────────────────────────────────────────────┐ │
│   │   Web App    │        │              BACKEND API                      │ │
│   │   (Next.js)  │───────▶│                                              │ │
│   │   [Vercel]   │        │  ┌─────────┐ ┌─────────┐ ┌────────────────┐ │ │
│   └──────────────┘        │  │  Auth   │ │Reminders│ │  Escalation    │ │ │
│                           │  │ Service │ │ Service │ │    Engine      │ │ │
│   ┌──────────────┐        │  └─────────┘ └─────────┘ └────────────────┘ │ │
│   │   External   │        │                                              │ │
│   │   Clients    │───────▶│  ┌─────────┐ ┌─────────┐ ┌────────────────┐ │ │
│   │ (Zapier/API) │        │  │ Billing │ │ Agents  │ │   Watchers     │ │ │
│   └──────────────┘        │  │ Service │ │ Service │ │   Service      │ │ │
│                           │  └─────────┘ └─────────┘ └────────────────┘ │ │
│                           │                                              │ │
│                           │  [NestJS/Express - Railway]                  │ │
│                           └──────────────────────────────────────────────┘ │
│                                           │                                 │
│                                           ▼                                 │
│   ┌──────────────────────────────────────────────────────────────────────┐ │
│   │                         BACKGROUND WORKERS                            │ │
│   │                                                                       │ │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐ │ │
│   │   │  Scheduler  │    │  Workers    │    │    Email Poller         │ │ │
│   │   │ (BullMQ)    │    │  (BullMQ)   │    │    (Watcher Jobs)       │ │ │
│   │   └─────────────┘    └─────────────┘    └─────────────────────────┘ │ │
│   │                                                                       │ │
│   │   [Railway - Separate Services]                                       │ │
│   └──────────────────────────────────────────────────────────────────────┘ │
│                                           │                                 │
│                                           ▼                                 │
│   ┌──────────────────────────────────────────────────────────────────────┐ │
│   │                         DATA LAYER                                    │ │
│   │                                                                       │ │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐ │ │
│   │   │ PostgreSQL  │    │    Redis    │    │    Object Storage       │ │ │
│   │   │ (Supabase)  │    │  (Upstash)  │    │   (Cloudflare R2)       │ │ │
│   │   └─────────────┘    └─────────────┘    └─────────────────────────┘ │ │
│   └──────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Event-Driven Architecture
All components communicate through domain events for loose coupling.

See: [docs/architecture/EVENT-SYSTEM.md](docs/architecture/EVENT-SYSTEM.md)

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Shadcn/ui | Component library (MIT License) |
| TanStack Table | Data grids and tables (MIT License) |
| Next.js + shadcn Admin Dashboard | Starting template for dashboard UI |
| React Query | Server state management |
| Zustand | Client state management |

**See**: [UI-THEME-SPECIFICATION.md](docs/architecture/UI-THEME-SPECIFICATION.md) for detailed UI/theme specifications.

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 20 LTS | Runtime |
| NestJS | API framework (or Express) |
| TypeScript | Type safety |
| Prisma | ORM |
| Zod | Validation |
| BullMQ | Job queues and scheduling |

### Infrastructure
| Technology | Purpose | Decision |
|------------|---------|----------|
| Vercel | Frontend hosting | ✅ Selected |
| Railway | Backend hosting (native builds) | ✅ Selected |
| PostgreSQL | Primary database | ✅ Railway PostgreSQL (primary), Supabase (alternative) |
| Redis | Queues and caching | ✅ Upstash (primary), Railway Redis (alternative) |
| Cloudflare R2 | Object storage | Future (if needed) |

**See**: [INFRASTRUCTURE-DECISION.md](docs/architecture/INFRASTRUCTURE-DECISION.md) for full rationale.

### External Services
| Service | Purpose |
|---------|---------|
| Square | Subscription billing |
| Twilio | SMS notifications |
| SendGrid | Transactional email |
| OpenAI | Natural language processing |
| Google Calendar API | Calendar integration |
| Microsoft Graph | Outlook/O365 integration |

---

## Project Structure

```
escalating-reminders/
│
├── apps/
│   ├── api/                          # Backend API
│   │   ├── src/
│   │   │   ├── main.ts               # Entry point
│   │   │   ├── app.module.ts         # Root module
│   │   │   ├── domains/              # Domain modules
│   │   │   │   ├── auth/
│   │   │   │   ├── billing/
│   │   │   │   ├── reminders/
│   │   │   │   ├── escalation/
│   │   │   │   ├── agents/
│   │   │   │   ├── watchers/
│   │   │   │   ├── calendar/
│   │   │   │   └── notifications/
│   │   │   ├── infrastructure/       # External services
│   │   │   ├── workers/              # Background jobs
│   │   │   └── events/               # Event definitions
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── package.json
│   │   └── railway.json
│   │
│   └── web/                          # Frontend
│       ├── src/
│       │   ├── app/                  # Next.js App Router
│       │   ├── components/
│       │   ├── hooks/
│       │   └── services/
│       ├── package.json
│       └── vercel.json
│
├── packages/
│   ├── agent-sdk/                    # Open source Agent SDK
│   │   ├── src/
│   │   ├── templates/
│   │   └── package.json
│   │
│   ├── shared-types/                 # Shared TypeScript types
│   │   └── src/
│   │
│   └── shared-utils/                 # Shared utilities
│       └── src/
│
├── agents/                           # Official agents
│   ├── email-agent/
│   ├── sms-agent/
│   ├── webhook-agent/
│   ├── web-push-agent/
│   ├── apple-watch-agent/
│   └── alexa-agent/
│
├── infrastructure/
│   └── docker-compose.yml            # Local development only
│
├── docs/
│   ├── requirements.txt
│   └── architecture/
│       ├── ARCHITECTURE.md
│       ├── DOMAIN-MODEL.md
│       ├── API-DESIGN.md
│       ├── DATABASE-SCHEMA.md
│       ├── EVENT-SYSTEM.md
│       ├── AGENT-SDK.md
│       ├── SECURITY.md
│       └── INFRASTRUCTURE.md
│
├── _Resources/
│   └── scripts/
│
├── SPECIFICATION.md                  # This file
├── package.json                      # Monorepo root
└── turbo.json                        # Turborepo config
```

---

## UI Theme & Components

The application uses **shadcn/ui** as the component library with a **Next.js + shadcn Admin Dashboard** template as the starting point.

### Why This Stack?

- ✅ **Open Source**: shadcn/ui is MIT licensed, fully open source
- ✅ **Perfect Fit**: Built for Next.js 14 + Tailwind CSS (our exact stack)
- ✅ **Production Ready**: Admin dashboard template provides proven patterns
- ✅ **Customizable**: Components copied to codebase, full control
- ✅ **Accessible**: Built on Radix UI primitives (WCAG compliant)
- ✅ **TypeScript**: Full type safety

**Full Specification**: See [docs/architecture/UI-THEME-SPECIFICATION.md](docs/architecture/UI-THEME-SPECIFICATION.md)

---

## Specification Documents

Detailed specifications are in `docs/architecture/`:

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) | System architecture and design decisions |
| [DOMAIN-MODEL.md](docs/architecture/DOMAIN-MODEL.md) | Domain entities, relationships, aggregates |
| [API-DESIGN.md](docs/architecture/API-DESIGN.md) | REST API contracts and endpoints |
| [DATABASE-SCHEMA.md](docs/architecture/DATABASE-SCHEMA.md) | Database tables, indexes, relationships |
| [EVENT-SYSTEM.md](docs/architecture/EVENT-SYSTEM.md) | Domain events and handlers |
| [AGENT-SDK.md](docs/architecture/AGENT-SDK.md) | Agent interface, SDK, marketplace |
| [AGENT-SPECIFICATION.md](docs/specifications/AGENT-SPECIFICATION.md) | **Formal agent protocol spec for third-party developers** |
| [sample-webhook-agent](examples/sample-webhook-agent/) | **Working sample agent implementation** |
| [SECURITY.md](docs/architecture/SECURITY.md) | Authentication, authorization, encryption |
| [INFRASTRUCTURE.md](docs/architecture/INFRASTRUCTURE.md) | Deployment, hosting, CI/CD |
| [DEVELOPMENT-STANDARDS.md](docs/architecture/DEVELOPMENT-STANDARDS.md) | TDD, ISP, TypeScript standards, naming conventions |
| [PROJECT-SETUP.md](docs/architecture/PROJECT-SETUP.md) | Monorepo configuration, package setup, CI/CD |
| [IMPLEMENTATION-DETAILS.md](docs/architecture/IMPLEMENTATION-DETAILS.md) | Environment config, templates, integrations |

## Quick Reference

| Document | Purpose |
|----------|---------|
| [PORT-ASSIGNMENTS.md](docs/PORT-ASSIGNMENTS.md) | **All port assignments (38XX range)** |
| [QUICK-START.md](docs/QUICK-START.md) | Getting started guide |

---

## MVP Scope

### Phase 1: Core (MVP)
- [ ] User registration and authentication
- [ ] Square subscription billing (Free, Personal, Pro tiers)
- [ ] Reminder CRUD with scheduling
- [ ] Basic escalation engine (3 tiers)
- [ ] 3 notification agents: Email, SMS, Webhook
- [ ] Natural language snooze
- [ ] Simple email watcher (completion detection)

### Phase 2: Intelligence
- [ ] Calendar integration (Google, Outlook)
- [ ] Label-based schedule rules
- [ ] Holiday detection
- [ ] Advanced escalation profiles
- [ ] Social escalation (trusted contacts)

### Phase 3: Ecosystem
- [ ] Agent SDK (open source)
- [ ] Agent marketplace
- [ ] Apple Watch agent
- [ ] Alexa agent
- [ ] Community agents

### Phase 4: Enterprise
- [ ] Team/family plans
- [ ] Shared reminders
- [ ] Admin dashboard
- [ ] API for developers
- [ ] Compliance features

---

## Future Roadmap

### Potential Features
- Mobile apps (iOS, Android)
- Voice assistant integration beyond Alexa
- AI-powered schedule optimization
- Integration with task management tools
- Gamification elements
- Analytics dashboard

### Technology Evolution
- Consider GraphQL subscriptions for real-time
- Evaluate WebSocket for live updates
- ML-based completion prediction
- Multi-region deployment

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| **Reminder** | A scheduled notification with escalation rules |
| **Escalation Profile** | Configuration defining how reminders escalate |
| **Notification Agent** | A pluggable delivery channel (SMS, Email, etc.) |
| **Watcher** | A monitor for external completion events |
| **Trusted Contact** | A person who receives social escalation alerts |
| **Snooze** | Temporarily postpone a reminder |

### References
- [BullMQ Documentation](https://docs.bullmq.io/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Square API Reference](https://developer.squareup.com/reference)
- [Twilio API Reference](https://www.twilio.com/docs)

---

*This specification is a living document and will be updated as the project evolves.*

