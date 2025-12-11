# Notification Agent Specification v1.0

> **Formal specification for building notification agents compatible with Escalating Reminders.**

Any agent that implements this specification is guaranteed to work with the Escalating Reminders API.

---

## Table of Contents

1. [Overview](#overview)
2. [Agent Types](#agent-types)
3. [Communication Modes](#communication-modes)
4. [Webhook Agent Specification](#webhook-agent-specification)
5. [Pull Agent Specification](#pull-agent-specification)
6. [Command Interface](#command-interface)
7. [Security](#security)
8. [Configuration Schema](#configuration-schema)
9. [Error Handling](#error-handling)
10. [SDK & Examples](#sdk--examples)

---

## Overview

Notification Agents are pluggable delivery mechanisms that receive reminder notifications and optionally send commands back to the system (snooze, dismiss, complete).

### Conformance Levels

| Level | Description |
|-------|-------------|
| **Level 1: Receiver** | Receives notifications only (push mode) |
| **Level 2: Interactive** | Receives notifications + sends commands back |
| **Level 3: Pull** | Polls for pending notifications (pull mode) |
| **Level 4: Full** | All of the above + custom actions |

---

## Agent Types

```
AgentType = "EMAIL" | "SMS" | "WEBHOOK" | "PUSH" | "ALEXA" | "APPLE_WATCH" | "CUSTOM"
```

Each agent type has predefined capabilities and configuration requirements.

---

## Communication Modes

### Push Mode (Webhook)
The system POSTs notifications to your endpoint.

```
┌───────────────────┐     POST /your-webhook     ┌─────────────────┐
│  Escalating       │ ─────────────────────────► │  Your Agent     │
│  Reminders API    │                            │  (Webhook URL)  │
│                   │ ◄───────────────────────── │                 │
└───────────────────┘     200 OK + Response      └─────────────────┘
```

### Pull Mode
Your agent polls for pending notifications.

```
┌───────────────────┐     GET /notifications/pending     ┌─────────────────┐
│  Escalating       │ ◄─────────────────────────────────  │  Your Agent     │
│  Reminders API    │                                     │  (Polling)      │
│                   │ ──────────────────────────────────► │                 │
└───────────────────┘     200 OK + Notifications          └─────────────────┘
```

---

## Webhook Agent Specification

### Request Format (What We Send)

**HTTP Method:** `POST`

**Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `User-Agent` | Yes | `EscalatingReminders/1.0` |
| `X-Webhook-Signature` | Yes* | HMAC-SHA256 signature (see [Security](#security)) |
| `X-Request-Id` | Yes | Unique request ID for tracing |
| `X-Notification-Id` | Yes | Unique notification ID |
| `X-Retry-Count` | No | Current retry attempt (0-indexed) |

*Required if webhook secret is configured

**Payload Schema:**

```typescript
interface WebhookNotificationPayload {
  // === REQUIRED FIELDS ===
  
  /** Unique notification ID (UUIDv4) */
  notificationId: string;
  
  /** Reminder ID this notification belongs to */
  reminderId: string;
  
  /** User ID (for multi-user agents) */
  userId: string;
  
  /** Notification title */
  title: string;
  
  /** Notification message body */
  message: string;
  
  /** Current escalation tier (1-5) */
  escalationTier: number;
  
  /** Reminder importance level */
  importance: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  
  /** ISO 8601 timestamp */
  timestamp: string;
  
  // === OPTIONAL FIELDS ===
  
  /** Available actions the user can take */
  actions?: AgentAction[];
  
  /** URL for action callbacks (if different from webhook URL) */
  actionsUrl?: string;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  
  /** Original reminder due time */
  dueAt?: string;
  
  /** Time until next escalation (seconds) */
  escalationCountdown?: number;
}

interface AgentAction {
  /** Action identifier */
  action: "snooze" | "dismiss" | "complete" | "acknowledge";
  
  /** Human-readable label */
  label: string;
  
  /** Action requires confirmation */
  requiresConfirmation?: boolean;
  
  /** Additional action parameters */
  params?: Record<string, unknown>;
}
```

**Example Payload:**

```json
{
  "notificationId": "notif_01HX7Q8K9M3N4P5R6S7T8U9V0W",
  "reminderId": "rem_01HX7Q8K9M3N4P5R6S7T8U9V0W",
  "userId": "user_01HX7Q8K9M3N4P5R6S7T8U9V0W",
  "title": "Take medication",
  "message": "Time to take your evening medication. This is escalation tier 2.",
  "escalationTier": 2,
  "importance": "HIGH",
  "timestamp": "2024-12-10T15:30:00.000Z",
  "actions": [
    { "action": "complete", "label": "Done" },
    { "action": "snooze", "label": "Snooze 1h", "params": { "duration": "1h" } },
    { "action": "dismiss", "label": "Dismiss" }
  ],
  "actionsUrl": "https://api.escalating-reminders.com/v1/agents/webhook/callback",
  "metadata": {
    "category": "health",
    "recurring": true
  },
  "dueAt": "2024-12-10T15:00:00.000Z",
  "escalationCountdown": 1800
}
```

### Response Format (What We Expect)

**Success Response (2xx):**

```typescript
interface WebhookSuccessResponse {
  /** Must be true for success */
  success: true;
  
  /** Optional message ID from your system */
  messageId?: string;
  
  /** Acknowledgment timestamp */
  receivedAt?: string;
  
  /** Additional data */
  data?: Record<string, unknown>;
}
```

**Example:**

```json
{
  "success": true,
  "messageId": "msg_abc123",
  "receivedAt": "2024-12-10T15:30:01.234Z"
}
```

**Error Response (4xx/5xx):**

```typescript
interface WebhookErrorResponse {
  /** Must be false for errors */
  success: false;
  
  /** Error code */
  error: string;
  
  /** Human-readable message */
  message: string;
  
  /** Whether the request should be retried */
  retryable?: boolean;
}
```

**Example:**

```json
{
  "success": false,
  "error": "RATE_LIMITED",
  "message": "Too many requests, please retry later",
  "retryable": true
}
```

### HTTP Status Codes

| Code | Meaning | System Behavior |
|------|---------|-----------------|
| `200` | Success | Mark as delivered |
| `202` | Accepted | Mark as sent (async processing) |
| `400` | Bad Request | Do not retry |
| `401` | Unauthorized | Do not retry, flag subscription |
| `403` | Forbidden | Do not retry, flag subscription |
| `404` | Not Found | Do not retry, flag subscription |
| `429` | Rate Limited | Retry with exponential backoff |
| `500` | Server Error | Retry up to 3 times |
| `502` | Bad Gateway | Retry up to 3 times |
| `503` | Service Unavailable | Retry with exponential backoff |

### Retry Policy

- Max retries: 3
- Initial delay: 30 seconds
- Backoff multiplier: 2x
- Max delay: 5 minutes

---

## Pull Agent Specification

For devices that cannot receive webhooks (IoT, offline-first).

### Polling Endpoint

```
GET /v1/agents/{agentType}/notifications/pending
Authorization: Bearer <agent_api_key>
```

**Response:**

```typescript
interface PendingNotificationsResponse {
  notifications: WebhookNotificationPayload[];
  
  /** Recommended poll interval (seconds) */
  pollInterval: number;
  
  /** Next poll URL (may include cursor) */
  nextPollUrl?: string;
}
```

### Acknowledging Receipt

```
POST /v1/agents/{agentType}/notifications/{notificationId}/acknowledge
Authorization: Bearer <agent_api_key>
Content-Type: application/json

{
  "receivedAt": "2024-12-10T15:30:01.234Z",
  "deviceId": "device_abc123"
}
```

---

## Command Interface

Agents can send commands back to control reminders.

### Command Webhook (Push Mode)

The system provides an `actionsUrl` in the notification payload. POST commands there:

```
POST {actionsUrl}
Content-Type: application/json
X-Webhook-Signature: <signature>
```

### Command Endpoint (Pull Mode)

```
POST /v1/agents/{agentType}/commands
Authorization: Bearer <agent_api_key>
```

### Command Schema

```typescript
interface AgentCommand {
  /** Notification ID this command is for */
  notificationId: string;
  
  /** User ID (for verification) */
  userId: string;
  
  /** Reminder ID */
  reminderId: string;
  
  /** Command action */
  action: "snooze" | "dismiss" | "complete" | "acknowledge";
  
  /** Action-specific data */
  data?: {
    /** For snooze: duration string (e.g., "1h", "30m", "tomorrow") */
    duration?: string;
    
    /** For snooze: specific time (ISO 8601) */
    snoozeUntil?: string;
    
    /** Completion source */
    source?: string;
  };
  
  /** Raw input from user (for NLP processing) */
  rawInput?: string;
  
  /** Device/agent that sent the command */
  deviceId?: string;
  
  /** Command timestamp */
  timestamp: string;
}
```

### Command Actions

| Action | Effect | Required Data |
|--------|--------|---------------|
| `snooze` | Postpones reminder | `duration` OR `snoozeUntil` |
| `dismiss` | Stops current escalation only | None |
| `complete` | Marks reminder complete | None |
| `acknowledge` | Stops escalation, keeps reminder active | None |

### Command Response

```typescript
interface CommandResponse {
  success: boolean;
  
  /** Resulting reminder state */
  reminderStatus?: "ACTIVE" | "SNOOZED" | "COMPLETED" | "ARCHIVED";
  
  /** For snooze: when reminder will trigger again */
  nextTriggerAt?: string;
  
  /** Error details if failed */
  error?: string;
  message?: string;
}
```

---

## Security

### Webhook Signature Verification

All webhook payloads are signed using HMAC-SHA256.

**Signature Generation:**

```typescript
function verifyWebhookSignature(
  payload: string,      // Raw JSON body
  signature: string,    // X-Webhook-Signature header
  secret: string        // Your webhook secret
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**Header Format:**

```
X-Webhook-Signature: sha256=a1b2c3d4e5f6...
```

### API Key Authentication (Pull Mode)

Agents use API keys for authentication:

```
Authorization: Bearer er_agent_live_abc123...
```

API keys are:
- Scoped to specific agent types
- Rate limited (100 req/min default)
- Revocable at any time

### IP Allowlisting (Optional)

Webhook requests originate from these IPs:
- `52.x.x.x` (US-East)
- `35.x.x.x` (US-West)
- (Published in `/v1/meta/ip-ranges`)

---

## Configuration Schema

Each agent type has a configuration schema. Configurations are validated on subscription.

### Webhook Agent Configuration

```typescript
interface WebhookAgentConfig {
  /** Webhook URL (required) */
  url: string;
  
  /** HTTP method (default: POST) */
  method?: "POST" | "PUT";
  
  /** Custom headers */
  headers?: Record<string, string>;
  
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  
  /** Enable retries (default: true) */
  retryEnabled?: boolean;
  
  /** Authentication type */
  auth?: {
    type: "none" | "bearer" | "basic" | "api_key";
    token?: string;
    username?: string;
    password?: string;
    headerName?: string;
  };
}
```

**JSON Schema:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["url"],
  "properties": {
    "url": {
      "type": "string",
      "format": "uri",
      "pattern": "^https://"
    },
    "method": {
      "type": "string",
      "enum": ["POST", "PUT"],
      "default": "POST"
    },
    "headers": {
      "type": "object",
      "additionalProperties": { "type": "string" }
    },
    "timeout": {
      "type": "integer",
      "minimum": 1000,
      "maximum": 60000,
      "default": 30000
    },
    "retryEnabled": {
      "type": "boolean",
      "default": true
    },
    "auth": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["none", "bearer", "basic", "api_key"]
        },
        "token": { "type": "string" },
        "username": { "type": "string" },
        "password": { "type": "string" },
        "headerName": { "type": "string" }
      }
    }
  }
}
```

---

## Error Handling

### Standard Error Codes

| Code | Description |
|------|-------------|
| `INVALID_PAYLOAD` | Payload failed validation |
| `SIGNATURE_MISMATCH` | Webhook signature invalid |
| `AGENT_NOT_FOUND` | Agent type not registered |
| `SUBSCRIPTION_INACTIVE` | User's subscription disabled |
| `RATE_LIMITED` | Too many requests |
| `TIMEOUT` | Request timed out |
| `DELIVERY_FAILED` | Could not deliver notification |

### Error Response Format

```typescript
interface AgentError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  retryAfter?: number; // seconds
}
```

---

## SDK & Examples

### Sample Implementation

A complete working example is available in the repository:

```bash
cd examples/sample-webhook-agent
npm install
npm run dev
```

Then test it:

```bash
# In another terminal
npx tsx src/test-client.ts demo
```

See: [examples/sample-webhook-agent](../../examples/sample-webhook-agent/)

### Official SDKs

- **TypeScript/JavaScript:** `@escalating-reminders/agent-sdk`
- **Python:** `escalating-reminders-agent`
- **Go:** `github.com/escalating-reminders/agent-go`

### TypeScript Example

```typescript
import { createAgentHandler } from '@escalating-reminders/agent-sdk';

const handler = createAgentHandler({
  secret: process.env.WEBHOOK_SECRET,
  
  onNotification: async (notification) => {
    // Send to your delivery mechanism
    await sendPushNotification(notification.userId, {
      title: notification.title,
      body: notification.message,
      data: { reminderId: notification.reminderId }
    });
    
    return { success: true, messageId: 'push_123' };
  },
  
  onCommand: async (command) => {
    // Handle commands from your app
    return { success: true };
  }
});

// Express
app.post('/webhook', handler.express());

// Next.js
export const POST = handler.nextjs();

// AWS Lambda
export const handler = handler.lambda();
```

### Minimal Webhook Example

```javascript
// Minimal webhook handler (no SDK)
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  
  // Verify signature
  const isValid = verifySignature(req.body, signature, WEBHOOK_SECRET);
  if (!isValid) {
    return res.status(401).json({ success: false, error: 'SIGNATURE_MISMATCH' });
  }
  
  const { notificationId, title, message } = req.body;
  
  // Process notification
  console.log(`Received: ${title} - ${message}`);
  
  // Respond
  res.json({ success: true, receivedAt: new Date().toISOString() });
});
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-10 | Initial specification |

---

## Conformance Testing

Use our conformance test suite to validate your agent:

```bash
npx @escalating-reminders/agent-conformance test \
  --url https://your-agent.com/webhook \
  --secret your_webhook_secret \
  --level 2
```

This will run all tests for Level 2 conformance.

---

*For questions or issues, contact: api-support@escalating-reminders.com*

