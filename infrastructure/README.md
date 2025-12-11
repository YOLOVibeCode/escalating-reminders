# Infrastructure Setup

> **Docker Compose configuration with MailHog, PostgreSQL, and Redis**  
> **All ports follow 38XX series convention**  
> ⚠️ **STABLE & FINAL**: Port assignments are standardized and will not change

---

## Quick Start

```bash
# Start all infrastructure services
cd infrastructure
make up

# Or use docker compose directly
docker compose up -d
```

---

## Services

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| PostgreSQL | 3802 | `postgresql://postgres:postgres@localhost:3802/escalating_reminders` | Database |
| Redis | 3803 | `redis://localhost:3803` | Cache & Queue |
| MailHog UI | 3810 | `http://localhost:3810` | Email testing web interface |
| MailHog SMTP | 3811 | `localhost:3811` | Email testing SMTP server |

**Application Services** (start separately):
| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Web App | 3800 | `http://localhost:3800` | Next.js frontend |
| API | 3801 | `http://localhost:3801/v1` | NestJS backend |

---

## Docker BuildKit

BuildKit is enabled by default for faster builds:

```bash
# BuildKit is automatically enabled via environment variables
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Or use Makefile (automatically enables BuildKit)
make build
```

---

## MailHog Configuration

### For API (NestJS)

Add to `apps/api/.env`:

```bash
# MailHog SMTP (development)
SMTP_HOST=localhost
SMTP_PORT=3811
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@escalating-reminders.local
```

### For Web App

MailHog is primarily used for backend email testing. Frontend can use the API's email functionality.

---

## Makefile Commands

```bash
make up          # Start all services
make down        # Stop all services
make restart     # Restart all services
make logs        # Show logs
make ps          # Show running containers
make clean       # Remove containers and volumes
make build       # Build Docker images
make mailhog     # Open MailHog web UI
make health      # Check service health
```

---

## Manual Docker Compose Commands

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d postgres
docker compose up -d redis
docker compose up -d mailhog

# View logs
docker compose logs -f mailhog

# Stop services
docker compose down

# Remove volumes (clean slate)
docker compose down -v
```

---

## MailHog Usage

### 1. Start MailHog

```bash
cd infrastructure
docker compose up -d mailhog
```

### 2. Configure Email Settings

In your `.env` files, use MailHog SMTP:

```bash
SMTP_HOST=localhost
SMTP_PORT=3811
```

### 3. Send Test Email

Any email sent through your application will be captured by MailHog.

### 4. View Emails

Open `http://localhost:3810` in your browser to see all captured emails.

### 5. Test Email Templates

- Send emails from your app
- View them in MailHog UI
- Inspect HTML/text content
- Check headers and attachments
- Download as .eml files

---

## Environment Variables

### Development `.env` Example

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:3802/escalating_reminders?schema=public

# Redis
REDIS_URL=redis://localhost:3803

# Email (MailHog)
SMTP_HOST=localhost
SMTP_PORT=3811
SMTP_FROM=noreply@escalating-reminders.local
```

---

## Health Checks

All services include health checks:

```bash
# Check service status
make health

# Or manually
docker compose ps
docker exec er-postgres pg_isready -U postgres
docker exec er-redis redis-cli ping
curl http://localhost:3810
```

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3810
lsof -i :3811

# Kill the process or change port in docker-compose.yml
```

### Services Won't Start

```bash
# Check logs
docker compose logs

# Restart services
docker compose restart

# Clean and restart
make clean
make up
```

### MailHog Not Capturing Emails

1. Verify MailHog is running: `docker compose ps`
2. Check SMTP configuration in `.env`
3. Verify port 3811 is accessible: `telnet localhost 3811`
4. Check MailHog logs: `docker compose logs mailhog`

---

## Production

**Note**: MailHog is for **development only**. In production:

- Use real SMTP service (SendGrid, AWS SES, etc.)
- Configure production SMTP credentials
- Do NOT use MailHog in production

---

*Infrastructure setup complete. All services use 38XX port series.*
