# Infrastructure Setup Guide

> **Docker + MailHog + BuildKit Setup**  
> **All ports use 38XX series**

---

## Prerequisites

- Docker Desktop (with BuildKit enabled)
- Docker Compose v2+
- Make (optional, for convenience commands)

---

## Quick Start

### 1. Start Infrastructure Services

```bash
cd infrastructure

# Option 1: Use Makefile (recommended)
make up

# Option 2: Use Docker Compose directly
docker compose up -d
```

### 2. Verify Services Are Running

```bash
# Check status
make ps
# or
docker compose ps

# Check health
make health
```

### 3. Access Services

| Service | URL | Description |
|---------|-----|-------------|
| PostgreSQL | `localhost:3802` | Database |
| Redis | `localhost:3803` | Cache/Queue |
| MailHog UI | `http://localhost:3810` | Email testing interface |
| MailHog SMTP | `localhost:3811` | SMTP server for testing |

---

## MailHog Setup

### What is MailHog?

MailHog is an email testing tool that captures emails sent during development. Instead of sending real emails, all emails are captured and can be viewed in a web interface.

### Configuration

#### For API (NestJS)

Add to `apps/api/.env`:

```bash
# MailHog SMTP Configuration (Development)
SMTP_HOST=localhost
SMTP_PORT=3811
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@escalating-reminders.local
SMTP_SECURE=false
```

#### For Email Service Integration

When configuring email sending in your application:

```typescript
// Example: Using nodemailer with MailHog
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '3811'),
  secure: false, // MailHog doesn't use TLS
});
```

### Using MailHog

1. **Start MailHog**:
   ```bash
   cd infrastructure
   docker compose up -d mailhog
   ```

2. **Send Emails**: Any email sent through your app will be captured

3. **View Emails**: Open `http://localhost:3810` in your browser

4. **Features**:
   - View all captured emails
   - Inspect HTML/text content
   - Check headers and metadata
   - Download emails as .eml files
   - Search emails
   - Delete emails

---

## Docker BuildKit

BuildKit is enabled by default for faster, cached builds.

### Enable BuildKit (if not already enabled)

```bash
# In your shell profile (~/.zshrc or ~/.bashrc)
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

### Build Images

```bash
# Build API image
DOCKER_BUILDKIT=1 docker build -f infrastructure/Dockerfile.api -t er-api:latest .

# Build Web image
DOCKER_BUILDKIT=1 docker build -f infrastructure/Dockerfile.web -t er-web:latest .

# Or use Makefile
make build
```

---

## Port Assignments (38XX Series)

| Port | Service | Purpose |
|------|---------|---------|
| 3800 | Web App | Next.js frontend |
| 3801 | API | NestJS backend |
| 3802 | PostgreSQL | Database |
| 3803 | Redis | Cache/Queue |
| 3804 | Prisma Studio | DB GUI |
| 3805 | Storybook | Component docs |
| 3806 | BullMQ Dashboard | Queue monitoring (future) |
| 3810 | MailHog UI | Email testing web interface |
| 3811 | MailHog SMTP | Email testing SMTP server |

**See**: [docs/PORT-ASSIGNMENTS.md](../docs/PORT-ASSIGNMENTS.md) for complete list

---

## Makefile Commands

```bash
make up          # Start all services
make down        # Stop all services
make restart     # Restart all services
make logs        # Show logs (follow mode)
make ps          # Show running containers
make clean       # Remove containers and volumes
make build       # Build Docker images (with BuildKit)
make mailhog     # Open MailHog web UI in browser
make health      # Check health of all services

# Service-specific
make postgres    # Start only PostgreSQL
make redis       # Start only Redis
make mailhog-service  # Start only MailHog
```

---

## Development Workflow

### 1. Start Infrastructure

```bash
cd infrastructure
make up
```

### 2. Configure Environment

Copy example env files and configure:

```bash
# API
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env and set:
# - DATABASE_URL (uses port 3802)
# - REDIS_URL (uses port 3803)
# - SMTP_HOST=localhost
# - SMTP_PORT=3811
```

### 3. Run Database Migrations

```bash
cd apps/api
npx prisma migrate dev
```

### 4. Start Application Services

```bash
# Terminal 1: API
cd apps/api
npm run dev

# Terminal 2: Web
cd apps/web
npm run dev
```

### 5. Test Email Sending

1. Trigger an email from your app
2. Open `http://localhost:3810` to view captured email
3. Inspect email content, headers, etc.

---

## Troubleshooting

### MailHog Not Starting

```bash
# Check logs
docker compose logs mailhog

# Restart MailHog
docker compose restart mailhog

# Check if port is available
lsof -i :3810
lsof -i :3811
```

### Emails Not Being Captured

1. Verify MailHog is running: `docker compose ps`
2. Check SMTP configuration in `.env`
3. Verify port 3811: `telnet localhost 3811`
4. Check application logs for SMTP errors

### BuildKit Not Working

```bash
# Verify BuildKit is enabled
docker buildx version

# Enable BuildKit explicitly
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

### Port Conflicts

If a port is already in use:

```bash
# Find what's using the port
lsof -i :3810

# Kill the process or change port in docker-compose.yml
```

---

## Production Notes

⚠️ **MailHog is for DEVELOPMENT ONLY**

In production:
- Use real SMTP service (SendGrid, AWS SES, Postmark, etc.)
- Configure production SMTP credentials
- Never use MailHog in production environments

---

## Additional Resources

- **Port Assignments**: [docs/PORT-ASSIGNMENTS.md](../docs/PORT-ASSIGNMENTS.md)
- **Docker Documentation**: [infrastructure/README.md](./README.md)
- **MailHog Docs**: https://github.com/mailhog/MailHog

---

*Infrastructure setup complete with MailHog and BuildKit support!*
