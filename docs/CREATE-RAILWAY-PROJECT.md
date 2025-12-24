# Create New Railway Project for Escalating Reminders

## Quick Instructions

### Step 1: Create New Project

Run this command in your terminal:

```bash
cd /Users/admin/Dev/YOLOProjects/escalating-reminders
railway init
```

### Step 2: Follow the Interactive Prompts

You'll be asked:

1. **Select a workspace**: Choose `Ricardo Vega's Projects`
2. **Project name**: Enter `escalating-reminders`
3. **Start with empty project**: Select `Yes` or `Empty Project`

### Step 3: Verify Project Created

```bash
railway status
```

You should see:
- Project: `escalating-reminders`
- Environment: `production`

---

## What Happens Next

After creating the project, Railway will:
- Create a new project in your workspace
- Link the current directory to that project
- Create `.railway` directory with project config

---

## Alternative: Create via Dashboard

If you prefer using the web interface:

1. **Go to Railway Dashboard**:
   ```bash
   railway open
   ```
   Or visit: https://railway.app/dashboard

2. **Create New Project**:
   - Click "+ New Project"
   - Select "Empty Project"
   - Name: `escalating-reminders`

3. **Link Locally**:
   ```bash
   railway link
   ```
   - Select workspace: `Ricardo Vega's Projects`
   - Select project: `escalating-reminders`
   - Select environment: `production`
   - Skip service selection (press ESC)

---

## After Project Creation

Once the project is created and linked, follow these steps:

### 1. Create Services

You need to create 3 services. Use Railway Dashboard for this:

```bash
railway open
```

**Create these services:**

1. **API Service**
   - Click "+ New" → "Empty Service"
   - Name: `api`
   - Root Directory: `apps/api`
   - Build Command: `npm run build`
   - Start Command: `npm run start:api`

2. **Worker Service**
   - Click "+ New" → "Empty Service"
   - Name: `worker`
   - Root Directory: `apps/api`
   - Build Command: `npm run build`
   - Start Command: `npm run start:worker`

3. **Scheduler Service**
   - Click "+ New" → "Empty Service"
   - Name: `scheduler`
   - Root Directory: `apps/api`
   - Build Command: `npm run build`
   - Start Command: `npm run start:scheduler`

### 2. Add Databases

**Add PostgreSQL:**
```bash
railway add --plugin postgresql
```

Or in Dashboard: "+ New" → "Database" → "Add PostgreSQL"

**Add Redis (Upstash Recommended):**
1. Go to https://upstash.com
2. Create new Redis database
3. Copy connection URL
4. Add to environment variables

### 3. Set Environment Variables

For **all 3 services**, add these variables in Railway Dashboard:

Go to Service → Variables tab:

```bash
# Database (Reference from PostgreSQL service)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis
REDIS_URL=<your-upstash-redis-url>

# JWT
JWT_SECRET=<generate-32-char-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<generate-32-char-secret>
JWT_REFRESH_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/v1/auth/oauth/google/callback

# Square Payments
SQUARE_ACCESS_TOKEN_SANDBOX=EAAAl9Mn5O6Tx4lwa6GmnZZ231tv_uIw8DFz7AqvUjMr5LIUclId9TUzL83eIMt8
SQUARE_APPLICATION_ID_SANDBOX=sandbox-sq0idb-0H2RD-9_GtVX2NUU2Do6lw
SQUARE_ACCESS_TOKEN_PRODUCTION=EAAAl2iU35de5ZS2bCgsCXi8vDkk765E-UgEPlY30ZRiNEzxC5OknKH2_NJthScZ
SQUARE_APPLICATION_ID_PRODUCTION=sq0idp-LR8I_51pXPGaSPaUtYNjgA
SQUARE_ENVIRONMENT=sandbox
SQUARE_LOCATION_ID=LSWR97SDRBXWK
SQUARE_WEBHOOK_SIGNATURE_KEY=<from-square-dashboard>
SQUARE_PLAN_PERSONAL=<plan-id-from-square>
SQUARE_PLAN_PRO=<plan-id-from-square>
SQUARE_PLAN_FAMILY=<plan-id-from-square>

# API Configuration
NODE_ENV=production
PORT=${{PORT}}
API_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=https://escalating-reminders.com

# Email (SendGrid)
SENDGRID_API_KEY=<your-sendgrid-key>
SENDGRID_FROM_EMAIL=noreply@escalating-reminders.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_PHONE_NUMBER=<your-twilio-number>
```

### 4. Run Database Migrations

After PostgreSQL is added:

```bash
railway run --service api npx prisma migrate deploy
railway run --service api npx prisma generate
```

### 5. Deploy Services

**Option A: Deploy via Dashboard**
- Go to each service
- Click "Deploy"
- Railway will build and start the service

**Option B: Deploy via CLI**
```bash
cd apps/api
railway up --service api
railway up --service worker
railway up --service scheduler
```

### 6. Verify Deployment

```bash
# Check status
railway status

# View API logs
railway logs --service api

# Test API endpoint
curl https://your-railway-domain.railway.app/health
```

---

## Generate Strong Secrets

For JWT secrets, use:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32
```

---

## Troubleshooting

### "Project already exists"
If project name is taken, try:
- `escalating-reminders-app`
- `escalating-reminders-prod`
- Or another unique name

### "Failed to link project"
Try:
```bash
rm -rf .railway
railway link
```

### "Build failed"
Check Railway logs:
```bash
railway logs --service api
```

Common issues:
- Missing dependencies in `package.json`
- Incorrect build paths
- Missing environment variables

---

## Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `railway init` | Create new project |
| `railway link` | Link existing project |
| `railway status` | View project status |
| `railway open` | Open dashboard |
| `railway up` | Deploy service |
| `railway logs` | View logs |
| `railway run <cmd>` | Run command in Railway |

---

## Next Step

**Run this now:**

```bash
cd /Users/admin/Dev/YOLOProjects/escalating-reminders
railway init
```

Then follow the prompts!

---

*See also: `docs/RAILWAY-DEPLOYMENT.md` for complete deployment guide*

