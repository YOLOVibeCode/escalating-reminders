# Escalating Reminders

> **Smart reminder system that escalates intelligently and knows when to back off.**

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/YOLOVibeCode/escalating-reminders.git
cd escalating-reminders

# Install dependencies
npm install

# Start infrastructure (Postgres & Redis)
cd infrastructure
docker compose up -d
cd ..

# Setup database
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
cd ../..

# Start development servers
npm run dev
```

**Access Services**:
- Web App: http://localhost:3800
- API: http://localhost:3801/v1
- API Docs: http://localhost:3801/api/docs

**Full Guide**: See [docs/QUICK-START.md](docs/QUICK-START.md)

---

## 📋 Port Assignments

> ⚠️ **STABLE & FINAL**: These port assignments are standardized and will not change.

All services use ports in the **38XX** range:

| Port | Service |
|------|---------|
| 3800 | Next.js Web App |
| 3801 | NestJS API |
| 3802 | PostgreSQL |
| 3803 | Redis |
| 3812 | Webhook Receiver (E2E) |
| 3810 | MailHog UI |
| 3811 | MailHog SMTP |

**Full Details**: See [docs/PORT-ASSIGNMENTS.md](docs/PORT-ASSIGNMENTS.md) - **Authoritative source for all port assignments**

---

## 🏗️ Infrastructure

**Production Hosting**:
- **Frontend**: Vercel (Next.js 14)
- **Backend**: Railway (NestJS API, Workers, Scheduler) ✅
- **Database**: Railway PostgreSQL
- **Cache/Queue**: Upstash Redis

**Decision**: Railway selected as backend platform.  
See [docs/architecture/INFRASTRUCTURE-DECISION.md](docs/architecture/INFRASTRUCTURE-DECISION.md) for rationale.

**Complete Documentation**: [docs/PORT-ASSIGNMENTS.md](docs/PORT-ASSIGNMENTS.md)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [SPECIFICATION.md](SPECIFICATION.md) | Master specification overview |
| [docs/QUICK-START.md](docs/QUICK-START.md) | Getting started guide |
| [docs/PORT-ASSIGNMENTS.md](docs/PORT-ASSIGNMENTS.md) | **All port assignments** |
| [docs/architecture/](docs/architecture/) | Detailed architecture specs |

---

## 🏗️ Project Structure

```
escalating-reminders/
├── apps/
│   ├── api/              # NestJS API (port 3801)
│   └── web/              # Next.js App (port 3800)
├── packages/
│   ├── @er/interfaces/   # All interfaces (ISP)
│   ├── @er/types/        # Shared types (Prisma source)
│   ├── @er/constants/    # Constants & configs
│   ├── @er/utils/        # Utilities
│   ├── @er/ui-components/# React components
│   └── @er/api-client/   # Type-safe API client
├── infrastructure/       # Docker Compose
└── docs/                 # Documentation
```

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeScript, Prisma
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7, BullMQ
- **Monorepo**: Turborepo, npm workspaces

---

## 📖 Key Features

- ✅ Escalating notifications (multi-tier)
- ✅ Multi-channel delivery (SMS, Email, Webhooks)
- ✅ Natural language snooze
- ✅ Email watchers (auto-completion)
- ✅ Calendar integration
- ✅ Social escalation (trusted contacts)
- ✅ Agent SDK (open source)
- ✅ In-app Feedback button on every page (Noctusoft feedback widget, no setup)

---

## 🔐 Development Standards

- **TDD**: Test-Driven Development (100% coverage)
- **ISP**: Interface Segregation Principle
- **Prisma-First**: Database schema is source of truth
- **Swagger-First**: API documentation before implementation

---

## 📝 License

MIT

---

**Repository**: [YOLOVibeCode/escalating-reminders](https://github.com/YOLOVibeCode/escalating-reminders)

