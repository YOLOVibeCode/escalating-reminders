/**
 * Square Setup Automation Script
 *
 * This script automates Square setup tasks:
 * 1. Create subscription plans (Personal, Pro, Family)
 * 2. Create webhook subscription
 * 3. Retrieve webhook signature key
 * 4. Update .env file with plan IDs and signature key
 *
 * Usage:
 *   npm run square:setup
 *   npm run square:setup -- --env=sandbox
 *   npm run square:setup -- --env=production
 *   npm run square:setup -- --webhook-url=https://api.escalating-reminders.com/v1/webhooks/square
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Dynamic import to handle installation issues
let Client: any;
let Environment: any;

function loadSquareSDK() {
  // Try multiple locations - correct package name is "square"
  // The package exports SquareClient and SquareEnvironment
  const locations = [
    // 1. Direct require (if installed locally)
    () => {
      try {
        const square = require('square');
        // Check for SquareClient/SquareEnvironment (new API) or Client/Environment (old API)
        if (square.SquareClient && square.SquareEnvironment) {
          return { Client: square.SquareClient, Environment: square.SquareEnvironment };
        }
        if (square.Client && square.Environment) {
          return { Client: square.Client, Environment: square.Environment };
        }
      } catch (e) {
        return null;
      }
      return null;
    },
    // 2. Temp install location (absolute path require)
    () => {
      try {
        const projectRoot = path.resolve(__dirname, '../../../../');
        const squarePath = path.join(projectRoot, '.temp-install/node_modules/square/index.js');
        if (fs.existsSync(squarePath)) {
          const square = require(squarePath);
          if (square.SquareClient && square.SquareEnvironment) {
            return { Client: square.SquareClient, Environment: square.SquareEnvironment };
          }
          if (square.Client && square.Environment) {
            return { Client: square.Client, Environment: square.Environment };
          }
        }
      } catch (e) {
        return null;
      }
      return null;
    },
    // 3. Root node_modules
    () => {
      try {
        const rootPath = require.resolve('square', { paths: [path.join(__dirname, '../../../../')] });
        const square = require(rootPath);
        if (square.SquareClient && square.SquareEnvironment) {
          return { Client: square.SquareClient, Environment: square.SquareEnvironment };
        }
        if (square.Client && square.Environment) {
          return { Client: square.Client, Environment: square.Environment };
        }
      } catch (e) {
        return null;
      }
      return null;
    },
  ];

  for (const tryLoad of locations) {
    const result = tryLoad();
    if (result && result.Client && result.Environment) {
      return result;
    }
  }

  // If all attempts fail, show helpful error
  console.error('❌ Error: Could not load square package');
  console.error('\n📦 Quick Fix - Install square SDK:');
  console.error('   npm install square --no-save --prefix .temp-install');
  console.error('\n   Then run:');
  console.error('   npm run square:setup');
  process.exit(1);
}

// Load environment variables
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️  Warning: .env file not found at', envPath);
  console.warn('   Loading from process.env instead');
}

function getArg(name: string): string | undefined {
  const arg = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : undefined;
}

function requireArg(name: string): string {
  const value = getArg(name);
  if (!value) {
    console.error(`❌ Error: --${name} argument is required`);
    process.exit(1);
  }
  return value;
}

function getSquareConfig() {
  const env = getArg('env') || process.env.SQUARE_ENVIRONMENT || 'sandbox';
  const isProduction = env === 'production';

  const accessToken = isProduction
    ? process.env.SQUARE_ACCESS_TOKEN_PRODUCTION
    : process.env.SQUARE_ACCESS_TOKEN_SANDBOX;

  const applicationId = isProduction
    ? process.env.SQUARE_APPLICATION_ID_PRODUCTION
    : process.env.SQUARE_APPLICATION_ID_SANDBOX;

  if (!accessToken) {
    throw new Error(
      `Missing SQUARE_ACCESS_TOKEN_${isProduction ? 'PRODUCTION' : 'SANDBOX'} in .env`,
    );
  }

  if (!applicationId) {
    throw new Error(
      `Missing SQUARE_APPLICATION_ID_${isProduction ? 'PRODUCTION' : 'SANDBOX'} in .env`,
    );
  }

  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    throw new Error('Missing SQUARE_LOCATION_ID in .env');
  }

  return {
    accessToken,
    applicationId,
    locationId,
    environment: isProduction ? Environment.Production : Environment.Sandbox,
    env,
  };
}

function updateEnvFile(updates: Record<string, string>) {
  if (!fs.existsSync(envPath)) {
    console.error(`❌ Error: .env file not found at ${envPath}`);
    console.error('   Please create the .env file first or run from the correct directory');
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  const updatedLines: string[] = [];
  const updatedKeys = new Set<string>();

  // Process existing lines
  for (const line of lines) {
    let updated = false;
    for (const [key, value] of Object.entries(updates)) {
      if (line.trim().startsWith(`${key}=`)) {
        updatedLines.push(`${key}=${value}`);
        updatedKeys.add(key);
        updated = true;
        console.log(`✅ Updated ${key} in .env`);
        break;
      }
    }
    if (!updated) {
      updatedLines.push(line);
    }
  }

  // Add any new keys that weren't found
  for (const [key, value] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      updatedLines.push(`${key}=${value}`);
      console.log(`✅ Added ${key} to .env`);
    }
  }

  fs.writeFileSync(envPath, updatedLines.join('\n'));
  console.log('\n✅ .env file updated successfully');
}

async function createSubscriptionPlan(
  client: any, // Using any since Client is a value, not a type
  locationId: string,
  name: string,
  priceCents: number,
): Promise<string> {
  console.log(`\n📦 Creating subscription plan: ${name} ($${(priceCents / 100).toFixed(2)}/month)`);

  // Access catalog API - Square SDK uses getters: client.catalog
  const catalogApi = (client as any).catalog;

  try {
    // Create subscription plan as catalog object using batchUpsert
    // Square SDK uses catalog.batchUpsert for creating catalog objects
    const response = await catalogApi.batchUpsert({
      idempotencyKey: `plan-${name.toLowerCase()}-${Date.now()}`,
      batches: [
        {
          objects: [
            {
              type: 'SUBSCRIPTION_PLAN',
              id: `#${name.toLowerCase()}-plan`,
              subscriptionPlanData: {
                name: `${name} Plan`,
                phases: [
                  {
                    cadence: 'MONTHLY',
                    recurringPriceMoney: {
                      amount: BigInt(priceCents),
                      currency: 'USD',
                    },
                    ordinal: BigInt(0),
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    if (response.result.errors && response.result.errors.length > 0) {
      throw new Error(`Square API errors: ${JSON.stringify(response.result.errors)}`);
    }

    // batchUpsert returns batches with ids
    const batch = response.result.idMappings?.[0];
    if (!batch || !batch.clientObjectId || !batch.objectId) {
      throw new Error('Failed to create subscription plan - no ID returned');
    }

    const planId = batch.objectId;
    console.log(`   ✅ Created plan with ID: ${planId}`);
    return planId;
  } catch (error: any) {
    console.error(`   ❌ Error creating plan: ${error.message}`);
    throw error;
  }
}

async function createWebhookSubscription(
  client: any, // Using any since Client is a value, not a type
  webhookUrl: string,
): Promise<{ subscriptionId: string; signatureKey: string }> {
  console.log(`\n🔔 Creating webhook subscription`);
  console.log(`   URL: ${webhookUrl}`);

  // Access webhook subscriptions API - Square SDK uses getters: client.webhooks.subscriptions
  const webhookSubscriptionsApi = (client as any).webhooks?.subscriptions;

  if (!webhookSubscriptionsApi) {
    throw new Error('Webhook subscriptions API not available. Check Square SDK version.');
  }

  try {
    const response = await webhookSubscriptionsApi.createWebhookSubscription({
      idempotencyKey: `webhook-${Date.now()}`,
      subscription: {
        name: 'Escalating Reminders Webhook',
        eventTypes: [
          'subscription.created',
          'subscription.updated',
          'invoice.payment_made',
          'invoice.payment_failed',
        ],
        notificationUrl: webhookUrl,
        apiVersion: '2025-10-16',
      },
    });

    if (response.result.errors && response.result.errors.length > 0) {
      throw new Error(`Square API errors: ${JSON.stringify(response.result.errors)}`);
    }

    const subscription = response.result.subscription;
    if (!subscription || !subscription.id || !subscription.signatureKey) {
      throw new Error('Failed to create webhook - missing ID or signature key');
    }

    console.log(`   ✅ Created webhook subscription`);
    console.log(`   Subscription ID: ${subscription.id}`);
    console.log(`   Signature Key: ${subscription.signatureKey.substring(0, 20)}...`);

    return {
      subscriptionId: subscription.id,
      signatureKey: subscription.signatureKey,
    };
  } catch (error: any) {
    console.error(`   ❌ Error creating webhook: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('🚀 Square Setup Automation\n');

  // Load Square SDK
  const sdk = loadSquareSDK();
  Client = sdk.Client;
  Environment = sdk.Environment;

  const config = getSquareConfig();
  console.log(`Environment: ${config.env}`);
  console.log(`Location ID: ${config.locationId}`);
  console.log(`Access Token: ${config.accessToken.substring(0, 15)}...`);

  // Initialize Square client
  const client = new Client({
    accessToken: config.accessToken,
    environment: config.environment,
  });

  const updates: Record<string, string> = {};

  try {
    // 1. Create subscription plans
    console.log('\n📋 Step 1: Creating Subscription Plans');
    console.log('─'.repeat(50));

    const personalPlanId = await createSubscriptionPlan(client, config.locationId, 'Personal', 999); // $9.99
    updates.SQUARE_PLAN_PERSONAL = personalPlanId;

    const proPlanId = await createSubscriptionPlan(client, config.locationId, 'Pro', 1999); // $19.99
    updates.SQUARE_PLAN_PRO = proPlanId;

    const familyPlanId = await createSubscriptionPlan(client, config.locationId, 'Family', 2999); // $29.99
    updates.SQUARE_PLAN_FAMILY = familyPlanId;

    // 2. Create webhook subscription
    console.log('\n📋 Step 2: Creating Webhook Subscription');
    console.log('─'.repeat(50));

    const webhookUrl =
      getArg('webhook-url') ||
      process.env.SQUARE_WEBHOOK_URL ||
      (config.env === 'production'
        ? 'https://api.escalating-reminders.com/v1/webhooks/square'
        : 'http://localhost:3801/v1/webhooks/square');

    const { signatureKey } = await createWebhookSubscription(client, webhookUrl);
    updates.SQUARE_WEBHOOK_SIGNATURE_KEY = signatureKey;

    // 3. Update .env file
    console.log('\n📋 Step 3: Updating .env File');
    console.log('─'.repeat(50));
    updateEnvFile(updates);

    console.log('\n✅ Square setup completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   Personal Plan ID: ${personalPlanId}`);
    console.log(`   Pro Plan ID: ${proPlanId}`);
    console.log(`   Family Plan ID: ${familyPlanId}`);
    console.log(`   Webhook Signature Key: ${signatureKey.substring(0, 20)}...`);
    console.log('\n⚠️  Next steps:');
    console.log('   1. Verify plan IDs in Square Dashboard');
    console.log('   2. Test webhook delivery');
    console.log('   3. Update webhook URL in Square Dashboard if needed');
  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.response?.body) {
      console.error('   API Response:', JSON.stringify(error.response.body, null, 2));
    }
    if (error.result?.errors) {
      console.error('   Square API Errors:', JSON.stringify(error.result.errors, null, 2));
    }
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verify Square credentials in .env are correct');
    console.error('   2. Check Location ID is valid');
    console.error('   3. Ensure API permissions are enabled in Square Dashboard');
    console.error('   4. For sandbox, verify you\'re using sandbox credentials');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
