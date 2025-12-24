# Railway Project Linking - Quick Instructions

## Status: Ready to Link ✅

All deployment checks passed! Now you need to link your Railway project.

---

## Link Railway Project (Interactive)

Run this command in your terminal:

```bash
cd /Users/admin/Dev/YOLOProjects/escalating-reminders
railway link
```

This will open an interactive prompt where you can:
- **Option 1**: Select an existing Railway project
- **Option 2**: Create a new project

---

## What Happens During `railway link`

1. **Select Workspace**: Choose "Ricardo Vega's Projects" (or your workspace)
2. **Select/Create Project**: 
   - Choose existing "escalating-reminders" project (if it exists)
   - OR create new project
3. **Confirmation**: Railway creates a `.railway` directory with project info

---

## After Linking

Once linked, you can:

### Check Status
```bash
railway status
```

### View Project in Browser
```bash
railway open
```

### Deploy (when ready)
```bash
railway up
```

---

## Create Services in Railway Dashboard

After linking, you need to create **3 services**:

### Option A: Via Railway Dashboard (Recommended)

1. **Open Dashboard**:
   ```bash
   railway open
   ```

2. **Create API Service**:
   - Click "+ New" → "Empty Service"
   - Name: `api`
   - Settings → Connect to GitHub repo
   - Root Directory: `apps/api`
   - Railway will auto-detect `railway.toml`

3. **Create Worker Service**:
   - Click "+ New" → "Empty Service"  
   - Name: `worker`
   - Settings → Connect to GitHub repo
   - Root Directory: `apps/api`
   - Custom Config: Select `railway.worker.toml`

4. **Create Scheduler Service**:
   - Click "+ New" → "Empty Service"
   - Name: `scheduler`
   - Settings → Connect to GitHub repo
   - Root Directory: `apps/api`
   - Custom Config: Select `railway.scheduler.toml`

### Option B: Via CLI (Advanced)

```bash
# Deploy API service
cd apps/api
railway up --service api

# Deploy Worker service  
railway up --service worker --config railway.worker.toml

# Deploy Scheduler service
railway up --service scheduler --config railway.scheduler.toml
```

---

## Add Database & Redis

### Add PostgreSQL
```bash
railway add --plugin postgresql
```

OR in Dashboard:
- Click "+ New" → "Database" → "Add PostgreSQL"

### Add Redis

**Option 1: Railway Redis** (if available)
```bash
railway add --plugin redis
```

**Option 2: Upstash Redis** (Recommended)
1. Go to https://upstash.com
2. Create Redis database
3. Copy connection URL
4. Add to Railway environment variables

---

## Set Environment Variables

For each service, add these variables in Railway Dashboard:

### Required Variables

```bash
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-generated

# Redis  
REDIS_URL=<upstash-redis-url>

# JWT
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<generate-strong-secret>
JWT_REFRESH_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=${{API_URL}}/v1/auth/oauth/google/callback

# Square
SQUARE_ACCESS_TOKEN_SANDBOX=<token>
SQUARE_APPLICATION_ID_SANDBOX=<app-id>
SQUARE_ACCESS_TOKEN_PRODUCTION=<token>
SQUARE_APPLICATION_ID_PRODUCTION=<app-id>
SQUARE_ENVIRONMENT=sandbox
SQUARE_LOCATION_ID=<location-id>
SQUARE_WEBHOOK_SIGNATURE_KEY=<key>
SQUARE_PLAN_PERSONAL=<plan-id>
SQUARE_PLAN_PRO=<plan-id>
SQUARE_PLAN_FAMILY=<plan-id>

# API Config
NODE_ENV=production
PORT=${{PORT}}  # Auto-generated
API_URL=${{RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=https://escalating-reminders.com

# Email & SMS
SENDGRID_API_KEY=<key>
SENDGRID_FROM_EMAIL=noreply@escalating-reminders.com
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE_NUMBER=<number>
```

---

## Run Migrations

After services are deployed:

```bash
railway run --service api npx prisma migrate deploy
railway run --service api npx prisma generate
```

---

## Verify Deployment

```bash
# Check service status
railway status

# View logs
railway logs --service api
railway logs --service worker
railway logs --service scheduler

# Test API health
curl https://your-railway-domain.railway.app/health
```

---

## Quick Reference Commands

| Command | Purpose |
|---------|---------|
| `railway link` | Link project (interactive) |
| `railway status` | Check project status |
| `railway open` | Open dashboard in browser |
| `railway up` | Deploy current service |
| `railway logs` | View service logs |
| `railway run <cmd>` | Run command in Railway environment |
| `railway variables` | Manage environment variables |

---

## Next Step

**Run this now:**
```bash
railway link
```

Then follow the prompts to select/create your project!

---

*See also: `docs/RAILWAY-DEPLOYMENT.md` for full deployment guide*

