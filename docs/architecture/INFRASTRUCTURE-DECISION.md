# Infrastructure Decision Record

> **Version**: 1.0.0  
> **Last Updated**: December 2024  
> **Status**: ✅ Final Decision

---

## Decision

**Backend Infrastructure: Railway**

After analysis of multiple options (Railway, Azure App Service, Azure VM), **Railway has been selected** as the backend hosting platform for Escalating Reminders.

---

## Decision Rationale

### ✅ Why Railway?

1. **Simplicity**
   - Native builds (no Docker compatibility issues)
   - Automatic deployments from GitHub
   - Minimal configuration required
   - Fast setup (15 minutes vs. 2-4 hours)

2. **Cost-Effectiveness**
   - MVP cost: $40-90/month
   - Predictable pricing
   - No hidden fees
   - Affordable scaling

3. **Developer Experience**
   - Excellent CLI tool
   - Built-in PostgreSQL and Redis
   - Automatic SSL certificates
   - Preview deployments per PR

4. **Perfect Fit for Stack**
   - Native Node.js builds
   - Supports NestJS out of the box
   - No Docker required (solves Mac compatibility issues)
   - Easy multi-service setup (API, Worker, Scheduler)

5. **Scaling Path**
   - Easy to add replicas
   - Auto-scaling available
   - Can migrate to Azure later if enterprise needs arise

---

## Final Infrastructure Stack

### Frontend
- **Platform**: Vercel
- **Framework**: Next.js 14
- **Cost**: $20/month (Pro tier)

### Backend
- **Platform**: Railway
- **Services**:
  - API Service (NestJS)
  - Worker Service (Background jobs)
  - Scheduler Service (Cron jobs, singleton)
- **Cost**: $20-50/month

### Database
- **Platform**: Railway PostgreSQL (or Supabase if connection pooling needed)
- **Version**: PostgreSQL 15
- **Cost**: $10-20/month (Railway) or $25/month (Supabase)

### Cache & Queue
- **Platform**: Upstash Redis
- **Type**: Serverless Redis
- **Cost**: $10-20/month

### Total Monthly Cost (MVP)
**$60-110/month**

---

## Railway Services Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY PLATFORM                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  API Service (NestJS)                                │  │
│   │  - Port: 3801                                        │  │
│   │  - Health: /health                                   │  │
│   │  - Replicas: 1 (auto-scale when needed)              │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Worker Service (BullMQ)                            │  │
│   │  - Background job processing                        │  │
│   │  - Replicas: 2 (for redundancy)                    │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Scheduler Service (Cron)                            │  │
│   │  - Reminder triggers                                 │  │
│   │  - Replicas: 1 (MUST be singleton)                 │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  PostgreSQL (Railway Plugin)                        │  │
│   │  - Automatic backups                                │  │
│   │  - Connection pooling                                │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Railway Configuration

### Service Definitions

#### API Service
```toml
# apps/api/railway.toml

[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run start:api"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 5

[service]
internalPort = 3801
```

#### Worker Service
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
healthcheckPath = "/health/ready"
```

#### Scheduler Service
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
healthcheckPath = "/health/ready"
```

---

## Database Strategy

### Primary: Railway PostgreSQL

**Why:**
- ✅ Same platform as backend (simpler)
- ✅ Automatic backups
- ✅ Simple setup
- ✅ Affordable ($10-20/month)

**When to Consider Supabase:**
- If connection pooling becomes a bottleneck
- If you need additional features (auth, storage)
- Migration is easy (just connection string change)

---

## Redis Strategy

### Primary: Upstash Redis

**Why:**
- ✅ Serverless (pay per use)
- ✅ Affordable ($10-20/month)
- ✅ Simple setup
- ✅ Works great with BullMQ
- ✅ No infrastructure to manage

**Alternative: Railway Redis**
- Can use Railway Redis plugin if preferred
- Similar cost
- Same platform

---

## Deployment Flow

### Automatic Deployment

```
GitHub Push (main branch)
    ↓
Railway detects changes
    ↓
Builds application (Nixpacks)
    ↓
Runs tests (if configured)
    ↓
Deploys to production
    ↓
Health check validates
    ↓
Traffic routed to new version
```

### Manual Deployment

```bash
# Via Railway CLI
railway up

# Or via GitHub integration (automatic)
git push origin main
```

---

## Railway CLI

Railway provides a powerful CLI tool for managing projects, services, and deployments.

### Installation

**macOS (Homebrew):**
```bash
brew install railway
```

**npm (All Platforms):**
```bash
npm i -g @railway/cli
```

**Shell Script (macOS, Linux, Windows via WSL):**
```bash
bash <(curl -fsSL cli.new)
```

**Windows (Scoop):**
```bash
scoop install railway
```

### Authentication

```bash
# Login to Railway
railway login

# This opens a browser for authentication
```

### Common Commands

```bash
# Initialize Railway in current directory
railway init

# Link to existing project
railway link

# Deploy current directory
railway up

# View logs
railway logs

# Open project in browser
railway open

# List all services
railway service list

# View service details
railway service

# Set environment variables
railway variables set KEY=value

# View environment variables
railway variables

# Run command in Railway environment
railway run <command>

# Connect to database
railway connect postgres

# View service metrics
railway metrics
```

### Project Management

```bash
# Create new project
railway project new

# List all projects
railway project list

# Switch active project
railway project switch

# View current project
railway project
```

### Service Management

```bash
# Scale service (change replicas)
railway service update <service-name> --replicas 5

# Restart service
railway service restart <service-name>

# View service logs
railway service logs <service-name>
```

### Development Workflow

```bash
# 1. Link to project
railway link

# 2. Set environment variables
railway variables set DATABASE_URL=postgres://...
railway variables set JWT_SECRET=...

# 3. Deploy
railway up

# 4. View logs
railway logs --follow

# 5. Connect to database
railway connect postgres
```

### CLI vs. Dashboard

**Use CLI for:**
- ✅ Automated deployments (CI/CD)
- ✅ Local development with Railway environment
- ✅ Scripting and automation
- ✅ Quick commands from terminal

**Use Dashboard for:**
- ✅ Visual service management
- ✅ Metrics and monitoring
- ✅ Team collaboration
- ✅ Service configuration (GUI)

---

## Environment Variables

### Railway Secrets Management

All secrets stored in Railway dashboard:
- `DATABASE_URL` (auto-provided by PostgreSQL plugin)
- `REDIS_URL` (from Upstash or Railway Redis)
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ENCRYPTION_KEY`
- External service API keys (Square, Twilio, etc.)

---

## Scaling Strategy

### Phase 1: MVP (0-1,000 users)
- API: 1 replica
- Worker: 2 replicas
- Scheduler: 1 replica (singleton)
- PostgreSQL: Railway starter tier
- Redis: Upstash free tier

### Phase 2: Growth (1,000-10,000 users)
- API: 2-3 replicas (auto-scale based on CPU)
- Worker: 3-5 replicas
- Scheduler: 1 replica (singleton)
- PostgreSQL: Railway pro tier or Supabase
- Redis: Upstash pro tier

### Phase 3: Scale (10,000+ users)
- API: Auto-scaling (3-10 replicas)
- Worker: Auto-scaling (5-20 replicas)
- Scheduler: 1 replica (singleton)
- PostgreSQL: Supabase pro or dedicated
- Redis: Upstash enterprise or dedicated

---

## Migration Path (If Needed Later)

### To Azure (If Enterprise Needs Arise)

```
Railway (Current)
    ↓
1. Export environment variables
2. Export database (pg_dump)
3. Set up Azure App Service
4. Import database to Azure PostgreSQL
5. Update connection strings
6. Deploy
```

**Key Point:** No code changes needed, just infrastructure migration.

---

## Monitoring & Observability

### Railway Built-in
- Service logs
- Metrics (CPU, memory, requests)
- Deployment history
- Health check status

### Additional (Recommended)
- **Sentry**: Error tracking
- **Logtail**: Log aggregation (optional)
- **Uptime Robot**: External health checks

---

## Backup Strategy

### Database
- **Railway PostgreSQL**: Automatic daily backups
- **Retention**: 7 days point-in-time recovery
- **Manual**: Can export via `pg_dump`

### Application State
- Stateless design (no backups needed)
- All state in database
- Redis is cache-only (can rebuild from DB)

---

## Security

### Railway Security Features
- ✅ Automatic SSL certificates
- ✅ Private networking between services
- ✅ Secrets management
- ✅ Environment variable encryption
- ✅ DDoS protection

### Additional Security
- API rate limiting (implemented in code)
- JWT token authentication
- Database connection encryption (SSL required)
- Webhook signature verification (HMAC-SHA256)

---

## Cost Optimization

### MVP Phase
- Use Railway free tier credits ($5/month)
- Start with minimal resources
- Scale up only when needed

### Growth Phase
- Monitor usage
- Right-size services
- Use auto-scaling to avoid over-provisioning

---

## Success Criteria

### Railway Meets All Requirements

✅ **Simplicity**: Minimal configuration, fast setup  
✅ **Cost**: Affordable for MVP ($60-110/month)  
✅ **Developer Experience**: Excellent CLI, auto-deployments  
✅ **Reliability**: 99.9% SLA, automatic restarts  
✅ **Scaling**: Easy to scale when needed  
✅ **No Docker Issues**: Native builds solve Mac compatibility  

---

## Next Steps

1. ✅ **Decision Made**: Railway selected
2. ⏭️ **Implementation**: Set up Railway services
3. 📝 **Documentation**: Update all specs to reflect Railway
4. 🔧 **Configuration**: Create Railway config files

---

## References

- [Railway Documentation](https://docs.railway.app/)
- [Railway Pricing](https://railway.app/pricing)
- [Nixpacks Build System](https://nixpacks.com/)

---

*This decision record is final. All infrastructure specifications should reference Railway as the backend hosting platform.*

