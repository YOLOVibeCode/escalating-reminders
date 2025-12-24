# Square Automation Setup - Complete Guide

> **Status**: Script created, installation workaround needed  
> **Created**: December 2025

---

## ✅ What's Been Created

1. **Automation Script**: `apps/api/src/scripts/square-setup.ts`
   - Creates subscription plans automatically
   - Creates webhook subscription
   - Retrieves signature key
   - Updates `.env` file

2. **Package Configuration**: Added `squareup` and `dotenv` to `package.json`
3. **npm Script**: `npm run square:setup` (ready to use once packages installed)

---

## ⚠️ Installation Issue

**Problem**: Workspace protocol (`workspace:*`) prevents npm install from working.

**Root Cause**: Some workspace packages use `workspace:*` syntax which npm doesn't fully support.

---

## 🔧 Working Solutions

### Solution 1: Use npx (Recommended - No Installation Needed)

Run the script directly with npx, which downloads packages on-the-fly:

```bash
cd /Users/admin/Dev/YOLOProjects/escalating-reminders
npx --yes tsx apps/api/src/scripts/square-setup.ts
```

With options:
```bash
# Sandbox (default)
npx --yes tsx apps/api/src/scripts/square-setup.ts --env=sandbox

# Production
npx --yes tsx apps/api/src/scripts/square-setup.ts --env=production

# Custom webhook URL
npx --yes tsx apps/api/src/scripts/square-setup.ts --webhook-url=https://api.escalating-reminders.com/v1/webhooks/square
```

**Pros**: 
- No installation needed
- Works immediately
- Downloads packages automatically

**Cons**: 
- Slightly slower first run
- Requires internet connection

---

### Solution 2: Manual Package Installation

Install squareup in a temporary location and symlink:

```bash
cd /Users/admin/Dev/YOLOProjects/escalating-reminders

# Create temp directory
mkdir -p .temp-square
cd .temp-square

# Install squareup
npm init -y
npm install squareup dotenv

# Create symlink in root node_modules
cd ..
mkdir -p node_modules
ln -sf ../.temp-square/node_modules/squareup node_modules/squareup
ln -sf ../.temp-square/node_modules/dotenv node_modules/dotenv

# Now you can run
npm run square:setup
```

---

### Solution 3: Fix Workspace Protocol (Long-term)

Replace `workspace:*` with `file:` paths in workspace packages:

1. Find packages using `workspace:*`:
   ```bash
   grep -r "workspace:\*" packages/ apps/
   ```

2. Replace with `file:` syntax:
   ```json
   // Before
   "@er/types": "workspace:*"
   
   // After  
   "@er/types": "file:../../packages/@er/types"
   ```

3. Run `npm install`

---

### Solution 4: Use pnpm or Yarn

These package managers support `workspace:*` natively:

```bash
# Install pnpm
npm install -g pnpm

# Install dependencies
pnpm install

# Add squareup
pnpm add squareup dotenv --filter @er/api
```

---

## 🚀 Quick Start (Using npx)

**Easiest method - no installation needed:**

```bash
cd /Users/admin/Dev/YOLOProjects/escalating-reminders

# Run automation script
npx --yes tsx apps/api/src/scripts/square-setup.ts
```

The script will:
1. ✅ Create 3 subscription plans ($9.99, $19.99, $29.99)
2. ✅ Create webhook subscription
3. ✅ Get signature key
4. ✅ Update `.env` file automatically

---

## 📋 Prerequisites

Before running, ensure `.env` has:

```bash
SQUARE_ACCESS_TOKEN_SANDBOX=your-token
SQUARE_APPLICATION_ID_SANDBOX=your-app-id
SQUARE_ACCESS_TOKEN_PRODUCTION=your-token
SQUARE_APPLICATION_ID_PRODUCTION=your-app-id
SQUARE_LOCATION_ID=LSWR97SDRBXWK
SQUARE_ENVIRONMENT=sandbox
```

---

## 🧪 Testing

After running the script:

1. **Verify Plans**: Check Square Dashboard → Subscription Plans
2. **Verify Webhook**: Check Square Developer Dashboard → Webhooks
3. **Check .env**: Verify plan IDs and signature key were added

---

## 📝 Script Output Example

```
🚀 Square Setup Automation

Environment: sandbox
Location ID: LSWR97SDRBXWK

📋 Step 1: Creating Subscription Plans
──────────────────────────────────────────────────
📦 Creating subscription plan: Personal ($9.99/month)
   ✅ Created plan with ID: plan:XXXXX
📦 Creating subscription plan: Pro ($19.99/month)
   ✅ Created plan with ID: plan:YYYYY
📦 Creating subscription plan: Family ($29.99/month)
   ✅ Created plan with ID: plan:ZZZZZ

📋 Step 2: Creating Webhook Subscription
──────────────────────────────────────────────────
🔔 Creating webhook subscription
   URL: http://localhost:3801/v1/webhooks/square
   ✅ Created webhook subscription
   Subscription ID: webhook:AAAAA
   Signature Key: abc123def456...

📋 Step 3: Updating .env File
──────────────────────────────────────────────────
✅ Updated SQUARE_PLAN_PERSONAL in .env
✅ Updated SQUARE_PLAN_PRO in .env
✅ Updated SQUARE_PLAN_FAMILY in .env
✅ Updated SQUARE_WEBHOOK_SIGNATURE_KEY in .env

✅ .env file updated successfully

✅ Square setup completed successfully!
```

---

## 🔍 Troubleshooting

### "Cannot find module 'squareup'"

**Solution**: Use npx method (Solution 1) - it handles this automatically.

### "Missing SQUARE_ACCESS_TOKEN"

**Solution**: Check `.env` file exists and has all required variables.

### "Square API errors"

**Solution**: 
- Verify credentials are correct
- Check Location ID is valid
- Ensure API permissions enabled

---

## 📚 Related Files

- `apps/api/src/scripts/square-setup.ts` - Main automation script
- `apps/api/src/scripts/README-SQUARE-SETUP.md` - Installation guide
- `docs/SQUARE-SETUP.md` - Manual setup instructions
- `docs/SQUARE-AUTOMATION.md` - Automation overview

---

## ✅ Next Steps

1. **Run the automation** using Solution 1 (npx method)
2. **Verify** plans and webhook in Square Dashboard
3. **Test** webhook delivery (use ngrok for local testing)
4. **Implement** billing service using the Square SDK

---

*The automation script is ready - use `npx --yes tsx apps/api/src/scripts/square-setup.ts` to run it without installation!*
