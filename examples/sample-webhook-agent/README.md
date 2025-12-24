# Sample Webhook Agent

A complete reference implementation of a notification agent following the **Escalating Reminders Agent Specification v1.0**.

Use this as a starting point for building your own notification agent.

## Features

- ✅ Full webhook endpoint implementation
- ✅ HMAC-SHA256 signature verification
- ✅ Payload validation
- ✅ Command handling (snooze, complete, dismiss, acknowledge)
- ✅ Health check endpoint
- ✅ Test client included

## Quick Start

```bash
# Navigate to the example
cd examples/sample-webhook-agent

# Install dependencies
npm install

# Start the server
npm run dev
```

The server will start on `http://localhost:3900`.

## Test It

In another terminal:

```bash
# Send a test notification
npx tsx src/test-client.ts notification

# Send a snooze command
npx tsx src/test-client.ts snooze 30m

# Send a complete command
npx tsx src/test-client.ts complete

# List received notifications
npx tsx src/test-client.ts list

# Run full demo
npx tsx src/test-client.ts demo
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhook` | POST | Receive notifications from Escalating Reminders |
| `/command` | POST | Send commands back (snooze, complete, etc.) |
| `/notifications` | GET | List received notifications |
| `/notifications/:id` | GET | Get specific notification |
| `/health` | GET | Health check |

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3900` | Server port |
| `WEBHOOK_SECRET` | `your-webhook-secret-here` | Secret for signature verification |
| `REQUIRE_SIGNATURE` | `false` | Require valid signature |

## Project Structure

```
sample-webhook-agent/
├── src/
│   ├── server.ts              # Express server & endpoints
│   ├── notification-handler.ts # Notification processing logic
│   ├── security.ts            # Signature verification
│   ├── types.ts               # TypeScript types (Agent Protocol)
│   └── test-client.ts         # Test client for sending requests
├── package.json
├── tsconfig.json
└── README.md
```

## How to Adapt This

### 1. Implement Your Delivery Logic

Edit `notification-handler.ts`:

```typescript
export async function handleNotification(
  notification: NotificationPayload
): Promise<WebhookSuccessResponse> {
  // Replace with your actual delivery:
  
  // Example: Send push notification
  await sendPushNotification(notification.userId, {
    title: notification.title,
    body: notification.message,
    data: { reminderId: notification.reminderId }
  });
  
  // Example: Post to Slack
  await postToSlack(notification);
  
  // Example: Send SMS
  await sendSMS(notification);
  
  return { success: true, messageId: 'your_msg_id' };
}
```

### 2. Forward Commands to Escalating Reminders

When your app/device wants to snooze or complete a reminder, forward the command:

```typescript
export async function handleCommand(
  command: AgentCommand
): Promise<CommandResponse> {
  // Forward to Escalating Reminders API
  const response = await fetch(
    `https://api.escalating-reminders.com/v1/agents/webhook/commands`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(command)
    }
  );
  
  return response.json();
}
```

### 3. Deploy

Deploy to your preferred platform:

- **Vercel**: `vercel deploy`
- **Railway**: `railway up`
- **AWS Lambda**: Use serverless framework
- **Docker**: Build and deploy container

## Specification Compliance

This sample implements **Level 2 (Interactive)** conformance:

- ✅ Receives push notifications
- ✅ Sends commands back
- ❌ Does not poll (Level 3)

## Testing Signature Verification

```bash
# Enable signature verification
REQUIRE_SIGNATURE=true npm run dev

# Test with the client (auto-signs requests)
npx tsx src/test-client.ts notification
```

## Security Notes

1. **Always verify signatures in production**
2. **Use HTTPS for your webhook endpoint**
3. **Store secrets securely** (environment variables, secret manager)
4. **Implement rate limiting** to prevent abuse

## Related Documentation

- [Agent Specification](../../docs/specifications/AGENT-SPECIFICATION.md)
- [API Design](../../docs/architecture/API-DESIGN.md)
- [Main Documentation](../../SPECIFICATION.md)

## License

MIT - Feel free to use as a starting point for your own agent!



