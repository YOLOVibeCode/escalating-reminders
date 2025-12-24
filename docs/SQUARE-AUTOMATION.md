# Square Setup Automation

> **Created**: December 2025  
> **Purpose**: Automated Square setup script for subscription plans and webhooks

---

## 🚀 Quick Start

### 1. Install Dependencies

First, install the Square SDK and dotenv:

```bash
# From project root
cd apps/api
npm install squareup dotenv

# Or if workspace install works:
npm install squareup dotenv --workspace=@er/api
```

### 2. Run Setup Script

```bash
# From project root
npm run square:setup

# Or specify environment
npm run square:setup -- --env=sandbox
npm run square:setup -- --env=production

# Or specify webhook URL
npm run square:setup -- --webhook-url=https://api.escalating-reminders.com/v1/webhooks/square
```

---

## ✨ What It Does

The automation script (`apps/api/src/scripts/square-setup.ts`) automatically:

1. ✅ **Creates Subscription Plans**:
   - Personal Plan ($9.99/month)
   - Pro Plan ($19.99/month)
   - Family Plan ($29.99/month)

2. ✅ **Creates Webhook Subscription**:
   - Subscribes to required events:
     - `subscription.created`
     - `subscription.updated`
     - `invoice.payment_made`
     - `invoice.payment_failed`

3. ✅ **Retrieves Webhook Signature Key**:
   - Gets the signature key from Square
   - Updates `.env` file automatically

4. ✅ **Updates .env File**:
   - Adds `SQUARE_PLAN_PERSONAL`
   - Adds `SQUARE_PLAN_PRO`
   - Adds `SQUARE_PLAN_FAMILY`
   - Adds `SQUARE_WEBHOOK_SIGNATURE_KEY`

---

## 📋 Prerequisites

Before running the script, ensure your `.env` file has:

```bash
# Square credentials (already configured)
SQUARE_ACCESS_TOKEN_SANDBOX=your-sandbox-token
SQUARE_APPLICATION_ID_SANDBOX=your-sandbox-app-id
SQUARE_ACCESS_TOKEN_PRODUCTION=your-production-token
SQUARE_APPLICATION_ID_PRODUCTION=your-production-app-id
SQUARE_LOCATION_ID=LSWR97SDRBXWK
SQUARE_ENVIRONMENT=sandbox  # or production
```

---

## 🎯 Usage Examples

### Sandbox Setup (Default)

```bash
npm run square:setup
```

This will:
- Use sandbox credentials
- Create plans in sandbox environment
- Create webhook for local testing (you'll need ngrok)

### Production Setup

```bash
npm run square:setup -- --env=production
```

This will:
- Use production credentials
- Create plans in production environment
- Create webhook with production URL

### Custom Webhook URL

```bash
npm run square:setup -- --webhook-url=https://your-domain.com/v1/webhooks/square
```

---

## 🔧 Manual Installation (If npm install fails)

If you encounter workspace issues, manually add to `apps/api/package.json`:

```json
{
  "dependencies": {
    "squareup": "^40.0.0",
    "dotenv": "^16.3.1"
  }
}
```

Then run:
```bash
cd apps/api
npm install
```

---

## 📝 Script Output

The script will output:

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

📝 Summary:
   Personal Plan ID: plan:XXXXX
   Pro Plan ID: plan:YYYYY
   Family Plan ID: plan:ZZZZZ
   Webhook Signature Key: abc123def456...

⚠️  Next steps:
   1. Verify plan IDs in Square Dashboard
   2. Test webhook delivery
   3. Update webhook URL in Square Dashboard if needed
```

---

## 🧪 Testing Webhooks Locally

For local webhook testing, use **ngrok**:

```bash
# Install ngrok
brew install ngrok  # macOS

# Start tunnel
ngrok http 3801

# Use the ngrok URL when running setup
npm run square:setup -- --webhook-url=https://abc123.ngrok.io/v1/webhooks/square
```

---

## ⚠️ Troubleshooting

### Error: Missing credentials

Ensure all Square credentials are in `.env`:
- `SQUARE_ACCESS_TOKEN_SANDBOX` or `SQUARE_ACCESS_TOKEN_PRODUCTION`
- `SQUARE_APPLICATION_ID_SANDBOX` or `SQUARE_APPLICATION_ID_PRODUCTION`
- `SQUARE_LOCATION_ID`

### Error: Square API errors

Check:
- Credentials are correct
- Location ID is valid
- API permissions are enabled in Square Dashboard

### Error: Cannot find module 'squareup'

Run:
```bash
cd apps/api
npm install squareup
```

---

## 📚 Related Documentation

- [Square Setup Guide](./SQUARE-SETUP.md) - Manual setup instructions
- [Square Quick Start](./SQUARE-QUICK-START.md) - Quick reference
- [Square CLI Options](./SQUARE-CLI-OPTIONS.md) - CLI alternatives

---

*This automation script simplifies Square setup by handling plan creation and webhook configuration automatically.*
