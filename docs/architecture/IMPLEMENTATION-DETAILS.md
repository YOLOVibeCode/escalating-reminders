# Implementation Details Specification

> **Version**: 1.0.0  
> **Last Updated**: December 2024

---

## Overview

This document covers implementation details that bridge the gap between high-level architecture and actual code. It provides specifications for features that require detailed implementation guidance.

---

## 1. Environment Configuration

### API Environment (.env.example)

```bash
# apps/api/.env.example

# ============================================
# APPLICATION
# ============================================
NODE_ENV=development
PORT=3801
API_URL=http://localhost:3801

# ============================================
# DATABASE
# ============================================
# PostgreSQL connection (direct for migrations)
DATABASE_URL="postgresql://postgres:postgres@localhost:3802/escalating_reminders?schema=public"

# Pooled connection (for production with PgBouncer)
# DATABASE_URL_POOLED="postgresql://postgres:postgres@localhost:6543/escalating_reminders?schema=public&pgbouncer=true"

# ============================================
# REDIS
# ============================================
REDIS_URL="redis://localhost:3803"

# ============================================
# AUTHENTICATION
# ============================================
# Generate with: openssl rand -hex 32
JWT_SECRET="your-32-byte-hex-secret-for-access-tokens"
JWT_REFRESH_SECRET="your-32-byte-hex-secret-for-refresh-tokens"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# ============================================
# ENCRYPTION
# ============================================
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY="your-32-byte-hex-encryption-key"

# ============================================
# SQUARE PAYMENTS
# ============================================
SQUARE_ACCESS_TOKEN=""
SQUARE_ENVIRONMENT="sandbox"  # or "production"
SQUARE_APPLICATION_ID=""
SQUARE_LOCATION_ID=""
SQUARE_WEBHOOK_SIGNATURE_KEY=""

# Subscription Plan IDs (create in Square Dashboard)
SQUARE_PLAN_PERSONAL=""
SQUARE_PLAN_PRO=""
SQUARE_PLAN_FAMILY=""

# ============================================
# TWILIO (SMS)
# ============================================
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_WEBHOOK_URL="https://api.escalating-reminders.com/webhooks/twilio"

# ============================================
# SENDGRID (EMAIL)
# ============================================
SENDGRID_API_KEY=""
SENDGRID_FROM_EMAIL="reminders@escalating-reminders.com"
SENDGRID_FROM_NAME="Escalating Reminders"

# ============================================
# OPENAI (NLP)
# ============================================
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"

# ============================================
# GOOGLE CALENDAR (OAuth)
# ============================================
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3801/oauth/google/callback"

# ============================================
# MICROSOFT / OUTLOOK (OAuth)
# ============================================
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""
MICROSOFT_REDIRECT_URI="http://localhost:3801/oauth/microsoft/callback"

# ============================================
# MONITORING
# ============================================
SENTRY_DSN=""

# ============================================
# FEATURE FLAGS
# ============================================
FEATURE_SOCIAL_ESCALATION=true
FEATURE_CALENDAR_SYNC=true
FEATURE_EMAIL_WATCHERS=true
FEATURE_MARKETPLACE=false
FEATURE_APPLE_WATCH=false
FEATURE_ALEXA=false
```

### Frontend Environment (.env.example)

```bash
# apps/web/.env.example

# ============================================
# API CONNECTION
# ============================================
NEXT_PUBLIC_API_URL=http://localhost:3801

# ============================================
# FEATURE FLAGS
# ============================================
NEXT_PUBLIC_FEATURE_MARKETPLACE=false
NEXT_PUBLIC_FEATURE_CALENDAR_SYNC=true
NEXT_PUBLIC_FEATURE_SOCIAL_ESCALATION=true

# ============================================
# ANALYTICS (Optional)
# ============================================
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

---

## 2. Natural Language Snooze Parsing

### Overview

Users can snooze reminders using natural language expressions. The system parses these into specific dates/times.

### Supported Patterns

| Pattern | Example | Parsed Result |
|---------|---------|---------------|
| Relative time | "for 3 hours" | now + 3 hours |
| Relative days | "for 2 days" | now + 48 hours |
| Until specific day | "until Friday" | Next Friday 9am |
| Until specific time | "until 5pm" | Today/Tomorrow at 5pm |
| Until date | "until December 25" | Dec 25 at 9am |
| Until full datetime | "until Friday at 3pm" | Next Friday at 3pm |
| Contextual | "until my kids are back" | Calendar lookup |
| Tomorrow | "until tomorrow" | Tomorrow at 9am |
| Next week | "until next week" | Next Monday at 9am |

### Implementation

```typescript
// packages/@er/utils/src/date/natural-language-parser.ts

import { parseDate } from 'chrono-node';
import OpenAI from 'openai';

export interface ParsedSnooze {
  snoozeUntil: Date;
  confidence: number;  // 0-1
  interpretation: string;
  requiresCalendarLookup: boolean;
  calendarSearchTerm?: string;
}

export interface ISnoozeParser {
  parse(
    input: string,
    timezone: string,
    referenceDate?: Date,
  ): Promise<ParsedSnooze>;
}

/**
 * Primary parser using chrono-node for common patterns.
 * Falls back to OpenAI for complex expressions.
 */
export class NaturalLanguageSnoozeParser implements ISnoozeParser {
  private openai: OpenAI;
  
  constructor(openaiApiKey: string) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  async parse(
    input: string,
    timezone: string,
    referenceDate: Date = new Date(),
  ): Promise<ParsedSnooze> {
    const normalized = input.toLowerCase().trim();
    
    // Step 1: Try chrono-node first (fast, no API call)
    const chronoResult = this.tryChronoParse(normalized, timezone, referenceDate);
    if (chronoResult && chronoResult.confidence > 0.8) {
      return chronoResult;
    }
    
    // Step 2: Check for calendar-dependent expressions
    if (this.isCalendarDependent(normalized)) {
      return {
        snoozeUntil: new Date(0), // Placeholder
        confidence: 0.9,
        interpretation: `Calendar lookup required: "${normalized}"`,
        requiresCalendarLookup: true,
        calendarSearchTerm: this.extractCalendarTerm(normalized),
      };
    }
    
    // Step 3: Fall back to OpenAI for complex expressions
    return this.parseWithOpenAI(input, timezone, referenceDate);
  }

  private tryChronoParse(
    input: string,
    timezone: string,
    referenceDate: Date,
  ): ParsedSnooze | null {
    const results = parseDate(input, referenceDate, {
      forwardDate: true,
      timezone,
    });
    
    if (results) {
      return {
        snoozeUntil: results,
        confidence: 0.9,
        interpretation: `Parsed as: ${results.toISOString()}`,
        requiresCalendarLookup: false,
      };
    }
    
    return null;
  }

  private isCalendarDependent(input: string): boolean {
    const calendarPatterns = [
      /until (my |the )?kids/i,
      /until (my |the )?appointment/i,
      /until after (my |the )?meeting/i,
      /until (my |the )?vacation/i,
      /when .* (ends|starts|is over)/i,
    ];
    
    return calendarPatterns.some(pattern => pattern.test(input));
  }

  private extractCalendarTerm(input: string): string {
    // Extract the event name for calendar search
    const match = input.match(/until (?:my |the )?(.+?)(?:\s+(?:is|ends|starts))?$/i);
    return match ? match[1] : input;
  }

  private async parseWithOpenAI(
    input: string,
    timezone: string,
    referenceDate: Date,
  ): Promise<ParsedSnooze> {
    const prompt = `
Parse this snooze duration into a specific date/time.

Input: "${input}"
Current time: ${referenceDate.toISOString()}
Timezone: ${timezone}

Respond with JSON only:
{
  "snoozeUntil": "ISO8601 datetime string",
  "interpretation": "human readable explanation"
}

If the input is ambiguous or requires calendar lookup, set snoozeUntil to null.
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 150,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      snoozeUntil: result.snoozeUntil ? new Date(result.snoozeUntil) : new Date(),
      confidence: result.snoozeUntil ? 0.85 : 0.5,
      interpretation: result.interpretation || 'Parsed by AI',
      requiresCalendarLookup: !result.snoozeUntil,
    };
  }
}
```

### Calendar-Based Snooze Resolution

```typescript
// domains/reminders/services/snooze-resolver.service.ts

@Injectable()
export class SnoozeResolverService {
  constructor(
    private parser: NaturalLanguageSnoozeParser,
    private calendarService: ICalendarService,
  ) {}

  async resolveSnoozeUntil(
    userId: string,
    input: string,
    timezone: string,
  ): Promise<Date> {
    const parsed = await this.parser.parse(input, timezone);
    
    if (!parsed.requiresCalendarLookup) {
      return parsed.snoozeUntil;
    }
    
    // Search user's calendars for matching event
    const events = await this.calendarService.searchEvents(
      userId,
      parsed.calendarSearchTerm!,
    );
    
    if (events.length === 0) {
      throw new ValidationError(
        `Could not find calendar event matching "${parsed.calendarSearchTerm}"`,
      );
    }
    
    // Use the end time of the first matching event
    const event = events[0];
    return event.endTime;
  }
}
```

---

## 3. SMS Command Parsing

### Supported SMS Commands

Users can reply to SMS notifications with commands:

| Command | Pattern | Example |
|---------|---------|---------|
| Snooze (relative) | `SNOOZE <duration>` | "SNOOZE 3h", "SNOOZE 2d" |
| Snooze (until) | `SNOOZE UNTIL <time>` | "SNOOZE UNTIL 5pm" |
| Dismiss | `DISMISS`, `OK`, `D` | "DISMISS" |
| Complete | `COMPLETE`, `DONE`, `C` | "DONE" |
| Help | `HELP`, `?` | "HELP" |
| Status | `STATUS` | "STATUS" |

### Implementation

```typescript
// domains/agents/sms/sms-command-parser.ts

export interface ParsedSmsCommand {
  action: 'snooze' | 'dismiss' | 'complete' | 'help' | 'status' | 'unknown';
  snoozeDuration?: string;
  confidence: number;
  rawInput: string;
}

export class SmsCommandParser {
  parse(message: string): ParsedSmsCommand {
    const normalized = message.trim().toUpperCase();
    
    // Snooze with duration
    const snoozeMatch = normalized.match(/^SNOOZE\s+(?:FOR\s+)?(\d+)([HMDS])/i);
    if (snoozeMatch) {
      const [, amount, unit] = snoozeMatch;
      return {
        action: 'snooze',
        snoozeDuration: `for ${amount}${this.expandUnit(unit)}`,
        confidence: 1.0,
        rawInput: message,
      };
    }
    
    // Snooze until
    const snoozeUntilMatch = normalized.match(/^SNOOZE\s+UNTIL\s+(.+)$/i);
    if (snoozeUntilMatch) {
      return {
        action: 'snooze',
        snoozeDuration: `until ${snoozeUntilMatch[1].toLowerCase()}`,
        confidence: 0.9,
        rawInput: message,
      };
    }
    
    // Generic snooze (default 1 hour)
    if (/^SNOOZE$/i.test(normalized)) {
      return {
        action: 'snooze',
        snoozeDuration: 'for 1 hour',
        confidence: 1.0,
        rawInput: message,
      };
    }
    
    // Dismiss
    if (/^(DISMISS|OK|D|DIS)$/i.test(normalized)) {
      return { action: 'dismiss', confidence: 1.0, rawInput: message };
    }
    
    // Complete
    if (/^(COMPLETE|DONE|C|FINISHED|YES)$/i.test(normalized)) {
      return { action: 'complete', confidence: 1.0, rawInput: message };
    }
    
    // Help
    if (/^(HELP|\?)$/i.test(normalized)) {
      return { action: 'help', confidence: 1.0, rawInput: message };
    }
    
    // Status
    if (/^STATUS$/i.test(normalized)) {
      return { action: 'status', confidence: 1.0, rawInput: message };
    }
    
    // Unknown - try to infer
    return {
      action: 'unknown',
      confidence: 0,
      rawInput: message,
    };
  }

  private expandUnit(unit: string): string {
    const units: Record<string, string> = {
      'H': ' hours',
      'M': ' minutes',
      'D': ' days',
      'S': ' seconds',
    };
    return units[unit.toUpperCase()] || ` ${unit}`;
  }
  
  getHelpMessage(): string {
    return `Commands:
SNOOZE 1H - Snooze for 1 hour
SNOOZE 2D - Snooze for 2 days
SNOOZE UNTIL 5PM - Snooze until 5pm
DONE - Mark complete
DISMISS - Acknowledge
HELP - Show commands`;
  }
}
```

---

## 4. Notification Templates

### Email Templates

```typescript
// domains/notifications/templates/email.templates.ts

export const EMAIL_TEMPLATES = {
  REMINDER_NOTIFICATION: {
    subject: '🔔 Reminder: {{title}}',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
    .header { background: {{tierColor}}; color: white; padding: 20px; text-align: center; }
    .body { padding: 20px; }
    .actions { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
    .btn { padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; }
    .btn-primary { background: #3498db; color: white; }
    .btn-secondary { background: #95a5a6; color: white; }
    .tier-badge { font-size: 12px; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{title}}</h1>
      <div class="tier-badge">Escalation Tier {{tier}}</div>
    </div>
    <div class="body">
      <p>{{message}}</p>
      {{#if description}}
        <p style="color: #666;">{{description}}</p>
      {{/if}}
      
      <div class="actions">
        <a href="{{completeUrl}}" class="btn btn-primary">✓ Complete</a>
        <a href="{{snoozeUrl}}" class="btn btn-secondary">⏰ Snooze</a>
        <a href="{{dismissUrl}}" class="btn btn-secondary">✗ Dismiss</a>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  },
  
  WELCOME: {
    subject: 'Welcome to Escalating Reminders! 🎉',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .body { padding: 30px; }
    .step { display: flex; align-items: flex-start; margin: 20px 0; }
    .step-number { background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; }
    .btn { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome, {{displayName}}! 🎉</h1>
      <p>You're all set to never miss an important reminder again.</p>
    </div>
    <div class="body">
      <h2>Get Started in 3 Steps:</h2>
      
      <div class="step">
        <div class="step-number">1</div>
        <div>
          <strong>Create Your First Reminder</strong>
          <p>Set up a reminder with the importance level and schedule that works for you.</p>
        </div>
      </div>
      
      <div class="step">
        <div class="step-number">2</div>
        <div>
          <strong>Choose Your Escalation Profile</strong>
          <p>Select how aggressively we should remind you - from Gentle to Critical.</p>
        </div>
      </div>
      
      <div class="step">
        <div class="step-number">3</div>
        <div>
          <strong>Connect Your Channels</strong>
          <p>Add SMS, email, or other notification agents for multi-channel reminders.</p>
        </div>
      </div>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="{{dashboardUrl}}" class="btn">Go to Dashboard →</a>
      </p>
    </div>
  </div>
</body>
</html>
    `,
  },
  
  TRUSTED_CONTACT_ALERT: {
    subject: '⚠️ {{contactName}} needs your attention',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
    .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
    .body { padding: 20px; }
    .alert-box { background: #fdf2f2; border: 2px solid #e74c3c; border-radius: 8px; padding: 20px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Trusted Contact Alert</h1>
    </div>
    <div class="body">
      <p>Hello {{recipientName}},</p>
      
      <p>You're receiving this because {{contactName}} hasn't responded to an important reminder:</p>
      
      <div class="alert-box">
        <h3>{{reminderTitle}}</h3>
        <p><strong>Importance:</strong> {{importance}}</p>
        <p><strong>Escalation Tier:</strong> {{tier}} (highest)</p>
        <p><strong>Time since reminder:</strong> {{timeSinceTriggered}}</p>
      </div>
      
      <p>You may want to check in on them.</p>
      
      <p style="color: #666; font-size: 12px;">
        You're receiving this because {{contactName}} added you as a trusted contact
        for important reminders.
      </p>
    </div>
  </div>
</body>
</html>
    `,
  },
  
  PAYMENT_RECEIPT: {
    subject: 'Payment Receipt - Escalating Reminders',
    html: `...`,
  },
  
  SUBSCRIPTION_CANCELED: {
    subject: 'Your subscription has been canceled',
    html: `...`,
  },
};

// Tier colors for email styling
export const TIER_COLORS: Record<number, string> = {
  1: '#3498db', // Blue
  2: '#f39c12', // Orange
  3: '#e67e22', // Dark Orange
  4: '#e74c3c', // Red
  5: '#c0392b', // Dark Red
};
```

### SMS Templates

```typescript
// domains/notifications/templates/sms.templates.ts

export const SMS_TEMPLATES = {
  REMINDER_NOTIFICATION: `🔔 {{title}}
{{#if tier > 1}}[Tier {{tier}}] {{/if}}
{{message}}

Reply: DONE to complete, SNOOZE 1H to snooze, HELP for options`,

  REMINDER_ESCALATED: `⚠️ URGENT: {{title}}
Escalation Level {{tier}}
{{message}}

Reply DONE, SNOOZE, or HELP`,

  TRUSTED_CONTACT_ALERT: `⚠️ ALERT: {{contactName}} hasn't responded to "{{reminderTitle}}" after {{timeSinceTriggered}}. You may want to check in.`,

  SNOOZE_CONFIRMED: `✓ Snoozed until {{snoozeUntil}}. We'll remind you then.`,

  COMPLETE_CONFIRMED: `✓ "{{title}}" marked as complete. Great job!`,

  HELP: `Escalating Reminders Commands:
DONE - Complete reminder
SNOOZE 1H - Snooze 1 hour
SNOOZE 2D - Snooze 2 days
DISMISS - Stop this reminder
STATUS - Check pending
HELP - Show this message`,
};
```

---

## 5. Square Integration Details

### Subscription Catalog Setup

Before the app can process subscriptions, you need to create subscription plans in Square:

```typescript
// tools/scripts/setup-square-catalog.ts

import { Client, Environment } from 'square';

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox, // Change for production
});

async function createSubscriptionPlans() {
  const catalogApi = client.catalogApi;
  
  // Create subscription plans
  const response = await catalogApi.batchUpsertCatalogObjects({
    idempotencyKey: 'escalating-reminders-plans-v1',
    batches: [
      {
        objects: [
          // Personal Plan - $5/month
          {
            type: 'SUBSCRIPTION_PLAN',
            id: '#personal-plan',
            subscriptionPlanData: {
              name: 'Personal',
              phases: [
                {
                  cadence: 'MONTHLY',
                  recurringPriceMoney: {
                    amount: BigInt(500), // $5.00
                    currency: 'USD',
                  },
                },
              ],
            },
          },
          // Pro Plan - $15/month
          {
            type: 'SUBSCRIPTION_PLAN',
            id: '#pro-plan',
            subscriptionPlanData: {
              name: 'Pro',
              phases: [
                {
                  cadence: 'MONTHLY',
                  recurringPriceMoney: {
                    amount: BigInt(1500), // $15.00
                    currency: 'USD',
                  },
                },
              ],
            },
          },
          // Family Plan - $25/month
          {
            type: 'SUBSCRIPTION_PLAN',
            id: '#family-plan',
            subscriptionPlanData: {
              name: 'Family',
              phases: [
                {
                  cadence: 'MONTHLY',
                  recurringPriceMoney: {
                    amount: BigInt(2500), // $25.00
                    currency: 'USD',
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  });

  console.log('Created plans:', response.result.objects);
  
  // Store the catalog object IDs in your .env
  // SQUARE_PLAN_PERSONAL=<id from response>
  // SQUARE_PLAN_PRO=<id from response>
  // SQUARE_PLAN_FAMILY=<id from response>
}
```

### Webhook Handling

```typescript
// domains/billing/webhooks/square-webhook.handler.ts

import { createHmac } from 'crypto';

@Controller('webhooks/square')
export class SquareWebhookController {
  constructor(
    private billingService: IBillingService,
    private eventBus: IEventBus,
  ) {}

  @Post()
  async handleWebhook(
    @Body() body: unknown,
    @Headers('x-square-signature') signature: string,
    @Req() req: Request,
  ) {
    // Verify signature
    const isValid = this.verifySignature(
      JSON.stringify(body),
      signature,
      process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!,
    );
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const event = body as SquareWebhookEvent;
    
    switch (event.type) {
      case 'subscription.created':
        await this.handleSubscriptionCreated(event.data.object.subscription);
        break;
        
      case 'subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object.subscription);
        break;
        
      case 'invoice.payment_made':
        await this.handlePaymentMade(event.data.object.invoice);
        break;
        
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object.invoice);
        break;
    }

    return { received: true };
  }

  private verifySignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const hmac = createHmac('sha256', secret);
    const expectedSignature = hmac.update(payload).digest('base64');
    return signature === expectedSignature;
  }

  private async handleSubscriptionCreated(subscription: SquareSubscription) {
    const userId = await this.findUserBySquareCustomerId(subscription.customerId);
    
    await this.billingService.activateSubscription(userId, {
      squareSubscriptionId: subscription.id,
      tier: this.mapPlanToTier(subscription.planId),
      startDate: new Date(subscription.startDate),
    });
    
    await this.eventBus.publish({
      type: 'billing.subscription_created',
      payload: { userId, tier: this.mapPlanToTier(subscription.planId) },
    });
  }

  // ... other handlers
}
```

---

## 6. Onboarding Flow

### Onboarding Steps

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ONBOARDING FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Step 1: WELCOME                                                        │
│   ─────────────────                                                      │
│   • Display name & timezone setup                                       │
│   • Brief introduction to the app                                       │
│                                                                          │
│   Step 2: FIRST REMINDER                                                 │
│   ──────────────────────                                                 │
│   • Create first reminder (guided)                                      │
│   • Explain importance levels                                           │
│   • Set schedule                                                         │
│                                                                          │
│   Step 3: ESCALATION PROFILE                                            │
│   ──────────────────────────                                             │
│   • Explain escalation concept                                          │
│   • Choose from presets (Gentle, Urgent, Critical)                     │
│   • Preview what will happen at each tier                              │
│                                                                          │
│   Step 4: NOTIFICATION CHANNEL                                          │
│   ────────────────────────────                                           │
│   • Subscribe to at least one agent                                     │
│   • Test notification delivery                                          │
│                                                                          │
│   Step 5: COMPLETION (Optional)                                         │
│   ─────────────────────────────                                          │
│   • Show upgrade options                                                │
│   • Introduce advanced features                                         │
│   • Mark onboarding complete                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Onboarding State

```typescript
// Added to UserProfile

interface OnboardingState {
  completed: boolean;
  currentStep: number;
  completedSteps: string[];
  skippedAt?: Date;
  completedAt?: Date;
}

// API Endpoints
GET /onboarding/status
POST /onboarding/step/:step/complete
POST /onboarding/skip
```

---

## 7. Error Handling Strategy

### Global Error Response Format

```typescript
// All errors follow this format
interface ApiError {
  success: false;
  error: {
    code: string;           // Machine-readable code
    message: string;        // Human-readable message
    details?: ErrorDetail[];// Field-level errors
    requestId: string;      // For support/debugging
  };
  meta: {
    timestamp: string;
  };
}

interface ErrorDetail {
  field: string;
  message: string;
  code?: string;
}
```

### Error Classes

```typescript
// packages/@er/utils/src/errors/index.ts

export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly details?: ErrorDetail[];
  
  toResponse(): ApiError {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        requestId: '', // Added by middleware
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  
  constructor(message: string, details?: ErrorDetail[]) {
    super(message);
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;
}

export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
}

export class ConflictError extends AppError {
  readonly code = 'CONFLICT';
  readonly statusCode = 409;
}

export class QuotaExceededError extends AppError {
  readonly code = 'QUOTA_EXCEEDED';
  readonly statusCode = 422;
}

export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMITED';
  readonly statusCode = 429;
}

export class ExternalServiceError extends AppError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly statusCode = 502;
  
  constructor(service: string, originalError?: Error) {
    super(`External service error: ${service}`);
  }
}
```

### Global Exception Filter

```typescript
// apps/api/src/filters/global-exception.filter.ts

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private logger: ILogger,
    @Inject(REQUEST) private request: Request,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const requestId = this.request.headers['x-request-id'] || uuid();
    
    let error: ApiError;
    
    if (exception instanceof AppError) {
      error = exception.toResponse();
      error.error.requestId = requestId;
      
      this.logger.warn(`AppError: ${exception.code}`, {
        requestId,
        code: exception.code,
        message: exception.message,
      });
    } else if (exception instanceof HttpException) {
      error = {
        success: false,
        error: {
          code: 'HTTP_EXCEPTION',
          message: exception.message,
          requestId,
        },
        meta: { timestamp: new Date().toISOString() },
      };
    } else {
      // Unexpected error - log full details
      this.logger.error('Unexpected error', exception as Error, { requestId });
      
      error = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          requestId,
        },
        meta: { timestamp: new Date().toISOString() },
      };
    }
    
    response
      .status(exception instanceof AppError ? exception.statusCode : 500)
      .json(error);
  }
}
```

---

## 8. Testing Strategy Details

### Mock Factory Pattern

```typescript
// packages/@er/testing/src/mocks/reminder.mock.ts

import type { Reminder, ReminderStatus, ReminderImportance } from '@er/types';
import { faker } from '@faker-js/faker';

export function createMockReminder(overrides?: Partial<Reminder>): Reminder {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    title: faker.lorem.sentence({ min: 3, max: 6 }),
    description: faker.lorem.paragraph(),
    importance: faker.helpers.enumValue(ReminderImportance),
    status: ReminderStatus.ACTIVE,
    escalationProfileId: faker.string.uuid(),
    nextTriggerAt: faker.date.future(),
    lastTriggeredAt: null,
    completedAt: null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

export function createMockReminders(count: number): Reminder[] {
  return Array.from({ length: count }, () => createMockReminder());
}
```

### Test Database Setup

```typescript
// packages/@er/testing/src/setup/test-database.ts

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

let prisma: PrismaClient;

export async function setupTestDatabase(): Promise<PrismaClient> {
  // Use test database URL
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  
  // Run migrations
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  prisma = new PrismaClient();
  await prisma.$connect();
  
  return prisma;
}

export async function cleanupTestDatabase(): Promise<void> {
  // Delete all data in reverse dependency order
  await prisma.notificationLog.deleteMany();
  await prisma.escalationState.deleteMany();
  await prisma.reminderSnooze.deleteMany();
  await prisma.reminderSchedule.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.userAgentSubscription.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
}

export async function teardownTestDatabase(): Promise<void> {
  await prisma.$disconnect();
}
```

### Integration Test Example

```typescript
// apps/api/__tests__/integration/reminders.integration.spec.ts

import { setupTestDatabase, cleanupTestDatabase } from '@er/testing';

describe('Reminders Integration', () => {
  let prisma: PrismaClient;
  let testUser: User;
  let testProfile: EscalationProfile;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hashed',
        profile: {
          create: {
            displayName: 'Test User',
            timezone: 'America/New_York',
          },
        },
        subscription: {
          create: {
            tier: 'PERSONAL',
            status: 'ACTIVE',
          },
        },
      },
    });
    
    // Get preset profile
    testProfile = await prisma.escalationProfile.findFirst({
      where: { isPreset: true },
    });
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await teardownTestDatabase();
  });

  describe('Reminder CRUD', () => {
    it('should create a reminder', async () => {
      const reminder = await prisma.reminder.create({
        data: {
          userId: testUser.id,
          title: 'Test Reminder',
          importance: 'HIGH',
          escalationProfileId: testProfile.id,
          schedule: {
            create: {
              type: 'ONCE',
              timezone: 'America/New_York',
              triggerAt: new Date(Date.now() + 86400000),
            },
          },
        },
        include: { schedule: true },
      });

      expect(reminder.id).toBeDefined();
      expect(reminder.title).toBe('Test Reminder');
      expect(reminder.schedule).toBeDefined();
    });
  });
});
```

---

## 9. Seed Data Specification

### Complete Seed Script

```typescript
// apps/api/prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Escalation Profile Presets
  console.log('Creating escalation profiles...');
  await prisma.escalationProfile.createMany({
    data: [
      {
        id: 'esc_preset_gentle',
        name: 'Gentle',
        description: 'Gradual escalation over hours. Good for low-stakes reminders.',
        isPreset: true,
        tiers: JSON.stringify([
          { tierNumber: 1, delayMinutes: 0, agentIds: ['email'] },
          { tierNumber: 2, delayMinutes: 60, agentIds: ['email', 'push'] },
          { tierNumber: 3, delayMinutes: 180, agentIds: ['email', 'push', 'sms'] },
        ]),
      },
      {
        id: 'esc_preset_urgent',
        name: 'Urgent',
        description: 'Rapid escalation within minutes. For time-sensitive tasks.',
        isPreset: true,
        tiers: JSON.stringify([
          { tierNumber: 1, delayMinutes: 0, agentIds: ['email', 'sms'] },
          { tierNumber: 2, delayMinutes: 5, agentIds: ['email', 'sms', 'push'] },
          { tierNumber: 3, delayMinutes: 15, agentIds: ['email', 'sms', 'push'] },
          { tierNumber: 4, delayMinutes: 30, agentIds: ['email', 'sms', 'push'], includeTrustedContacts: true },
        ]),
      },
      {
        id: 'esc_preset_critical',
        name: 'Critical',
        description: 'Immediate multi-channel with social escalation. For health/safety.',
        isPreset: true,
        tiers: JSON.stringify([
          { tierNumber: 1, delayMinutes: 0, agentIds: ['email', 'sms', 'push'] },
          { tierNumber: 2, delayMinutes: 2, agentIds: ['email', 'sms', 'push'], includeTrustedContacts: true },
          { tierNumber: 3, delayMinutes: 5, agentIds: ['email', 'sms', 'push'], includeTrustedContacts: true },
          { tierNumber: 4, delayMinutes: 10, agentIds: ['email', 'sms', 'push'], includeTrustedContacts: true },
          { tierNumber: 5, delayMinutes: 15, agentIds: ['email', 'sms', 'push'], includeTrustedContacts: true },
        ]),
      },
    ],
    skipDuplicates: true,
  });

  // 2. Create Agent Definitions
  console.log('Creating agent definitions...');
  await prisma.agentDefinition.createMany({
    data: [
      {
        id: 'agent_email',
        type: 'email',
        name: 'Email',
        description: 'Send notifications via email',
        version: '1.0.0',
        author: 'Escalating Reminders',
        isOfficial: true,
        isVerified: true,
        minimumTier: 'FREE',
        capabilities: JSON.stringify({
          canPush: true,
          canPull: false,
          canReceiveCommands: true,
          supportsRichContent: true,
          supportedActions: ['snooze', 'dismiss', 'complete'],
        }),
        configurationSchema: JSON.stringify({ fields: [] }),
      },
      {
        id: 'agent_sms',
        type: 'sms',
        name: 'SMS (Twilio)',
        description: 'Send SMS notifications via Twilio',
        version: '1.0.0',
        author: 'Escalating Reminders',
        isOfficial: true,
        isVerified: true,
        minimumTier: 'PERSONAL',
        capabilities: JSON.stringify({
          canPush: true,
          canPull: false,
          canReceiveCommands: true,
          supportsRichContent: false,
          supportedActions: ['snooze', 'dismiss', 'complete'],
        }),
        configurationSchema: JSON.stringify({
          fields: [
            { key: 'phoneNumber', type: 'phone', label: 'Phone Number', required: true, secret: false },
          ],
        }),
      },
      {
        id: 'agent_webhook',
        type: 'webhook',
        name: 'Webhook',
        description: 'Send notifications to external webhooks (Zapier, Make, n8n)',
        version: '1.0.0',
        author: 'Escalating Reminders',
        isOfficial: true,
        isVerified: true,
        minimumTier: 'PERSONAL',
        capabilities: JSON.stringify({
          canPush: true,
          canPull: true,
          canReceiveCommands: true,
          supportsRichContent: true,
          supportedActions: ['snooze', 'dismiss', 'complete'],
        }),
        configurationSchema: JSON.stringify({
          fields: [
            { key: 'webhookUrl', type: 'url', label: 'Webhook URL', required: true, secret: false },
          ],
        }),
      },
      {
        id: 'agent_push',
        type: 'web_push',
        name: 'Browser Push',
        description: 'Send push notifications to your browser',
        version: '1.0.0',
        author: 'Escalating Reminders',
        isOfficial: true,
        isVerified: true,
        minimumTier: 'FREE',
        capabilities: JSON.stringify({
          canPush: true,
          canPull: false,
          canReceiveCommands: false,
          supportsRichContent: false,
          supportedActions: [],
        }),
        configurationSchema: JSON.stringify({ fields: [] }),
      },
    ],
    skipDuplicates: true,
  });

  // 3. Create Demo User (for development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating demo user...');
    
    const passwordHash = await bcrypt.hash('demo123456', 12);
    
    await prisma.user.upsert({
      where: { email: 'demo@escalating-reminders.com' },
      update: {},
      create: {
        id: 'usr_demo_000000',
        email: 'demo@escalating-reminders.com',
        passwordHash,
        emailVerified: true,
        profile: {
          create: {
            displayName: 'Demo User',
            timezone: 'America/New_York',
            preferences: JSON.stringify({
              quietHoursStart: '22:00',
              quietHoursEnd: '07:00',
            }),
          },
        },
        subscription: {
          create: {
            tier: 'PRO',
            status: 'ACTIVE',
          },
        },
      },
    });
    
    // Create demo reminder
    await prisma.reminder.create({
      data: {
        userId: 'usr_demo_000000',
        title: 'Daily Medication',
        description: 'Take morning medication with breakfast',
        importance: 'HIGH',
        status: 'ACTIVE',
        escalationProfileId: 'esc_preset_urgent',
        nextTriggerAt: new Date(Date.now() + 3600000), // 1 hour from now
        schedule: {
          create: {
            type: 'RECURRING',
            timezone: 'America/New_York',
            cronExpression: '0 9 * * *',
          },
        },
      },
    });
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Summary

This document fills the gaps in the specification by providing:

1. ✅ Complete environment configuration templates
2. ✅ Natural language snooze parsing implementation
3. ✅ SMS command parsing specification
4. ✅ Email and SMS notification templates
5. ✅ Square integration details and webhook handling
6. ✅ Onboarding flow specification
7. ✅ Global error handling strategy
8. ✅ Testing strategy with mock factories
9. ✅ Complete seed data script

---

*This document should be read alongside the other architecture documents for complete implementation guidance.*

