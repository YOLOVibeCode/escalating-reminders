# Square Billing Setup Guide

> **Created**: December 2025  
> **Purpose**: Guide for configuring Square payment integration

---

## Credentials Configuration

Square credentials have been added to `apps/api/.env`:

### Sandbox (Development/Testing)
- **Application ID**: `sandbox-sq0idb-0H2RD-9_GtVX2NUU2Do6lw`
- **Access Token**: `EAAAl9Mn5O6Tx4lwa6GmnZZ231tv_uIw8DFz7AqvUjMr5LIUclId9TUzL83eIMt8`

### Production
- **Application ID**: `sq0idp-LR8I_51pXPGaSPaUtYNjgA`
- **Access Token**: `EAAAl2iU35de5ZS2bCgsCXi8vDkk765E-UgEPlY30ZRiNEzxC5OknKH2_NJthScZ`

---

## Environment Variables

The `.env` file contains:

```bash
# Sandbox credentials
SQUARE_ACCESS_TOKEN_SANDBOX=EAAAl9Mn5O6Tx4lwa6GmnZZ231tv_uIw8DFz7AqvUjMr5LIUclId9TUzL83eIMt8
SQUARE_APPLICATION_ID_SANDBOX=sandbox-sq0idb-0H2RD-9_GtVX2NUU2Do6lw

# Production credentials
SQUARE_ACCESS_TOKEN_PRODUCTION=EAAAl2iU35de5ZS2bCgsCXi8vDkk765E-UgEPlY30ZRiNEzxC5OknKH2_NJthScZ
SQUARE_APPLICATION_ID_PRODUCTION=sq0idp-LR8I_51pXPGaSPaUtYNjgA

# Active environment (sandbox or production)
SQUARE_ENVIRONMENT=sandbox

# Location ID (required - set this in Square Dashboard)
SQUARE_LOCATION_ID=

# Webhook signature key (set this in Square Dashboard > Webhooks)
SQUARE_WEBHOOK_SIGNATURE_KEY=

# Subscription Plan IDs (create in Square Dashboard and add here)
SQUARE_PLAN_PERSONAL=
SQUARE_PLAN_PRO=
SQUARE_PLAN_FAMILY=
```

---

## Next Steps

### 1. Location ID ✅ CONFIGURED

**Location Details**:
- **Business Name**: YOLOVibeCode BootCamps (Main)
- **Address**: 6245 Rufe Snow Dr Ste 280 PMB 114
- **Location ID**: `LSWR97SDRBXWK` ✅ (configured in `.env`)

The Location ID has been added to `apps/api/.env`:
```bash
SQUARE_LOCATION_ID=LSWR97SDRBXWK
```

### 2. Create Subscription Plans

#### Option A: Via Square Dashboard (Easier for Initial Setup)

1. **Sign in to Square Dashboard**:
   - Go to [Square Dashboard](https://squareup.com/dashboard)
   - Sign in with your Square account

2. **Navigate to Subscription Plans**:
   - Click on **Items & Services** (or **Items & Menus** or **Items & Inventory**)
   - Look for **Subscription Plans** in the left sidebar
   - Click **Create Plan** or **+ New Plan**

3. **Create Personal Plan**:
   - **Plan Name**: "Personal" (or "Escalating Reminders - Personal")
   - **Price**: Set your monthly/annual price (e.g., $9.99/month)
   - **Billing Frequency**: Monthly or Annual
   - **Items**: You can create a catalog item for "Personal Subscription" or leave blank
   - **Description**: "Personal tier subscription for Escalating Reminders"
   - Click **Save**
   - **Copy the Plan ID** (you'll see it in the plan details or URL)

4. **Create Pro Plan**:
   - Repeat steps above with:
     - **Plan Name**: "Pro"
     - **Price**: Set your Pro tier price (e.g., $19.99/month)
   - Copy the Plan ID

5. **Create Family Plan** (Optional):
   - Repeat steps above with:
     - **Plan Name**: "Family"
     - **Price**: Set your Family tier price (e.g., $29.99/month)
   - Copy the Plan ID

6. **Add Plan IDs to `.env`**:
   ```bash
   SQUARE_PLAN_PERSONAL=your-personal-plan-id-here
   SQUARE_PLAN_PRO=your-pro-plan-id-here
   SQUARE_PLAN_FAMILY=your-family-plan-id-here
   ```

#### Option B: Via Subscriptions API (For Programmatic Creation)

If you prefer to create plans programmatically:

1. Use the Square Subscriptions API `UpsertCatalogObject` endpoint
2. Create catalog objects for each subscription plan
3. Use the returned catalog object IDs as plan IDs

**Note**: Plan IDs are typically in format like `plan:XXXXX` or just the catalog object ID.

---

### 3. Configure Webhooks & Get Signature Key

#### Step-by-Step Instructions:

1. **Log in to Square Developer Dashboard**:
   - Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
   - Sign in with your Square account

2. **Select Your Application**:
   - Click on your application (either sandbox or production)
   - For sandbox: Use app with ID `sandbox-sq0idb-0H2RD-9_GtVX2NUU2Do6lw`
   - For production: Use app with ID `sq0idp-LR8I_51pXPGaSPaUtYNjgA`

3. **Navigate to Webhooks**:
   - In the left sidebar, click **Webhooks**
   - Or go to: **Settings** > **Webhooks**

4. **Create Webhook Subscription**:
   - Click **Add Webhook** or **Create Webhook**
   - **Webhook URL**: Enter your endpoint:
     - **Sandbox/Development**: `http://localhost:3801/v1/webhooks/square` (for local testing)
     - **Production**: `https://api.escalating-reminders.com/v1/webhooks/square`
   - **Note**: For local testing, you may need to use a tool like [ngrok](https://ngrok.com/) to expose your local server

5. **Subscribe to Events**:
   - Check the boxes for these events:
     - ✅ `subscription.created` - When a new subscription is created
     - ✅ `subscription.updated` - When subscription details change
     - ✅ `invoice.payment_made` - When payment succeeds
     - ✅ `invoice.payment_failed` - When payment fails
   - Click **Save** or **Create**

6. **Get Webhook Signature Key**:
   - After creating the webhook, you'll see a list of webhook subscriptions
   - Click on the webhook you just created to view details
   - Look for **"Signature Key"** or **"Webhook Signature"** field
   - Click **"Show"** or **"Reveal"** button to display the key
   - **Copy the signature key** (it's a long string, keep it secure!)

7. **Add Signature Key to `.env`**:
   ```bash
   SQUARE_WEBHOOK_SIGNATURE_KEY=your-signature-key-here
   ```

#### Important Notes:

- **Signature Key Security**: The signature key is used to verify webhook authenticity. Never commit it to git or share it publicly.
- **Different Keys for Sandbox/Production**: You'll have separate webhook signature keys for sandbox and production environments.
- **Local Testing**: For local development, use [ngrok](https://ngrok.com/) to create a public URL that forwards to `localhost:3801`:
  ```bash
  ngrok http 3801
  # Use the ngrok URL (e.g., https://abc123.ngrok.io/v1/webhooks/square)
  ```
- **Webhook Verification**: Your webhook handler must verify the signature using HMAC-SHA256. See implementation notes below.

### 4. Implementation Notes

When implementing the Square billing service, use these environment variables:

```typescript
// Example configuration helper
const getSquareConfig = () => {
  const env = process.env.SQUARE_ENVIRONMENT || 'sandbox';
  const isProduction = env === 'production';
  
  return {
    accessToken: isProduction 
      ? process.env.SQUARE_ACCESS_TOKEN_PRODUCTION
      : process.env.SQUARE_ACCESS_TOKEN_SANDBOX,
    applicationId: isProduction
      ? process.env.SQUARE_APPLICATION_ID_PRODUCTION
      : process.env.SQUARE_APPLICATION_ID_SANDBOX,
    environment: isProduction ? 'production' : 'sandbox',
    locationId: process.env.SQUARE_LOCATION_ID,
    webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    planIds: {
      personal: process.env.SQUARE_PLAN_PERSONAL,
      pro: process.env.SQUARE_PLAN_PRO,
      family: process.env.SQUARE_PLAN_FAMILY,
    },
  };
};
```

#### Webhook Signature Verification

When implementing webhook handling, verify the signature:

```typescript
import { createHmac } from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  const expectedSignature = hmac.update(payload).digest('base64');
  return signature === expectedSignature;
}

// In your webhook handler:
@Post('webhooks/square')
async handleWebhook(
  @Body() body: unknown,
  @Headers('x-square-signature') signature: string,
) {
  const isValid = verifyWebhookSignature(
    JSON.stringify(body),
    signature,
    process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!
  );
  
  if (!isValid) {
    throw new UnauthorizedException('Invalid webhook signature');
  }
  
  // Process webhook...
}
```

---

## Security Notes

⚠️ **Important**: 
- Never commit `.env` files to git (already in `.gitignore`)
- Rotate credentials if they are ever exposed
- Use sandbox credentials for development/testing
- Only use production credentials in production environment
- Store production credentials securely (use Railway/Vercel environment variables)

---

## Testing

Once the billing service is implemented:

1. **Sandbox Testing**:
   - Use Square sandbox test cards: https://developer.squareup.com/docs/testing/test-values
   - Test subscription creation, updates, and cancellations
   - Verify webhook handling

2. **Production**:
   - Switch `SQUARE_ENVIRONMENT=production` in production deployment
   - Ensure production credentials are set in production environment variables
   - Monitor webhook delivery and payment processing

---

## Resources

- [Square Developer Documentation](https://developer.squareup.com/docs)
- [Square Subscriptions API](https://developer.squareup.com/docs/subscriptions-api/overview)
- [Square Webhooks Guide](https://developer.squareup.com/docs/webhooks/overview)
- [Square Testing Guide](https://developer.squareup.com/docs/testing/test-values)

---

*This document should be updated as Square integration is implemented.*
