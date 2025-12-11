# Seeding Module

Seeding module for E2E tests and development. Provides endpoints to scaffold test data.

## Endpoints

### POST `/v1/seeding/seed`

Seeds test data including:
- Test users (user + admin)
- Escalation profiles
- Test reminders
- Agent subscriptions

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "user": { ... },
      "admin": { ... }
    },
    "reminders": [ ... ],
    "escalationProfiles": [ ... ],
    "agentSubscriptions": [ ... ]
  },
  "message": "Test data seeded successfully"
}
```

### DELETE `/v1/seeding/clear`

Clears all test data (test users and their associated data).

**Response:**
```json
{
  "success": true,
  "message": "Test data cleared successfully"
}
```

## Security

- **Only available in development/test environments**
- Checks `NODE_ENV` or `ENABLE_SEEDING` environment variable
- Returns 403 in production

## Test Users Created

- **User**: `testuser@example.com` / `TestUser123!`
- **Admin**: `admin@example.com` / `AdminPass123!`

## Usage

### Manual Seeding

```bash
# Seed test data
curl -X POST http://localhost:3801/v1/seeding/seed

# Clear test data
curl -X DELETE http://localhost:3801/v1/seeding/clear
```

### In E2E Tests

The seeding endpoint is automatically called in `global-setup.ts` before tests run.

## Environment Variables

- `NODE_ENV` - Must be `development` or `test` for seeding to work
- `ENABLE_SEEDING` - Set to `true` to enable seeding in any environment (use with caution)
