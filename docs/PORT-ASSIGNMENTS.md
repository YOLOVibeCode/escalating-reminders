# Port Assignments

> **Version**: 2.0.0 (FINAL)  
> **Last Updated**: December 2024  
> **Status**: ✅ **STABLE - These ports are final and will not change**

---

## ⚠️ IMPORTANT: Port Stability

**These port assignments are FINAL and STABLE.** They have been standardized across all code, configuration files, documentation, and tests. **Do not change these ports** without updating ALL references throughout the codebase.

### Port Assignment Policy

- ✅ **All ports are in the 38XX range** - This is intentional and consistent
- ✅ **Ports are standardized** - Same ports used in development, testing, and documentation
- ✅ **No future changes planned** - These assignments are permanent
- ✅ **All references updated** - Code, configs, docs, and tests all use these ports

---

## Overview

All services in the Escalating Reminders monorepo use ports in the **38XX** range to avoid conflicts with other services on development machines. This is a **stable, final assignment** that will not change.

---

## Port Assignment Table

| Port | Service | Environment | Description |
|------|---------|-------------|-------------|
| **3800** | Next.js Web App | Development | Frontend web application |
| **3801** | NestJS API | Development | Backend REST API |
| **3802** | PostgreSQL | Local Docker | Database server |
| **3803** | Redis | Local Docker | Cache and job queue |
| **3804** | Prisma Studio | Development | Database GUI tool |
| **3805** | Storybook | Development | UI component documentation |
| **3806** | BullMQ Dashboard | Development | Job queue monitoring (future) |
| **3807** | Reserved | - | Reserved for future use |
| **3808** | Reserved | - | Reserved for future use |
| **3809** | Reserved | - | Reserved for future use |
| **3810** | MailHog Web UI | Local Docker | Email testing web interface |
| **3811** | MailHog SMTP | Local Docker | Email testing SMTP server |
| **3812** | Webhook Receiver | E2E Testing | Local webhook sink for Playwright integration tests |

---

## Service Details

### 3800 - Next.js Web App

**Service**: Frontend web application  
**Framework**: Next.js 14  
**URL**: `http://localhost:3800`  
**Configuration**: `apps/web/package.json`, `apps/web/next.config.js`

**Usage**:
```bash
cd apps/web
npm run dev
# Access at http://localhost:3800
```

---

### 3801 - NestJS API

**Service**: Backend REST API  
**Framework**: NestJS  
**URL**: `http://localhost:3801`  
**Base Path**: `/v1`  
**Full URL**: `http://localhost:3801/v1`  
**Configuration**: `apps/api/src/main.ts`, `apps/api/.env`

**Usage**:
```bash
cd apps/api
npm run dev
# API available at http://localhost:3801/v1
```

**Health Check**: `http://localhost:3801/health`

---

### 3802 - PostgreSQL

**Service**: PostgreSQL database  
**Version**: PostgreSQL 15+  
**URL**: `postgresql://postgres:postgres@localhost:3802/escalating_reminders`  
**Configuration**: `infrastructure/docker-compose.yml`

**Usage**:
```bash
# Start via Docker Compose
cd infrastructure
docker compose up -d postgres

# Connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:3802/escalating_reminders?schema=public"
```

**Default Credentials** (development only):
- User: `postgres`
- Password: `postgres`
- Database: `escalating_reminders`

---

### 3803 - Redis

**Service**: Redis cache and job queue  
**Version**: Redis 7  
**URL**: `redis://localhost:3803`  
**Configuration**: `infrastructure/docker-compose.yml`

**Usage**:
```bash
# Start via Docker Compose
cd infrastructure
docker compose up -d redis

# Connection string
REDIS_URL="redis://localhost:3803"
```

**Default Configuration**:
- No password (development only)
- Max memory: 256MB
- Persistence: RDB snapshots

---

### 3804 - Prisma Studio

**Service**: Database GUI tool  
**Tool**: Prisma Studio  
**URL**: `http://localhost:3804`  
**Configuration**: `apps/api/prisma/schema.prisma`

**Usage**:
```bash
cd apps/api
npx prisma studio --port 3804
# Access at http://localhost:3804
```

---

### 3805 - Storybook

**Service**: UI component documentation  
**Tool**: Storybook  
**URL**: `http://localhost:3805`  
**Configuration**: `packages/@er/ui-components/.storybook/main.ts`

**Usage**:
```bash
cd packages/@er/ui-components
npm run storybook
# Access at http://localhost:3805
```

---

### 3806 - BullMQ Dashboard (Future)

**Service**: Job queue monitoring dashboard  
**Tool**: BullMQ Dashboard  
**URL**: `http://localhost:3806`  
**Status**: Reserved for future implementation

---

### 3810 - MailHog Web UI

**Service**: Email testing web interface  
**Tool**: MailHog  
**URL**: `http://localhost:3810`  
**Configuration**: `infrastructure/docker-compose.yml`

**Usage**:
```bash
# Start MailHog via Docker Compose
cd infrastructure
docker compose up -d mailhog

# Access web UI at http://localhost:3810
```

**Features**:
- View all captured emails
- Test email templates
- Inspect email headers and content
- Download emails as .eml files

---

### 3811 - MailHog SMTP Server

**Service**: Email testing SMTP server  
**Tool**: MailHog SMTP  
**Host**: `localhost:3811`  
**Configuration**: Use in development `.env` files

**Usage**:
```bash
# Configure in apps/api/.env
SMTP_HOST=localhost
SMTP_PORT=3811
SMTP_USER=  # Not required for MailHog
SMTP_PASSWORD=  # Not required for MailHog
```

**Email Configuration**:
- **Host**: `localhost`
- **Port**: `3811`
- **No authentication required** (development only)
- All emails sent to this server are captured in MailHog UI

---

### 3812 - Webhook Receiver (E2E)

**Service**: Local webhook sink for integration tests  
**Purpose**: Receives outbound webhook agent deliveries during Playwright integration tests  
**URL**: `http://localhost:3812`  
**Default Webhook URL**: `http://localhost:3812/webhook`  
**Configuration**:
- Receiver: `apps/web/e2e/webhook-receiver/server.js`
- Tests: `apps/web/e2e/specs/05-integration.spec.ts`

**Notes**:
- This is **test-only** and runs automatically during Playwright global setup.

---

## Environment Variables

### Frontend (.env)

```bash
# apps/web/.env
NEXT_PUBLIC_API_URL=http://localhost:3801
```

### Backend (.env)

```bash
# apps/api/.env
PORT=3801
DATABASE_URL=postgresql://postgres:postgres@localhost:3802/escalating_reminders?schema=public
REDIS_URL=redis://localhost:3803
```

---

## Docker Compose Configuration

All services are configured in `infrastructure/docker-compose.yml`:

```yaml
services:
  postgres:
    ports:
      - "3802:5432"
  
  redis:
    ports:
      - "3803:6379"
```

---

## Port Conflict Resolution

If you encounter port conflicts:

1. **Check what's using the port**:
   ```bash
   lsof -i :3800  # Check port 3800
   lsof -i :3801  # Check port 3801
   ```

2. **Kill the process** (if safe to do so):
   ```bash
   kill -9 <PID>
   ```

3. **Or use alternative ports**:
   - Update port in service configuration
   - Update this document
   - Update all references

---

## Production Ports

Production services use standard ports:

| Service | Production Port | Provider |
|---------|----------------|----------|
| Web App | 443 (HTTPS) | Vercel (automatic) |
| API | 443 (HTTPS) | Railway (automatic) |
| PostgreSQL | 5432 | Railway/Supabase (managed) |
| Redis | 6379 | Railway/Upstash (managed) |

---

## Quick Reference

```bash
# Start all services
npm run dev              # Starts web (3800) and API (3801)
docker compose up -d     # Starts Postgres (3802) and Redis (3803)

# Access services
Web:      http://localhost:3800
API:      http://localhost:3801/v1
Prisma:   http://localhost:3804
Storybook: http://localhost:3805
MailHog:  http://localhost:3810
```

---

## Port Stability Guarantee

**These port assignments are FINAL and will NOT change.** All code, configuration files, documentation, E2E tests, Docker configurations, and environment variable defaults have been updated to use these ports consistently.

### If You Need Different Ports

If you absolutely must use different ports for local development:

1. **Update ALL references** - Search the codebase for port numbers
2. **Update this document** - Keep PORT-ASSIGNMENTS.md as the source of truth
3. **Update tests** - E2E tests, scripts, and configurations
4. **Update Docker** - Dockerfiles and docker-compose.yml
5. **Update documentation** - All docs that reference ports

**However, we strongly recommend using the standard 38XX ports** to maintain consistency across the team and avoid conflicts.

---

*This document is the authoritative source for all port assignments. These ports are FINAL and STABLE.*

