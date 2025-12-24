# Square Setup - Quick Reference

Quick checklist for manual Square configuration.

---

## ✅ Checklist

- [ ] Created Personal Plan ($9.99/month) → Get Plan ID
- [ ] Created Pro Plan ($19.99/month) → Get Plan ID  
- [ ] Created Family Plan ($29.99/month) → Get Plan ID
- [ ] Created Webhook Subscription → Get Signature Key
- [ ] Updated `.env` with all values

---

## 📝 Values to Add to `.env`

Add these to `apps/api/.env`:

```bash
# Subscription Plan IDs (from Square Dashboard → Catalog)
SQUARE_PLAN_PERSONAL=<plan-id-from-square>
SQUARE_PLAN_PRO=<plan-id-from-square>
SQUARE_PLAN_FAMILY=<plan-id-from-square>

# Webhook Signature Key (from Square Dashboard → Webhooks)
SQUARE_WEBHOOK_SIGNATURE_KEY=<signature-key-from-square>
```

---

## 🔗 Square Dashboard Links

- **Square Dashboard**: https://squareup.com/dashboard
- **Developer Dashboard**: https://developer.squareup.com/apps
- **Catalog/Items**: https://squareup.com/dashboard/items
- **Webhooks**: https://developer.squareup.com/apps/{app-id}/webhooks

---

## 📋 Step-by-Step Summary

### 1. Create Plans (5 minutes)
- Square Dashboard → Items → Catalog → Create Subscription Plan
- Create 3 plans: Personal ($9.99), Pro ($19.99), Family ($29.99)
- Copy Plan IDs → Add to `.env`

### 2. Create Webhook (5 minutes)
- Square Developer Dashboard → Webhooks → Create Subscription
- URL: `https://your-ngrok-url.ngrok.io/v1/webhooks/square` (local)
- Select events: `subscription.*`, `invoice.payment_*`
- Copy Signature Key → Add to `.env`

### 3. Verify (2 minutes)
- Check all values in `.env` are filled
- Test webhook delivery (optional)

---

## 🚀 That's It!

Once all values are in `.env`, you're ready to:
- Implement billing service
- Create subscription endpoints
- Handle webhook events

See `docs/SQUARE-MANUAL-SETUP.md` for detailed instructions.
