/**
 * Sample Webhook Agent Server
 * 
 * A complete reference implementation of a notification agent
 * following the Escalating Reminders Agent Specification v1.0.
 * 
 * @see /docs/specifications/AGENT-SPECIFICATION.md
 */

import express from 'express';
import { verifyWebhookSignature } from './security.js';
import { 
  handleNotification, 
  handleCommand, 
  getAllNotifications,
  getNotification 
} from './notification-handler.js';
import { 
  isValidNotificationPayload,
  type WebhookErrorResponse,
  type AgentCommand
} from './types.js';

// =============================================
// CONFIGURATION
// =============================================

const PORT = process.env.PORT || 3900;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret-here';

// Set this to true to require signature verification
const REQUIRE_SIGNATURE = process.env.REQUIRE_SIGNATURE === 'true';

// =============================================
// EXPRESS APP SETUP
// =============================================

const app = express();

// We need raw body for signature verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    // Store raw body for signature verification
    req.rawBody = buf.toString();
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// =============================================
// WEBHOOK ENDPOINT (Receives Notifications)
// =============================================

/**
 * POST /webhook
 * 
 * Main endpoint that receives notifications from Escalating Reminders.
 * Implements the full Agent Specification webhook protocol.
 */
app.post('/webhook', async (req: any, res) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const requestId = req.headers['x-request-id'] as string;
  const notificationId = req.headers['x-notification-id'] as string;
  const retryCount = parseInt(req.headers['x-retry-count'] as string) || 0;

  console.log(`Request ID: ${requestId || 'N/A'}`);
  console.log(`Notification ID: ${notificationId || 'N/A'}`);
  if (retryCount > 0) {
    console.log(`Retry attempt: ${retryCount}`);
  }

  // 1. Verify signature (if required)
  if (REQUIRE_SIGNATURE || signature) {
    if (!signature) {
      const error: WebhookErrorResponse = {
        success: false,
        error: 'SIGNATURE_MISSING',
        message: 'X-Webhook-Signature header is required',
        retryable: false
      };
      return res.status(401).json(error);
    }

    const isValid = verifyWebhookSignature(req.rawBody, signature, WEBHOOK_SECRET);
    if (!isValid) {
      console.error('❌ Signature verification failed');
      const error: WebhookErrorResponse = {
        success: false,
        error: 'SIGNATURE_MISMATCH',
        message: 'Webhook signature verification failed',
        retryable: false
      };
      return res.status(401).json(error);
    }
    console.log('✅ Signature verified');
  }

  // 2. Validate payload
  if (!isValidNotificationPayload(req.body)) {
    const error: WebhookErrorResponse = {
      success: false,
      error: 'INVALID_PAYLOAD',
      message: 'Notification payload failed validation',
      retryable: false
    };
    return res.status(400).json(error);
  }

  // 3. Process notification
  try {
    const response = await handleNotification(req.body);
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error processing notification:', err);
    const error: WebhookErrorResponse = {
      success: false,
      error: 'PROCESSING_ERROR',
      message: err instanceof Error ? err.message : 'Internal processing error',
      retryable: true
    };
    return res.status(500).json(error);
  }
});

// =============================================
// COMMAND ENDPOINT (Sends Commands Back)
// =============================================

/**
 * POST /command
 * 
 * Endpoint for your app to send commands (snooze, complete, etc.)
 * that will be forwarded to Escalating Reminders.
 */
app.post('/command', async (req, res) => {
  const command = req.body as AgentCommand;

  // Validate command
  if (!command.notificationId || !command.action || !command.userId || !command.reminderId) {
    const error: WebhookErrorResponse = {
      success: false,
      error: 'INVALID_COMMAND',
      message: 'Command missing required fields: notificationId, action, userId, reminderId',
      retryable: false
    };
    return res.status(400).json(error);
  }

  // Add timestamp if not provided
  if (!command.timestamp) {
    command.timestamp = new Date().toISOString();
  }

  try {
    const response = await handleCommand(command);
    return res.json(response);
  } catch (err) {
    console.error('Error processing command:', err);
    const error: WebhookErrorResponse = {
      success: false,
      error: 'COMMAND_FAILED',
      message: err instanceof Error ? err.message : 'Command processing failed',
      retryable: true
    };
    return res.status(500).json(error);
  }
});

// =============================================
// UTILITY ENDPOINTS
// =============================================

/**
 * GET /notifications
 * 
 * List all received notifications (for debugging).
 */
app.get('/notifications', (_req, res) => {
  const notifications = getAllNotifications();
  res.json({
    count: notifications.length,
    notifications
  });
});

/**
 * GET /notifications/:id
 * 
 * Get a specific notification (for debugging).
 */
app.get('/notifications/:id', (req, res) => {
  const notification = getNotification(req.params.id);
  if (!notification) {
    return res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: 'Notification not found'
    });
  }
  res.json(notification);
});

/**
 * GET /health
 * 
 * Health check endpoint.
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    agent: 'sample-webhook-agent',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /
 * 
 * Agent info endpoint.
 */
app.get('/', (_req, res) => {
  res.json({
    name: 'Sample Webhook Agent',
    version: '1.0.0',
    specification: 'Escalating Reminders Agent Protocol v1.0',
    conformanceLevel: 2,
    endpoints: {
      webhook: 'POST /webhook',
      command: 'POST /command',
      notifications: 'GET /notifications',
      health: 'GET /health'
    },
    documentation: 'https://github.com/YOLOVibeCode/escalating-reminders/blob/main/docs/specifications/AGENT-SPECIFICATION.md'
  });
});

// =============================================
// START SERVER
// =============================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║   🔔 Sample Webhook Agent                                  ║');
  console.log('║   Escalating Reminders Agent Specification v1.0            ║');
  console.log('║                                                            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║   Server running on: http://localhost:${PORT}                 ║`);
  console.log('║                                                            ║');
  console.log('║   Endpoints:                                               ║');
  console.log('║   • POST /webhook      - Receive notifications             ║');
  console.log('║   • POST /command      - Send commands (snooze, etc.)      ║');
  console.log('║   • GET  /notifications - List received notifications      ║');
  console.log('║   • GET  /health       - Health check                      ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Signature verification: ${REQUIRE_SIGNATURE ? 'REQUIRED' : 'OPTIONAL'}`);
  console.log('');
  console.log('Waiting for notifications...');
});


