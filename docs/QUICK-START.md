# Quick Start Guide

> **Port Assignments**: All services use ports in the **38XX** range. See [PORT-ASSIGNMENTS.md](./PORT-ASSIGNMENTS.md) for details.

---

## Prerequisites

- Node.js 20 LTS
- Docker Desktop (for local Postgres/Redis)
- Git
- Railway CLI (optional, for deployment): `npm i -g @railway/cli` or `brew install railway`

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/YOLOVibeCode/escalating-reminders.git
cd escalating-reminders
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Infrastructure (Postgres & Redis)

```bash
cd infrastructure
docker compose up -d
cd ..
```

**Services Started**:
- PostgreSQL: `localhost:3802`
- Redis: `localhost:3803`

### 4. Configure Environment Variables

```bash
# Copy API environment template
cp apps/api/.env.example apps/api/.env

# Copy Web environment template
cp apps/web/.env.example apps/web/.env

# Edit with your values
# At minimum, generate secrets:
# JWT_SECRET: openssl rand -hex 32
# JWT_REFRESH_SECRET: openssl rand -hex 32
# ENCRYPTION_KEY: openssl rand -hex 32
```

### 5. Setup Database

```bash
cd apps/api

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed
```

### 6. Start Development Servers

From the **root directory**:

```bash
# Start both web and API
npm run dev
```

Or start individually:

```bash
# Terminal 1: Web App (port 3800)
cd apps/web
npm run dev

# Terminal 2: API (port 3801)
cd apps/api
npm run start:dev
```

---

## Access Services

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:3800 | Next.js frontend |
| **API** | http://localhost:3801/v1 | REST API |
| **API Docs** | http://localhost:3801/api/docs | Swagger UI |
| **Prisma Studio** | http://localhost:3804 | Database GUI |
| **Storybook** | http://localhost:3805 | UI components |

---

## Port Reference

| Port | Service |
|------|---------|
| 3800 | Next.js Web App |
| 3801 | NestJS API |
| 3802 | PostgreSQL |
| 3803 | Redis |
| 3804 | Prisma Studio |
| 3805 | Storybook |

**Full Documentation**: See [PORT-ASSIGNMENTS.md](./PORT-ASSIGNMENTS.md)

---

## Common Commands

```bash
# Development
npm run dev              # Start web + API
npm run build            # Build all packages
npm run test             # Run all tests
npm run lint             # Lint all code

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio (port 3804)

# Individual services
cd apps/web && npm run dev      # Web only
cd apps/api && npm run start:dev # API only
```

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using a port
lsof -i :3800
lsof -i :3801

# Kill process if needed
kill -9 <PID>
```

### Docker Issues

```bash
# Restart Docker services
cd infrastructure
docker compose down
docker compose up -d

# Check logs
docker compose logs postgres
docker compose logs redis
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -p 3802 -U postgres -d escalating_reminders
```

---

## Next Steps

1. ✅ Complete setup (you are here)
2. Create your first reminder via API
3. Set up notification agents
4. Configure escalation profiles
5. Connect calendar integration

---

*For detailed port documentation, see [PORT-ASSIGNMENTS.md](./PORT-ASSIGNMENTS.md)*

