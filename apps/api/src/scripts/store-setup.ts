/**
 * Print how this app sells through the Noctusoft store.
 *
 * Catalog, prices, and hosted checkout live on store.noctusoft.com.
 * Do not create Square plans or hold SQUARE_* tokens.
 *
 *   RELAY_URL=https://store.noctusoft.com
 *   RELAY_API_KEY=nsk_…          # product key, scope billing
 *   RELAY_STORE=escalating-reminders
 *   STORE_MODE=test
 *   RELAY_WEBHOOK_SECRET=whsec_… # the store row's signing secret
 *
 * Then: POST /checkout { userId, email, plan, returnUrl, idempotencyKey }
 * Webhook: event v1, verify x-noctusoft-signature.
 * Contract: noctusoft-relay docs/api/store/README.md
 */

const alias = process.env.RELAY_STORE || 'escalating-reminders';
const base = (process.env.RELAY_URL || 'https://store.noctusoft.com').replace(/\/$/, '');

console.log('Noctusoft store — escalating-reminders');
console.log(`  catalog:  GET  ${base}/catalog   X-Test-Store: ${alias}`);
console.log(`  checkout: POST ${base}/checkout`);
console.log('  events:   purchase.paid, subscription.started, subscription.canceled, …');
console.log('  client:   noctusoft-relay/packages/store-client');
if (!process.env.RELAY_API_KEY) {
  console.log('  missing RELAY_API_KEY — issue a product key with scope billing');
  process.exitCode = 1;
}
