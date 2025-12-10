# API Design Specification

> **Version**: 1.0.0  
> **Last Updated**: December 2024

---

## Overview

The Escalating Reminders API is a RESTful API that serves the web application and external integrations. It follows REST conventions with JSON request/response bodies.

---

## Base URL

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.escalating-reminders.com/v1` |
| Staging | `https://api.staging.escalating-reminders.com/v1` |
| Development | `http://localhost:3801/v1` |

---

## Authentication

### JWT Bearer Token

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Types

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access Token | 15 minutes | API authentication |
| Refresh Token | 7 days | Obtain new access token |

### API Keys (for Agents/Webhooks)

For external integrations:

```
X-API-Key: esk_live_xxxxxxxxxxxxx
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T09:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T09:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Pagination

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

---

## Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request body |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 422 | UNPROCESSABLE_ENTITY | Business rule violation |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

---

## API Endpoints

### Authentication

#### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "displayName": "John Doe",
  "timezone": "America/New_York"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresIn": 900
    }
  }
}
```

#### POST /auth/login
Authenticate user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresIn": 900
    }
  }
}
```

#### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "expiresIn": 900
  }
}
```

#### POST /auth/logout
Invalidate refresh token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": null
}
```

---

### Users

#### GET /users/me
Get current user profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "profile": {
      "displayName": "John Doe",
      "timezone": "America/New_York",
      "preferences": {
        "quietHoursStart": "22:00",
        "quietHoursEnd": "07:00"
      }
    },
    "subscription": {
      "tier": "personal",
      "status": "active"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PATCH /users/me
Update current user profile.

**Request:**
```json
{
  "displayName": "John Smith",
  "timezone": "America/Los_Angeles",
  "preferences": {
    "quietHoursStart": "23:00"
  }
}
```

#### PATCH /users/me/password
Change password.

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

### Reminders

#### GET /reminders
List user's reminders.

**Query Parameters:**
- `status` (optional): Filter by status (active, snoozed, completed)
- `page` (default: 1)
- `pageSize` (default: 20, max: 100)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "rem_abc123",
      "title": "Soberlink Check",
      "description": "Complete daily sobriety test",
      "importance": "critical",
      "status": "active",
      "nextTriggerAt": "2024-01-15T09:00:00Z",
      "escalationProfile": {
        "id": "esc_preset_critical",
        "name": "Critical"
      },
      "schedule": {
        "type": "recurring",
        "cronExpression": "0 9 * * *",
        "timezone": "America/New_York"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 5,
    "totalPages": 1
  }
}
```

#### POST /reminders
Create a new reminder.

**Request:**
```json
{
  "title": "Soberlink Check",
  "description": "Complete daily sobriety test",
  "importance": "critical",
  "escalationProfileId": "esc_preset_critical",
  "schedule": {
    "type": "recurring",
    "cronExpression": "0 9 * * *",
    "timezone": "America/New_York"
  },
  "completionCriteria": {
    "type": "email_watcher",
    "config": {
      "rules": [
        {
          "type": "contains",
          "pattern": "Soberlink Test Completed",
          "matchTarget": "subject"
        }
      ]
    }
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "rem_abc123",
    "title": "Soberlink Check",
    ...
  }
}
```

#### GET /reminders/:id
Get a specific reminder.

#### PATCH /reminders/:id
Update a reminder.

#### DELETE /reminders/:id
Delete a reminder.

#### POST /reminders/:id/snooze
Snooze a reminder.

**Request:**
```json
{
  "until": "2024-01-22T09:00:00Z"
}
```

Or with natural language:

```json
{
  "duration": "until next Friday"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "rem_abc123",
    "status": "snoozed",
    "snoozeUntil": "2024-01-19T09:00:00Z",
    "parsedInput": "until next Friday"
  }
}
```

#### POST /reminders/:id/complete
Mark a reminder as completed.

#### POST /reminders/:id/acknowledge
Acknowledge (stop current escalation).

---

### Escalation Profiles

#### GET /escalation-profiles
List available profiles (user's + presets).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "esc_preset_gentle",
      "name": "Gentle",
      "description": "Gradual escalation over hours",
      "isPreset": true,
      "tiers": [
        {
          "tierNumber": 1,
          "delayMinutes": 0,
          "agentIds": ["push"]
        },
        {
          "tierNumber": 2,
          "delayMinutes": 60,
          "agentIds": ["push", "email"]
        }
      ]
    },
    {
      "id": "esc_usr_custom1",
      "name": "My Custom Profile",
      "isPreset": false,
      "tiers": [...]
    }
  ]
}
```

#### POST /escalation-profiles
Create custom profile.

#### PATCH /escalation-profiles/:id
Update custom profile.

#### DELETE /escalation-profiles/:id
Delete custom profile.

---

### Notification Agents

#### GET /agents
List available agents.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "agent_email",
      "type": "email",
      "name": "Email",
      "description": "Send notifications via email",
      "isOfficial": true,
      "minimumTier": "free",
      "capabilities": {
        "canPush": true,
        "canPull": false,
        "canReceiveCommands": true,
        "supportedActions": ["snooze", "dismiss", "complete"]
      },
      "configurationSchema": {
        "fields": []
      }
    },
    {
      "id": "agent_sms",
      "type": "sms",
      "name": "SMS (Twilio)",
      "minimumTier": "personal",
      "configurationSchema": {
        "fields": [
          {
            "key": "phoneNumber",
            "type": "phone",
            "label": "Your Phone Number",
            "required": true
          }
        ]
      }
    }
  ]
}
```

#### GET /agents/subscriptions
List user's agent subscriptions.

#### POST /agents/:id/subscribe
Subscribe to an agent.

**Request:**
```json
{
  "configuration": {
    "phoneNumber": "+15551234567"
  }
}
```

#### PATCH /agents/subscriptions/:id
Update agent subscription.

#### DELETE /agents/subscriptions/:id
Unsubscribe from agent.

#### POST /agents/subscriptions/:id/test
Test agent delivery.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "testId": "test_abc123",
    "status": "sent",
    "message": "Test notification sent successfully"
  }
}
```

---

### Trusted Contacts

#### GET /trusted-contacts
List user's trusted contacts.

#### POST /trusted-contacts
Add a trusted contact.

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+15559876543",
  "relationship": "partner",
  "notificationPreferences": {
    "email": true,
    "sms": true
  }
}
```

#### PATCH /trusted-contacts/:id
Update a contact.

#### DELETE /trusted-contacts/:id
Remove a contact.

---

### Calendar Integration

#### GET /calendars
List connected calendars.

#### POST /calendars/connect
Initiate OAuth connection.

**Request:**
```json
{
  "provider": "google"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/oauth/...",
    "state": "state_abc123"
  }
}
```

#### POST /calendars/callback
Handle OAuth callback.

#### DELETE /calendars/:id
Disconnect a calendar.

#### GET /calendars/:id/events
List calendar events (for rule setup).

#### POST /calendars/sync-rules
Create a sync rule.

**Request:**
```json
{
  "connectionId": "cal_abc123",
  "calendarId": "primary",
  "labelKey": "Kids with Ex",
  "action": "pause_during",
  "affectedReminderIds": ["rem_abc123"]
}
```

---

### Email Watchers

#### GET /watchers
List user's email watchers.

#### POST /watchers
Create an email watcher.

**Request:**
```json
{
  "reminderId": "rem_abc123",
  "provider": "gmail",
  "rules": [
    {
      "type": "contains",
      "pattern": "Soberlink Test Completed",
      "matchTarget": "subject"
    }
  ]
}
```

#### POST /watchers/:id/test
Test watcher rules against recent emails.

#### DELETE /watchers/:id
Remove a watcher.

---

### Billing

#### GET /billing/subscription
Get current subscription.

#### POST /billing/checkout
Create Square checkout session.

**Request:**
```json
{
  "tier": "personal"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://squareup.com/checkout/...",
    "checkoutId": "chk_abc123"
  }
}
```

#### POST /billing/cancel
Cancel subscription.

#### GET /billing/invoices
List payment history.

---

### Notifications (Pull Mode)

For external agents using pull mode:

#### GET /notifications/pending
Get pending notifications for this API key.

**Headers:**
```
X-API-Key: esk_live_xxxxxxxxxxxxx
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_abc123",
      "reminderId": "rem_xyz789",
      "title": "Soberlink Check",
      "message": "Time for your daily check",
      "escalationTier": 2,
      "triggeredAt": "2024-01-15T09:00:00Z",
      "actions": ["snooze", "dismiss", "complete"],
      "actionsUrl": "/v1/reminders/rem_xyz789/actions"
    }
  ]
}
```

#### POST /notifications/:id/delivered
Mark notification as delivered.

---

### Webhooks (Inbound)

For receiving actions from agents:

#### POST /webhooks/agent/:agentType
Receive webhook from agent.

**Headers:**
```
X-Webhook-Signature: sha256=...
X-Webhook-Timestamp: 1705312800
```

**Request (example for SMS reply):**
```json
{
  "from": "+15551234567",
  "body": "SNOOZE 3d",
  "timestamp": "2024-01-15T09:00:00Z"
}
```

#### POST /webhooks/square
Handle Square webhook events.

#### POST /webhooks/calendar/:provider
Handle calendar webhook events.

---

## Rate Limits

| Tier | Requests per Hour |
|------|-------------------|
| Free | 100 |
| Personal | 1,000 |
| Pro | 10,000 |
| Family | 10,000 |

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1705316400
```

---

## Webhook Signatures

All outbound webhooks are signed with HMAC-SHA256:

```
X-Webhook-Signature: sha256=<hmac_hex>
X-Webhook-Timestamp: <unix_timestamp>
```

Verification (pseudo-code):
```typescript
const payload = timestamp + '.' + JSON.stringify(body);
const expectedSignature = hmac('sha256', webhookSecret, payload);
const isValid = signature === `sha256=${expectedSignature}`;
const isRecent = Math.abs(Date.now() / 1000 - timestamp) < 300; // 5 min
```

---

## API Versioning

API version is in the URL path: `/v1/...`

Breaking changes will introduce a new version (`/v2/...`).

Deprecation notices will be sent via:
- Response header: `X-API-Deprecation: 2024-06-01`
- Email to registered developers

---

## OpenAPI Specification

Full OpenAPI 3.0 spec available at:
- `/v1/openapi.json`
- `/v1/docs` (Swagger UI)

---

*This API design follows REST conventions and is designed for both web clients and external integrations.*

