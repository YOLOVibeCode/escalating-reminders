# Port Assignments

> **Version**: 1.0.0  
> **Last Updated**: December 2024

---

## Overview

All services in the Escalating Reminders monorepo use ports in the **38XX** range to avoid conflicts with other services on development machines.

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
npm run start:dev
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
```

---

*This document should be updated whenever port assignments change.*

