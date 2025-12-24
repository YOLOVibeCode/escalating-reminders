# Environment Setup Guide

This guide covers setting up environment variables for **sandbox (development)** and **production** environments.

## Quick Start

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env.local
```

---

## Environment Variable Reference

### Required Variables by Environment

| Variable | Sandbox | Production | Notes |
|----------|---------|------------|-------|
| `DATABASE_URL` | Local PostgreSQL | Railway/Cloud | Connection string |
| `REDIS_URL` | Local Redis | Railway/Cloud | Connection string |
| `JWT_SECRET` | Dev secret OK | **Must generate** | `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | OAuth credentials | OAuth credentials | Same or different app |
| `GOOGLE_CLIENT_SECRET` | OAuth credentials | OAuth credentials | Same or different app |
| `SQUARE_ENVIRONMENT` | `sandbox` | `production` | Switches Square mode |
| `SQUARE_ACCESS_TOKEN_*` | Sandbox token | Production token | Environment-specific |

---

## Sandbox Environment Setup

### 1. Database (PostgreSQL)

Start local PostgreSQL via Docker:
```bash
docker compose -f infrastructure/docker-compose.dev.yml up -d postgres
```

**Value:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:3802/escalating_reminders?schema=public
```

### 2. Redis

Start local Redis via Docker:
```bash
docker compose -f infrastructure/docker-compose.dev.yml up -d redis
```

**Value:**
```
REDIS_URL=redis://localhost:3803
```

### 3. JWT Secrets

For development, simple secrets are fine:
```
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production
```

### 4. Google OAuth (Sandbox)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials (or use existing)
3. Add authorized redirect URI: `http://localhost:3800/oauth/callback/google`

**Values:**
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
OAUTH_REDIRECT_BASE_URL=http://localhost:3800
```

### 5. Square Payments (Sandbox)

1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Create or select an application
3. Get **Sandbox** credentials from the Credentials tab

**Values:**
```
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN_SANDBOX=EAAAl...your-sandbox-token
SQUARE_APPLICATION_ID_SANDBOX=sandbox-sq0idb-your-app-id
SQUARE_LOCATION_ID=your-location-id
```

### 6. Email (MailHog)

Start MailHog for local email testing:
```bash
docker compose -f infrastructure/docker-compose.dev.yml up -d mailhog
```

**Values:**
```
SMTP_HOST=localhost
SMTP_PORT=3811
SMTP_FROM=noreply@escalating-reminders.local
SMTP_SECURE=false
MAILHOG_BASE_URL=http://localhost:3810
```

View emails at: http://localhost:3810

---

## Production Environment Setup

### 1. Database (Railway/Cloud)

Use your cloud provider's PostgreSQL:

**Railway:**
```
DATABASE_URL=postgresql://user:password@host.railway.app:5432/railway
```

**Supabase:**
```
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

### 2. Redis (Railway/Cloud)

Use your cloud provider's Redis:

**Railway:**
```
REDIS_URL=redis://default:password@host.railway.app:6379
```

**Upstash:**
```
REDIS_URL=rediss://default:password@xxx.upstash.io:6379
```

### 3. JWT Secrets (CRITICAL)

**Generate secure secrets:**
```bash
openssl rand -hex 32
```

**Values:**
```
JWT_SECRET=a1b2c3d4e5f6...64-character-hex-string
JWT_REFRESH_SECRET=f6e5d4c3b2a1...64-character-hex-string
```

### 4. Google OAuth (Production)

1. Create a **new OAuth app** for production (recommended)
2. Add authorized redirect URI: `https://your-domain.com/oauth/callback/google`

**Values:**
```
GOOGLE_CLIENT_ID=production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-production-secret
OAUTH_REDIRECT_BASE_URL=https://your-domain.com
```

### 5. Square Payments (Production)

1. In Square Developer Dashboard, go to **Production** tab
2. Get production credentials

**Values:**
```
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN_PRODUCTION=EAAAl...your-production-token
SQUARE_APPLICATION_ID_PRODUCTION=sq0idp-your-production-app-id
SQUARE_LOCATION_ID=your-location-id
SQUARE_WEBHOOK_SIGNATURE_KEY=your-webhook-signature
```

### 6. Email (Production SMTP)

Use a production email service:

**SendGrid:**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
SMTP_FROM=noreply@your-domain.com
SMTP_SECURE=true
```

**AWS SES:**
```
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
SMTP_FROM=noreply@your-domain.com
SMTP_SECURE=true
```

---

## Complete .env Templates

### Sandbox (.env)

```bash
# ============================================
# SANDBOX ENVIRONMENT
# ============================================

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:3802/escalating_reminders?schema=public

# Redis
REDIS_URL=redis://localhost:3803

# JWT (dev secrets - OK for sandbox)
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
OAUTH_REDIRECT_BASE_URL=http://localhost:3800

# Email (MailHog)
SMTP_HOST=localhost
SMTP_PORT=3811
SMTP_FROM=noreply@escalating-reminders.local
SMTP_SECURE=false

# Square (Sandbox)
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN_SANDBOX=your-sandbox-token
SQUARE_APPLICATION_ID_SANDBOX=sandbox-sq0idb-your-app-id
SQUARE_LOCATION_ID=your-location-id
SQUARE_WEBHOOK_SIGNATURE_KEY=

# Application
NODE_ENV=development
PORT=3801
CORS_ORIGIN=http://localhost:3800
```

### Production (.env)

```bash
# ============================================
# PRODUCTION ENVIRONMENT
# ============================================

# Database (Railway/Cloud)
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis (Railway/Cloud)
REDIS_URL=redis://default:password@host:6379

# JWT (GENERATE FRESH SECRETS!)
JWT_SECRET=GENERATE_WITH_openssl_rand_-hex_32
JWT_REFRESH_SECRET=GENERATE_WITH_openssl_rand_-hex_32
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (Production app)
GOOGLE_CLIENT_ID=production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-production-secret
OAUTH_REDIRECT_BASE_URL=https://your-domain.com

# Email (Production SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-api-key
SMTP_FROM=noreply@your-domain.com
SMTP_SECURE=true

# Square (Production)
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN_PRODUCTION=your-production-token
SQUARE_APPLICATION_ID_PRODUCTION=sq0idp-your-app-id
SQUARE_LOCATION_ID=your-location-id
SQUARE_WEBHOOK_SIGNATURE_KEY=your-webhook-signature

# Subscription Plans
SQUARE_PLAN_PERSONAL=plan-id-personal
SQUARE_PLAN_PRO=plan-id-pro
SQUARE_PLAN_FAMILY=plan-id-family

# Application
NODE_ENV=production
PORT=3801
CORS_ORIGIN=https://your-domain.com
```

---

## Port Reference (38XX Series)

| Port | Service | Purpose |
|------|---------|---------|
| 3800 | Web App | Next.js frontend |
| 3801 | API | NestJS backend |
| 3802 | PostgreSQL | Database |
| 3803 | Redis | Cache/Queue |
| 3804 | Prisma Studio | Database GUI |
| 3805 | Storybook | Component docs |
| 3810 | MailHog UI | Email testing |
| 3811 | MailHog SMTP | Email testing |
| 3812 | Webhook Receiver | E2E tests |

---

## Verification Commands

### Check database connection:
```bash
cd apps/api && npx prisma db pull
```

### Check Redis connection:
```bash
redis-cli -p 3803 ping
```

### Check API health:
```bash
curl http://localhost:3801/health
```

### Check web app:
```bash
curl http://localhost:3800
```

---

## Security Checklist

- [ ] JWT secrets are unique per environment
- [ ] JWT secrets are 64+ characters (hex)
- [ ] Production uses HTTPS for all URLs
- [ ] Square webhook signature is configured
- [ ] .env files are in .gitignore
- [ ] No secrets committed to git
- [ ] Production SMTP uses secure connection
- [ ] Google OAuth has correct redirect URIs
