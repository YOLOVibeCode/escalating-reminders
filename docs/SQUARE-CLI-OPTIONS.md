# Square CLI & SDK Options

> **Updated**: December 2025  
> **Purpose**: Guide to Square command-line tools and SDKs

---

## ❌ No Official Square Payments CLI

**Square Payments API does not have an official CLI tool** for managing subscriptions, webhooks, or billing operations. However, there are several alternatives:

---

## ✅ Available Options

### 1. Square Node.js SDK (Recommended)

Square provides an official Node.js SDK that we can use in our application:

```bash
npm install squareup
```

**Usage Example**:
```typescript
import { Client, Environment } from 'squareup';

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox, // or Environment.Production
});

// Create subscription
const { result } = await client.subscriptionsApi.createSubscription({
  locationId: process.env.SQUARE_LOCATION_ID,
  planId: process.env.SQUARE_PLAN_PERSONAL,
  customerId: 'customer-id',
});
```

**Installation**:
```bash
cd apps/api
npm install squareup
```

---

### 2. Square Cloud CLI (Different Product)

⚠️ **Note**: There is a "Square Cloud CLI" (`squarecloud`), but this is for **Square Cloud hosting platform**, not for Square Payments API. This is a different product and won't help with billing/subscriptions.

If you want to use it (for hosting):
```bash
# macOS/Linux
curl -fsSL https://cli.squarecloud.app/install | bash

# Windows
npm install -g @squarecloud/cli
```

---

### 3. Custom CLI Scripts (Recommended Approach)

We can create our own CLI scripts using the Square SDK:

**Example**: `apps/api/src/scripts/square-cli.ts`

```typescript
#!/usr/bin/env tsx
import { Client, Environment } from 'squareup';
import { Command } from 'commander';

const program = new Command();

program
  .name('square-cli')
  .description('CLI tool for Square operations')
  .version('1.0.0');

program
  .command('create-plan')
  .description('Create a subscription plan')
  .option('-n, --name <name>', 'Plan name')
  .option('-p, --price <price>', 'Monthly price in cents')
  .action(async (options) => {
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN_SANDBOX,
      environment: Environment.Sandbox,
    });
    
    // Create plan logic here
    console.log('Creating plan...', options);
  });

program
  .command('list-webhooks')
  .description('List webhook subscriptions')
  .action(async () => {
    const client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN_SANDBOX,
      environment: Environment.Sandbox,
    });
    
    const { result } = await client.webhookSubscriptionsApi.listWebhookSubscriptions();
    console.log(result);
  });

program.parse();
```

**Add to package.json**:
```json
{
  "scripts": {
    "square:cli": "tsx apps/api/src/scripts/square-cli.ts"
  }
}
```

---

### 4. Using cURL (Direct API Calls)

You can interact with Square API directly using `curl`:

**Example: List Webhook Subscriptions**
```bash
curl -X GET \
  'https://connect.squareupsandbox.com/v2/webhooks/subscriptions' \
  -H 'Square-Version: 2025-10-16' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json'
```

**Example: Create Subscription Plan**
```bash
curl -X POST \
  'https://connect.squareupsandbox.com/v2/catalog/object' \
  -H 'Square-Version: 2025-10-16' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "idempotency_key": "unique-key-123",
    "object": {
      "type": "SUBSCRIPTION_PLAN",
      "subscription_plan_data": {
        "name": "Personal Plan",
        "phases": [{
          "cadence": "MONTHLY",
          "recurring_price_money": {
            "amount": 999,
            "currency": "USD"
          }
        }]
      }
    }
  }'
```

---

## 🎯 Recommended Approach for This Project

### Option 1: Use Square SDK in Application Code (Best)

Install the Square SDK and use it in our billing service:

```bash
cd apps/api
npm install squareup
```

Then implement billing operations in:
- `apps/api/src/domains/billing/square-client.service.ts`
- `apps/api/src/domains/billing/billing.service.ts`

### Option 2: Create Custom CLI Scripts

Create helper scripts for common operations:

```bash
# Create scripts directory
mkdir -p apps/api/src/scripts

# Create square-cli.ts
# Add npm script: "square:cli": "tsx apps/api/src/scripts/square-cli.ts"
```

**Useful Commands to Implement**:
- `npm run square:cli create-plan` - Create subscription plan
- `npm run square:cli list-plans` - List all plans
- `npm run square:cli create-webhook` - Create webhook subscription
- `npm run square:cli list-webhooks` - List webhook subscriptions
- `npm run square:cli get-signature-key` - Get webhook signature key

---

## 📚 Resources

- [Square Node.js SDK](https://github.com/square/square-nodejs-sdk)
- [Square API Reference](https://developer.squareup.com/reference/square)
- [Square Subscriptions API](https://developer.squareup.com/docs/subscriptions-api/overview)
- [Square Webhook Subscriptions API](https://developer.squareup.com/reference/square/webhook-subscriptions-api)

---

## 💡 Quick Start: Install Square SDK

```bash
cd apps/api
npm install squareup
npm install --save-dev @types/node  # If needed
```

Then you can use it in your billing service implementation!

---

*Note: Square Payments API operations are best handled through the SDK in application code rather than CLI tools.*
