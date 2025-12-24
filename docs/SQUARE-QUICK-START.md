# Square Setup Quick Start Guide

> **Quick reference** for getting Square webhook signature key and creating subscription plans

---

## 🎯 Quick Checklist

- [ ] Get Webhook Signature Key
- [ ] Create Subscription Plans (Personal, Pro, Family)
- [ ] Add Plan IDs to `.env`
- [ ] Add Webhook Signature Key to `.env`

---

## 1️⃣ Get Webhook Signature Key (5 minutes)

### Steps:

1. **Go to**: [Square Developer Dashboard](https://developer.squareup.com/apps)
2. **Click** your application (sandbox or production)
3. **Click** "Webhooks" in left sidebar
4. **Click** "Add Webhook" or "Create Webhook"
5. **Enter URL**: 
   - Local: `http://localhost:3801/v1/webhooks/square` (use ngrok for testing)
   - Production: `https://api.escalating-reminders.com/v1/webhooks/square`
6. **Select Events**:
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `invoice.payment_made`
   - ✅ `invoice.payment_failed`
7. **Save** the webhook
8. **Click** on the webhook you just created
9. **Click** "Show" next to "Signature Key"
10. **Copy** the signature key
11. **Add to `.env`**:
    ```bash
    SQUARE_WEBHOOK_SIGNATURE_KEY=paste-key-here
    ```

---

## 2️⃣ Create Subscription Plans (10 minutes)

### Steps:

1. **Go to**: [Square Dashboard](https://squareup.com/dashboard)
2. **Click** "Items & Services" (or "Items & Menus")
3. **Click** "Subscription Plans" in left sidebar
4. **Click** "Create Plan" or "+ New Plan"

### For Each Plan (Personal, Pro, Family):

1. **Plan Name**: "Personal" (or "Pro", "Family")
2. **Price**: Set monthly price (e.g., $9.99, $19.99, $29.99)
3. **Billing**: Monthly
4. **Save** the plan
5. **Copy** the Plan ID (from URL or plan details)
6. **Add to `.env`**:
   ```bash
   SQUARE_PLAN_PERSONAL=plan-id-here
   SQUARE_PLAN_PRO=plan-id-here
   SQUARE_PLAN_FAMILY=plan-id-here
   ```

---

## 📝 Example `.env` Configuration

After completing both steps, your `.env` should look like:

```bash
# Square Configuration
SQUARE_ENVIRONMENT=sandbox
SQUARE_LOCATION_ID=LSWR97SDRBXWK
SQUARE_WEBHOOK_SIGNATURE_KEY=your-webhook-signature-key-here
SQUARE_PLAN_PERSONAL=plan:personal-plan-id
SQUARE_PLAN_PRO=plan:pro-plan-id
SQUARE_PLAN_FAMILY=plan:family-plan-id
```

---

## 🔍 Finding Plan IDs

Plan IDs can be found in several places:

1. **In Square Dashboard**:
   - Go to Subscription Plans
   - Click on a plan
   - Look in the URL: `.../plans/[PLAN_ID]`
   - Or check plan details page

2. **Via API**:
   - Use Square API to list catalog objects
   - Filter for subscription plans
   - Extract the object IDs

---

## 🧪 Testing Locally

For local webhook testing, use **ngrok**:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/

# Start ngrok tunnel
ngrok http 3801

# Use the ngrok URL in Square webhook configuration
# Example: https://abc123.ngrok.io/v1/webhooks/square
```

---

## ⚠️ Important Notes

- **Sandbox vs Production**: You need separate webhook configurations for each environment
- **Signature Key Security**: Never commit signature keys to git
- **Plan IDs**: Format is usually `plan:XXXXX` or just the catalog object ID
- **Webhook URL**: Must be publicly accessible (use ngrok for local dev)

---

## 📚 Additional Resources

- [Square Webhooks Documentation](https://developer.squareup.com/docs/webhooks/overview)
- [Square Subscriptions API](https://developer.squareup.com/docs/subscriptions-api/overview)
- [Square Dashboard Guide](https://squareup.com/help/us/en/article/7627-get-started-with-subscriptions-in-dashboard)

---

*For detailed instructions, see `docs/SQUARE-SETUP.md`*
