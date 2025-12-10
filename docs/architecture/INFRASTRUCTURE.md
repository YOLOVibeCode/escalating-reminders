# Infrastructure Specification

> **Version**: 1.0.0  
> **Last Updated**: December 2024

---

## Repository

| Item | Value |
|------|-------|
| **GitHub Repository** | [https://github.com/YOLOVibeCode/escalating-reminders.git](https://github.com/YOLOVibeCode/escalating-reminders) |
| **Organization** | YOLOVibeCode |
| **Default Branch** | main |

---

## Overview

This document defines the infrastructure, deployment, and operational requirements for Escalating Reminders.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION INFRASTRUCTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   VERCEL                                 RAILWAY                            │
│   ──────                                 ───────                            │
│   ┌─────────────────────┐                ┌─────────────────────────────┐   │
│   │    Next.js Web      │───REST API────▶│     API Service (NestJS)    │   │
│   │    (Frontend)       │                │                             │   │
│   │                     │                │     Worker Service          │   │
│   │  • Edge CDN         │                │                             │   │
│   │  • SSL automatic    │                │     Scheduler Service       │   │
│   │  • Preview deploys  │                │     (singleton)             │   │
│   └─────────────────────┘                │                             │   │
│                                          │     PostgreSQL              │   │
│                                          │     Redis                   │   │
│                                          └─────────────────────────────┘   │
│                                                                              │
│   EXTERNAL SERVICES                                                         │
│   ─────────────────                                                         │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│   │ Square  │ │ Twilio  │ │SendGrid │ │ OpenAI  │ │ Sentry  │            │
│   │Payments │ │  SMS    │ │  Email  │ │   AI    │ │ Errors  │            │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Hosting Providers

> **Decision**: Railway selected as backend hosting platform.  
> See [INFRASTRUCTURE-DECISION.md](INFRASTRUCTURE-DECISION.md) for full rationale.

### Frontend: Vercel

| Aspect | Configuration |
|--------|---------------|
| **Platform** | Vercel |
| **Framework** | Next.js 14 |
| **Build** | Automatic from GitHub |
| **Domain** | escalating-reminders.com |
| **SSL** | Automatic (Let's Encrypt) |
| **CDN** | Vercel Edge Network |
| **Environment** | Production, Preview (per PR) |

### Backend: Railway ✅ (Final Decision)

| Aspect | Configuration |
|--------|---------------|
| **Platform** | Railway |
| **Build Type** | Nixpacks (native, no Docker) |
| **Services** | API, Worker, Scheduler |
| **Scaling** | Automatic |
| **Region** | US West |
| **Cost (MVP)** | $20-50/month |
| **Decision Date** | December 2024 |
| **Rationale** | See [INFRASTRUCTURE-DECISION.md](INFRASTRUCTURE-DECISION.md) |

---

## Railway Services Configuration

### API Service

```toml
# apps/api/railway.toml

[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run start:prod"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5

[service]
internalPort = 3801
```

### Worker Service

```toml
# apps/api/railway.worker.toml

[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run start:worker"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
numReplicas = 2
```

### Scheduler Service

```toml
# apps/api/railway.scheduler.toml

[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run start:scheduler"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5
numReplicas = 1  # MUST be exactly 1 (singleton)
```

---

## Database Configuration

### PostgreSQL: Railway PostgreSQL (Primary) ✅

**Decision**: Railway PostgreSQL selected as primary database.

**Alternative**: Supabase (if connection pooling needed)

| Setting | Value |
|---------|-------|
| Version | PostgreSQL 15 |
| Connection Pooling | PgBouncer (if Supabase) |
| Max Connections | 100 |
| Backups | Daily automatic |
| Point-in-Time Recovery | 7 days |

### Connection String Format

```bash
# Direct connection (migrations)
DATABASE_URL="postgresql://user:pass@host:5432/escalating_reminders?sslmode=require"

# Pooled connection (application)
DATABASE_URL_POOLED="postgresql://user:pass@host:6543/escalating_reminders?sslmode=require&pgbouncer=true"
```

### Redis: Upstash (Primary) ✅

**Decision**: Upstash Redis selected for cache and queues.

**Alternative**: Railway Redis plugin (if preferred)

| Setting | Value |
|---------|-------|
| Version | Redis 7 |
| Max Memory | 256MB (starter) |
| Eviction Policy | volatile-lru |
| Persistence | RDB snapshots |

```bash
REDIS_URL="redis://default:pass@host:6379"
```

---

## Environment Variables

### API Service

```bash
# Application
NODE_ENV=production
PORT=3801
API_URL=https://api.escalating-reminders.com

# Database
DATABASE_URL=postgresql://...
DATABASE_URL_POOLED=postgresql://...

# Redis
REDIS_URL=redis://...

# Authentication
JWT_SECRET=<32-byte-hex>
JWT_REFRESH_SECRET=<32-byte-hex>

# Encryption
ENCRYPTION_KEY=<32-byte-hex>

# External Services
SQUARE_ACCESS_TOKEN=<token>
SQUARE_ENVIRONMENT=production
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE_NUMBER=+1...
SENDGRID_API_KEY=<key>
OPENAI_API_KEY=<key>

# Monitoring
SENTRY_DSN=https://...

# Feature Flags (optional)
FEATURE_SOCIAL_ESCALATION=true
FEATURE_MARKETPLACE=false
```

### Frontend (Vercel)

```bash
# API Connection
NEXT_PUBLIC_API_URL=https://api.escalating-reminders.com

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=<key>

# Feature Flags
NEXT_PUBLIC_FEATURE_MARKETPLACE=false
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Test
        run: npm run test
      
      - name: Build
        run: npm run build

  deploy-staging:
    needs: lint-and-test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to Railway (Staging)
        uses: railway/deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api-staging

  deploy-production:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to Railway (Production)
        uses: railway/deploy@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api-production
```

### Deployment Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT FLOW                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   DEVELOPMENT                                                             │
│   ───────────                                                             │
│   git push origin feature/xxx                                            │
│        │                                                                  │
│        ▼                                                                  │
│   GitHub Actions: lint, test, build                                      │
│        │                                                                  │
│        ▼                                                                  │
│   Vercel: Preview deployment (per PR)                                    │
│                                                                           │
│   STAGING                                                                 │
│   ───────                                                                 │
│   git push origin develop                                                │
│        │                                                                  │
│        ▼                                                                  │
│   GitHub Actions: lint, test, build, deploy                              │
│        │                                                                  │
│        ├──▶ Railway: staging environment                                │
│        │                                                                  │
│        └──▶ Vercel: staging deployment                                  │
│                                                                           │
│   PRODUCTION                                                              │
│   ──────────                                                              │
│   git push origin main (or merge PR)                                     │
│        │                                                                  │
│        ▼                                                                  │
│   GitHub Actions: lint, test, build, deploy                              │
│        │                                                                  │
│        ├──▶ Railway: production environment                             │
│        │                                                                  │
│        └──▶ Vercel: production deployment                               │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Local Development Setup

### Prerequisites

- Node.js 20 LTS
- Docker (for local Postgres/Redis only)
- Git

### Setup Steps

```bash
# 1. Clone repository
git clone https://github.com/your-org/escalating-reminders.git
cd escalating-reminders

# 2. Install dependencies
npm install

# 3. Start infrastructure (Postgres, Redis)
cd infrastructure
docker compose up -d
cd ..

# 4. Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Note: Ports are configured in 38XX range:
# - Web: 3800
# - API: 3801
# - Postgres: 3802
# - Redis: 3803

# 5. Run database migrations
cd apps/api
npx prisma migrate dev
npx prisma db seed
cd ..

# 6. Start development servers
npm run dev  # Starts both API and Web
```

### Local Docker Compose

```yaml
# infrastructure/docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "3802:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: escalating_reminders
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "3803:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

---

## Monitoring & Observability

### Error Tracking: Sentry

```typescript
// apps/api/src/main.ts

import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
});

// Capture unhandled errors
app.useGlobalFilters(new SentryExceptionFilter());
```

### Logging: Structured JSON

```typescript
// apps/api/src/infrastructure/logger.ts

import { Logger } from '@nestjs/common';

export class StructuredLogger extends Logger {
  log(message: string, context?: object) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      ...context,
      timestamp: new Date().toISOString(),
    }));
  }

  error(message: string, trace?: string, context?: object) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      trace,
      ...context,
      timestamp: new Date().toISOString(),
    }));
  }
}
```

### Health Checks

```typescript
// apps/api/src/health/health.controller.ts

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
    ]);
  }

  @Get('ready')
  ready() {
    return { status: 'ready' };
  }
}
```

### Uptime Monitoring

| Service | Monitor |
|---------|---------|
| API | Better Uptime, Pingdom |
| Web | Vercel Analytics |
| Database | Supabase dashboard |
| Redis | Upstash dashboard |

---

## Scaling Strategy

### Horizontal Scaling

| Component | Strategy | Trigger |
|-----------|----------|---------|
| API | Auto-scale replicas | CPU > 70%, Memory > 80% |
| Workers | Manual scale | Queue depth > 1000 |
| Scheduler | Single instance | N/A (singleton) |

### Vertical Scaling

| Component | Initial | Scale Up To |
|-----------|---------|-------------|
| API | 512MB RAM | 2GB RAM |
| Workers | 512MB RAM | 2GB RAM |
| Database | Hobby (500MB) | Pro (4GB) |
| Redis | 256MB | 1GB |

---

## Backup & Recovery

### Database Backups

| Type | Frequency | Retention |
|------|-----------|-----------|
| Full backup | Daily | 7 days |
| Point-in-time recovery | Continuous | 7 days |
| Manual snapshot | Before major changes | 30 days |

### Recovery Procedures

```bash
# Restore from backup (Supabase)
# Use Supabase dashboard for point-in-time recovery

# Restore from backup (Railway PostgreSQL)
railway run pg_restore --dbname=$DATABASE_URL backup.dump
```

---

## Cost Estimation

### Starter (0-1,000 users)

| Service | Provider | Cost/Month |
|---------|----------|------------|
| Frontend | Vercel Pro | $20 |
| API + Workers | Railway | $20-40 |
| PostgreSQL | Railway / Supabase | $7-25 |
| Redis | Railway / Upstash | $5-10 |
| Error tracking | Sentry (free tier) | $0 |
| **Total** | | **~$52-95** |

### Growth (1,000-10,000 users)

| Service | Provider | Cost/Month |
|---------|----------|------------|
| Frontend | Vercel Pro | $20 |
| API + Workers | Railway | $100-200 |
| PostgreSQL | Supabase Pro | $75 |
| Redis | Upstash Pro | $50 |
| Error tracking | Sentry Team | $50 |
| **Total** | | **~$295-395** |

### Scale (10,000+ users)

| Service | Provider | Cost/Month |
|---------|----------|------------|
| Frontend | Vercel Enterprise | Custom |
| API + Workers | Railway | $300-500 |
| PostgreSQL | Supabase Pro | $150+ |
| Redis | Upstash | $100+ |
| Error tracking | Sentry Business | $100+ |
| **Total** | | **~$700+** |

---

## Security Considerations

See [SECURITY.md](SECURITY.md) for full security specification.

### Key Infrastructure Security

- All services communicate over TLS
- Database connections require SSL
- Environment variables stored in Railway/Vercel secrets
- API keys rotated quarterly
- Automatic security patches via Dependabot

---

## Disaster Recovery

### Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| API outage | 5 minutes | 0 (stateless) |
| Database corruption | 1 hour | 5 minutes (PITR) |
| Complete datacenter failure | 4 hours | 24 hours |

### Failover Procedures

1. **API Down**: Railway auto-restarts failed services
2. **Database Down**: Failover to replica (Supabase handles)
3. **Redis Down**: Graceful degradation, rebuild from DB
4. **Complete Outage**: Restore from backups in new region

---

## Runbook: Common Operations

### Deploy New Version

```bash
# Merge to main branch triggers automatic deployment
git checkout main
git merge develop
git push origin main

# Monitor deployment
railway logs -f
```

### Database Migration

```bash
# Generate migration
npx prisma migrate dev --name add_new_field

# Apply to production
railway run npx prisma migrate deploy
```

### Scale Workers

```bash
# Via Railway CLI
railway service update worker --replicas 5

# Or via Railway dashboard
```

### Rotate Secrets

```bash
# Generate new secret
openssl rand -hex 32

# Update in Railway
railway variables set JWT_SECRET=<new_secret>

# Restart services
railway redeploy
```

---

*Infrastructure configuration should be reviewed quarterly and updated as the system scales.*

