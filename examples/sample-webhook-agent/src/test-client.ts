/**
 * Test Client
 * 
 * A simple client to test the webhook agent by sending
 * sample notifications and commands.
 * 
 * Usage:
 *   npx tsx src/test-client.ts
 */

import { generateWebhookSignature } from './security.js';
import type { NotificationPayload, AgentCommand } from './types.js';

const AGENT_URL = process.env.AGENT_URL || 'http://localhost:3900';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret-here';

// =============================================
// TEST DATA
// =============================================

const sampleNotification: NotificationPayload = {
  notificationId: `notif_${Date.now()}`,
  reminderId: 'rem_test123',
  userId: 'user_demo456',
  title: 'Take your medication',
  message: 'Time to take your evening medication. This is escalation tier 2 - please respond soon.',
  escalationTier: 2,
  importance: 'HIGH',
  timestamp: new Date().toISOString(),
  actions: [
    { action: 'complete', label: 'Done ✓' },
    { action: 'snooze', label: 'Snooze 30m', params: { duration: '30m' } },
    { action: 'snooze', label: 'Snooze 1h', params: { duration: '1h' } },
    { action: 'dismiss', label: 'Dismiss' }
  ],
  actionsUrl: `${AGENT_URL}/command`,
  metadata: {
    category: 'health',
    recurring: true,
    originalDueTime: '18:00'
  },
  dueAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
  escalationCountdown: 1800 // 30 minutes until next tier
};

// =============================================
// TEST FUNCTIONS
// =============================================

async function sendNotification(): Promise<void> {
  console.log('\n📤 Sending test notification to agent...\n');
  
  const payload = JSON.stringify(sampleNotification);
  const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);
  
  try {
    const response = await fetch(`${AGENT_URL}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EscalatingReminders/1.0',
        'X-Webhook-Signature': signature,
        'X-Request-Id': `req_${Date.now()}`,
        'X-Notification-Id': sampleNotification.notificationId
      },
      body: payload
    });
    
    const result = await response.json();
    
    console.log(`Response status: ${response.status}`);
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Notification delivered successfully!');
    } else {
      console.log('\n❌ Notification delivery failed');
    }
    
    return result;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

async function sendCommand(action: string, duration?: string): Promise<void> {
  console.log(`\n📤 Sending ${action} command...\n`);
  
  const command: AgentCommand = {
    notificationId: sampleNotification.notificationId,
    userId: sampleNotification.userId,
    reminderId: sampleNotification.reminderId,
    action: action as any,
    data: duration ? { duration } : undefined,
    deviceId: 'test-client',
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await fetch(`${AGENT_URL}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(command)
    });
    
    const result = await response.json();
    
    console.log(`Response status: ${response.status}`);
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`\n✅ Command "${action}" executed successfully!`);
    } else {
      console.log(`\n❌ Command "${action}" failed`);
    }
  } catch (error) {
    console.error('Error sending command:', error);
    throw error;
  }
}

async function listNotifications(): Promise<void> {
  console.log('\n📋 Fetching received notifications...\n');
  
  try {
    const response = await fetch(`${AGENT_URL}/notifications`);
    const result = await response.json();
    
    console.log(`Found ${result.count} notification(s):`);
    
    for (const notif of result.notifications) {
      console.log(`  - ${notif.notificationId}: ${notif.title} (Tier ${notif.escalationTier})`);
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

async function checkHealth(): Promise<void> {
  console.log('\n🏥 Checking agent health...\n');
  
  try {
    const response = await fetch(`${AGENT_URL}/health`);
    const result = await response.json();
    
    console.log('Health status:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
}

// =============================================
// MAIN
// =============================================

async function main(): Promise<void> {
  const command = process.argv[2] || 'notification';
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   🧪 Agent Test Client                                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`Target: ${AGENT_URL}`);
  
  switch (command) {
    case 'notification':
    case 'notify':
      await sendNotification();
      break;
      
    case 'snooze':
      await sendCommand('snooze', process.argv[3] || '1h');
      break;
      
    case 'complete':
      await sendCommand('complete');
      break;
      
    case 'dismiss':
      await sendCommand('dismiss');
      break;
      
    case 'acknowledge':
      await sendCommand('acknowledge');
      break;
      
    case 'list':
      await listNotifications();
      break;
      
    case 'health':
      await checkHealth();
      break;
      
    case 'demo':
      // Run full demo sequence
      await checkHealth();
      await sendNotification();
      await new Promise(r => setTimeout(r, 1000));
      await sendCommand('snooze', '30m');
      await new Promise(r => setTimeout(r, 1000));
      await listNotifications();
      break;
      
    default:
      console.log(`
Usage: npx tsx src/test-client.ts <command>

Commands:
  notification   Send a test notification (default)
  snooze [dur]   Send snooze command (e.g., "1h", "30m")
  complete       Send complete command
  dismiss        Send dismiss command
  acknowledge    Send acknowledge command
  list           List received notifications
  health         Check agent health
  demo           Run full demo sequence
`);
  }
}

main().catch(console.error);


