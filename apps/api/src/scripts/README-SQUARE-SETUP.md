# Square Setup Script - Installation Guide

## Installation Issue

Due to workspace protocol limitations (`workspace:*` syntax), npm install may fail. Here are solutions:

## Solution 1: Install at Root (Recommended)

```bash
cd /Users/admin/Dev/YOLOProjects/escalating-reminders
npm install squareup dotenv
```

This installs packages in the root `node_modules`, which the script can access.

## Solution 2: Use npx (No Installation Needed)

Run the script directly with npx/tsx:

```bash
cd /Users/admin/Dev/YOLOProjects/escalating-reminders
npx tsx apps/api/src/scripts/square-setup.ts
```

Or with options:
```bash
npx tsx apps/api/src/scripts/square-setup.ts --env=sandbox
npx tsx apps/api/src/scripts/square-setup.ts --env=production --webhook-url=https://api.escalating-reminders.com/v1/webhooks/square
```

## Solution 3: Manual Installation

If workspace install fails, manually install in `apps/api`:

```bash
cd apps/api
npm install squareup dotenv --no-save --legacy-peer-deps
```

Note: This may still fail due to workspace protocol. Use Solution 1 or 2 instead.

## Solution 4: Fix Workspace Protocol

If you want to fix the workspace protocol issue permanently:

1. Check which packages use `workspace:*`
2. Replace with `file:../../packages/...` syntax
3. Or switch to pnpm/yarn which support `workspace:*`

## Running the Script

Once packages are installed:

```bash
# From project root
npm run square:setup

# Or directly
cd apps/api
npm run square:setup
```

## What the Script Does

1. ✅ Creates 3 subscription plans (Personal $9.99, Pro $19.99, Family $29.99)
2. ✅ Creates webhook subscription with required events
3. ✅ Retrieves webhook signature key
4. ✅ Updates `.env` file automatically

## Troubleshooting

### "squareup package not found"

- Try Solution 1 (install at root)
- Or use Solution 2 (npx tsx)

### "Missing SQUARE_ACCESS_TOKEN"

- Ensure `.env` file exists in `apps/api/`
- Check all Square credentials are set

### "Square API errors"

- Verify credentials are correct
- Check Location ID is valid
- Ensure API permissions enabled in Square Dashboard
