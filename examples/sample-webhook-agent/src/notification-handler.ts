/**
 * Notification Handler
 * 
 * This is where you implement your notification delivery logic.
 * Replace these examples with your actual implementation.
 */

import type { 
  NotificationPayload, 
  WebhookSuccessResponse,
  AgentCommand,
  CommandResponse 
} from './types.js';

/**
 * Storage for received notifications (in-memory for demo).
 * In production, use a proper database.
 */
const receivedNotifications: Map<string, NotificationPayload> = new Map();

/**
 * Handle incoming notification from Escalating Reminders.
 * 
 * This is the main entry point for processing notifications.
 * Implement your delivery mechanism here (push notification, email, SMS, etc.)
 */
export async function handleNotification(
  notification: NotificationPayload
): Promise<WebhookSuccessResponse> {
  console.log('\n📬 Received notification:');
  console.log('─'.repeat(50));
  console.log(`  ID:         ${notification.notificationId}`);
  console.log(`  Title:      ${notification.title}`);
  console.log(`  Message:    ${notification.message}`);
  console.log(`  Importance: ${notification.importance}`);
  console.log(`  Tier:       ${notification.escalationTier}`);
  console.log(`  User:       ${notification.userId}`);
  console.log(`  Reminder:   ${notification.reminderId}`);
  
  if (notification.actions && notification.actions.length > 0) {
    console.log(`  Actions:    ${notification.actions.map(a => a.label).join(', ')}`);
  }
  
  if (notification.escalationCountdown) {
    console.log(`  Next tier:  ${notification.escalationCountdown}s`);
  }
  
  console.log('─'.repeat(50));

  // Store notification (for command handling)
  receivedNotifications.set(notification.notificationId, notification);

  // =============================================
  // YOUR DELIVERY LOGIC HERE
  // =============================================
  // Examples:
  // - Send push notification via Firebase/APNs
  // - Post to Slack/Discord channel
  // - Send SMS via Twilio
  // - Forward to IoT device
  // - Store in your database for mobile app pull
  
  await simulateDelivery(notification);

  // Generate a unique message ID for tracking
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    success: true,
    messageId,
    receivedAt: new Date().toISOString(),
    data: {
      deliveryMethod: 'console', // Replace with actual method
      processingTime: '12ms'
    }
  };
}

/**
 * Handle command request (e.g., when user clicks snooze button).
 * This processes commands that come from your frontend/app.
 */
export async function handleCommand(
  command: AgentCommand
): Promise<CommandResponse> {
  console.log('\n🎮 Processing command:');
  console.log('─'.repeat(50));
  console.log(`  Action:       ${command.action}`);
  console.log(`  Notification: ${command.notificationId}`);
  console.log(`  Reminder:     ${command.reminderId}`);
  console.log(`  User:         ${command.userId}`);
  
  if (command.data?.duration) {
    console.log(`  Duration:     ${command.data.duration}`);
  }
  
  console.log('─'.repeat(50));

  // Validate notification exists
  const notification = receivedNotifications.get(command.notificationId);
  if (!notification) {
    console.log('⚠️  Notification not found (may have expired)');
  }

  // In a real implementation, you would:
  // 1. Forward this command to Escalating Reminders API
  // 2. Return the result

  // Simulate success response
  switch (command.action) {
    case 'snooze':
      return {
        success: true,
        reminderStatus: 'SNOOZED',
        nextTriggerAt: calculateSnoozeTime(command.data?.duration),
        message: `Snoozed for ${command.data?.duration || '1 hour'}`
      };
    
    case 'complete':
      return {
        success: true,
        reminderStatus: 'COMPLETED',
        message: 'Reminder marked as complete'
      };
    
    case 'dismiss':
    case 'acknowledge':
      return {
        success: true,
        reminderStatus: 'ACTIVE',
        message: 'Escalation stopped, reminder remains active'
      };
    
    default:
      return {
        success: false,
        error: 'UNKNOWN_ACTION',
        message: `Unknown action: ${command.action}`
      };
  }
}

/**
 * Get a stored notification by ID.
 */
export function getNotification(
  notificationId: string
): NotificationPayload | undefined {
  return receivedNotifications.get(notificationId);
}

/**
 * Get all stored notifications.
 */
export function getAllNotifications(): NotificationPayload[] {
  return Array.from(receivedNotifications.values());
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Simulate delivery (replace with actual implementation).
 */
async function simulateDelivery(notification: NotificationPayload): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 10));
  
  console.log('✅ Notification processed successfully');
  
  // In production, you might:
  // - Send push notification
  // - Post to webhook/Slack
  // - Store for mobile app
  // - Send email/SMS
}

/**
 * Calculate snooze time from duration string.
 */
function calculateSnoozeTime(duration?: string): string {
  const now = new Date();
  let minutes = 60; // Default 1 hour
  
  if (duration) {
    const match = duration.match(/^(\d+)(m|h|d)?$/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = (match[2] || 'm').toLowerCase();
      
      switch (unit) {
        case 'm': minutes = value; break;
        case 'h': minutes = value * 60; break;
        case 'd': minutes = value * 60 * 24; break;
      }
    }
  }
  
  now.setMinutes(now.getMinutes() + minutes);
  return now.toISOString();
}


