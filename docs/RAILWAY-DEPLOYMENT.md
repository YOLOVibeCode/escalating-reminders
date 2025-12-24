# Railway Deployment Guide

> **Target Hosting**: Railway (Backend) + Vercel (Frontend)  
> **Status**: ✅ Configuration Ready

---

## ✅ Deployment Readiness Checklist

### Configuration Files ✅
- [x] `apps/api/railway.toml` - API service config
- [x] `apps/api/railway.worker.toml` - Worker service config
- [x] `apps/api/railway.scheduler.toml` - Scheduler service config
- [x] Railway CLI installed (`railway --version`)

### Build Scripts ✅
- [x] `npm run build` - Builds successfully
- [x] `npm run start:api` - API start command
- [x] `npm run start:worker` - Worker start command
- [x] `npm run start:scheduler` - Scheduler start command

### Services Ready ✅
- [x] API service entry point (`dist/main.js`)
- [x] Worker service entry point (`dist/workers/worker.js`)
- [x] Scheduler service entry point (`dist/workers/scheduler.js`)

---

## 🚀 Deployment Steps

### Step 1: Link Railway Project

```bash
cd /Users/admin/Dev/YOLOProjects/escalating-reminders

# Login to Railway (if not already logged in)
railway login

# Link to existing project OR create new project
railway link
# OR
railway init
```

### Step 2: Create Services in Railway

You need to create **3 services** in Railway:

#### Service 1: API Service
```bash
# In Railway Dashboard:
# 1. Click "New Service"
# 2. Select "GitHub Repo" → Choose your repo
# 3. Set Root Directory: `apps/api`
# 4. Railway will auto-detect railway.toml
```

#### Service 2: Worker Service
```bash
# In Railway Dashboard:
# 1. Click "New Service" (in same project)
# 2. Select "GitHub Repo" → Same repo
# 3. Set Root Directory: `apps/api`
# 4. Override config: Use `railway.worker.toml`
#    OR manually set:
#    - Build Command: `npm run build`
#    - Start Command: `npm run start:worker`
```

#### Service 3: Scheduler Service
```bash
# In Railway Dashboard:
# 1. Click "New Service" (in same project)
# 2. Select "GitHub Repo" → Same repo
# 3. Set Root Directory: `apps/api`
# 4. Override config: Use `railway.scheduler.toml`
#    OR manually set:
#    - Build Command: `npm run build`
#    - Start Command: `npm run start:scheduler`
#    - Replicas: 1 (IMPORTANT - must be singleton)
```

### Step 3: Add PostgreSQL Database

```bash
# In Railway Dashboard:
# 1. Click "New" → "Database" → "Add PostgreSQL"
# 2. Railway will auto-generate connection string
# 3. Add as environment variable: `DATABASE_URL`
```

### Step 4: Add Redis (Upstash)

**Option A: Railway Redis** (if available)
```bash
# In Railway Dashboard:
# 1. Click "New" → "Database" → "Add Redis"
# 2. Add connection string as: `REDIS_URL`
```

**Option B: Upstash Redis** (Recommended)
```bash
# 1. Go to https://upstash.com
# 2. Create Redis database
# 3. Copy connection URL
# 4. Add to Railway environment variables: `REDIS_URL`
```

### Step 5: Configure Environment Variables

Add these environment variables to **each service** in Railway:

#### Required Variables (All Services)

```bash
# Database
DATABASE_URL=<railway-postgres-connection-string>

# Redis
REDIS_URL=<upstash-redis-connection-string>

# JWT
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<generate-strong-secret>
JWT_REFRESH_EXPIRES_IN=7d

# OAuth (Google)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://api.escalating-reminders.com/v1/auth/oauth/google/callback

# Square Payments
SQUARE_ACCESS_TOKEN_SANDBOX=<sandbox-token>
SQUARE_APPLICATION_ID_SANDBOX=<sandbox-app-id>
SQUARE_ACCESS_TOKEN_PRODUCTION=<production-token>
SQUARE_APPLICATION_ID_PRODUCTION=<production-app-id>
SQUARE_ENVIRONMENT=sandbox  # or production
SQUARE_LOCATION_ID=<location-id>
SQUARE_WEBHOOK_SIGNATURE_KEY=<webhook-signature-key>
SQUARE_PLAN_PERSONAL=<plan-id>
SQUARE_PLAN_PRO=<plan-id>
SQUARE_PLAN_FAMILY=<plan-id>

# API Configuration
NODE_ENV=production
PORT=3801  # Railway will override with PORT env var
API_URL=https://api.escalating-reminders.com
FRONTEND_URL=https://escalating-reminders.com

# Email (SendGrid)
SENDGRID_API_KEY=<sendgrid-api-key>
SENDGRID_FROM_EMAIL=noreply@escalating-reminders.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=<twilio-account-sid>
TWILIO_AUTH_TOKEN=<twilio-auth-token>
TWILIO_PHONE_NUMBER=<twilio-phone-number>
```

#### Service-Specific Variables

**API Service Only:**
```bash
# CORS
CORS_ORIGIN=https://escalating-reminders.com
```

**Worker & Scheduler Services:**
```bash
# No additional variables needed
# They share the same environment as API
```

### Step 6: Run Database Migrations

```bash
# In Railway Dashboard → API Service → Deployments → Shell
# OR via Railway CLI:
railway run --service api npx prisma migrate deploy

# Generate Prisma Client
railway run --service api npx prisma generate
```

### Step 7: Deploy

Railway will automatically deploy when you:
1. Push to GitHub (if connected)
2. Or manually trigger deployment

```bash
# Manual deployment via CLI
railway up

# Or push to GitHub
git push origin main
```

---

## 🔍 Verification

### Check Service Health

```bash
# API Health Check
curl https://api.escalating-reminders.com/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

### Check Logs

```bash
# Via Railway Dashboard
# Or via CLI:
railway logs --service api
railway logs --service worker
railway logs --service scheduler
```

---

## 📋 Service Configuration Summary

| Service | Port | Health Check | Replicas | Purpose |
|---------|------|--------------|----------|---------|
| API | 3801 | `/health` | 1+ | HTTP API endpoints |
| Worker | N/A | `/health/ready` | 2 | Background job processing |
| Scheduler | N/A | `/health/ready` | 1 | Cron jobs (singleton) |

---

## 🐛 Troubleshooting

### Build Fails
- Check Railway build logs
- Verify `npm run build` works locally
- Check Node.js version (should be 20+)

### Service Won't Start
- Check start command matches package.json scripts
- Verify environment variables are set
- Check service logs for errors

### Database Connection Fails
- Verify `DATABASE_URL` is set correctly
- Check PostgreSQL is running
- Run migrations: `railway run npx prisma migrate deploy`

### Worker/Scheduler Not Processing
- Verify Redis connection (`REDIS_URL`)
- Check service logs
- Ensure replicas are running

---

## 🔗 Useful Links

- **Railway Dashboard**: https://railway.app
- **Railway Docs**: https://docs.railway.app
- **Railway CLI**: `railway --help`

---

## ✅ Next Steps After Deployment

1. **Set up custom domain** in Railway
2. **Configure SSL** (automatic with Railway)
3. **Set up monitoring** (Railway has built-in metrics)
4. **Configure alerts** for service failures
5. **Set up CI/CD** (automatic with GitHub integration)

---

*Last updated: December 2025*

