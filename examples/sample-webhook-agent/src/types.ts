/**
 * Agent Protocol Types
 * 
 * These types match the Escalating Reminders Agent Specification v1.0
 * @see /docs/specifications/AGENT-SPECIFICATION.md
 */

// ============================================
// NOTIFICATION PAYLOAD (What We Receive)
// ============================================

export type ReminderImportance = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CommandAction = 'snooze' | 'dismiss' | 'complete' | 'acknowledge';

export interface AgentAction {
  action: CommandAction;
  label: string;
  requiresConfirmation?: boolean;
  params?: {
    duration?: string;
    snoozeUntil?: string;
    [key: string]: unknown;
  };
}

/**
 * Notification payload received from Escalating Reminders.
 */
export interface NotificationPayload {
  // Required fields
  notificationId: string;
  reminderId: string;
  userId: string;
  title: string;
  message: string;
  escalationTier: number;
  importance: ReminderImportance;
  timestamp: string;
  
  // Optional fields
  actions?: AgentAction[];
  actionsUrl?: string;
  metadata?: Record<string, unknown>;
  dueAt?: string;
  escalationCountdown?: number;
}

// ============================================
// RESPONSE TYPES (What We Send Back)
// ============================================

export interface WebhookSuccessResponse {
  success: true;
  messageId?: string;
  receivedAt?: string;
  data?: Record<string, unknown>;
}

export interface WebhookErrorResponse {
  success: false;
  error: string;
  message: string;
  retryable?: boolean;
  retryAfter?: number;
}

export type WebhookResponse = WebhookSuccessResponse | WebhookErrorResponse;

// ============================================
// COMMAND TYPES (Sending Commands Back)
// ============================================

export interface AgentCommand {
  notificationId: string;
  userId: string;
  reminderId: string;
  action: CommandAction;
  data?: {
    duration?: string;
    snoozeUntil?: string;
    source?: string;
    [key: string]: unknown;
  };
  rawInput?: string;
  deviceId?: string;
  timestamp: string;
}

export interface CommandResponse {
  success: boolean;
  reminderStatus?: 'ACTIVE' | 'SNOOZED' | 'COMPLETED' | 'ARCHIVED';
  nextTriggerAt?: string;
  error?: string;
  message?: string;
}

// ============================================
// TYPE GUARDS
// ============================================

export function isValidNotificationPayload(
  payload: unknown
): payload is NotificationPayload {
  if (typeof payload !== 'object' || payload === null) return false;
  
  const p = payload as Record<string, unknown>;
  
  return (
    typeof p.notificationId === 'string' &&
    typeof p.reminderId === 'string' &&
    typeof p.userId === 'string' &&
    typeof p.title === 'string' &&
    typeof p.message === 'string' &&
    typeof p.escalationTier === 'number' &&
    typeof p.importance === 'string' &&
    typeof p.timestamp === 'string'
  );
}



