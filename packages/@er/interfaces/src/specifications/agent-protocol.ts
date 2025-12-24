/**
 * Notification Agent Protocol v1.0
 *
 * Formal TypeScript interfaces for building notification agents
 * compatible with Escalating Reminders.
 *
 * Any implementation that conforms to these interfaces is
 * guaranteed to work with the Escalating Reminders API.
 *
 * @see /docs/specifications/AGENT-SPECIFICATION.md
 */

// ============================================
// CORE TYPES
// ============================================

/**
 * Supported agent types.
 */
export type AgentType =
  | 'EMAIL'
  | 'SMS'
  | 'WEBHOOK'
  | 'PUSH'
  | 'ALEXA'
  | 'APPLE_WATCH'
  | 'CUSTOM';

/**
 * Reminder importance levels.
 */
export type ReminderImportance = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Reminder status values.
 */
export type ReminderStatus = 'ACTIVE' | 'SNOOZED' | 'COMPLETED' | 'ARCHIVED';

/**
 * Available command actions an agent can send.
 */
export type CommandAction = 'snooze' | 'dismiss' | 'complete' | 'acknowledge';

// ============================================
// NOTIFICATION PAYLOAD (What We Send)
// ============================================

/**
 * Action that can be taken on a notification.
 */
export interface AgentAction {
  /** Action identifier */
  action: CommandAction;

  /** Human-readable label */
  label: string;

  /** Action requires confirmation from user */
  requiresConfirmation?: boolean;

  /** Additional action parameters */
  params?: {
    /** For snooze: duration string (e.g., "1h", "30m") */
    duration?: string;
    /** For snooze: specific time (ISO 8601) */
    snoozeUntil?: string;
    /** Any additional params */
    [key: string]: unknown;
  };
}

/**
 * Notification payload sent to agents.
 *
 * This is the exact structure your webhook will receive
 * or what you'll get from the pull endpoint.
 */
export interface NotificationPayload {
  // === REQUIRED FIELDS ===

  /**
   * Unique notification ID (UUIDv4).
   * Use this to acknowledge receipt or send commands.
   */
  notificationId: string;

  /**
   * Reminder ID this notification belongs to.
   */
  reminderId: string;

  /**
   * User ID (for multi-user agents).
   */
  userId: string;

  /**
   * Notification title.
   * Short, suitable for notification headers.
   */
  title: string;

  /**
   * Notification message body.
   * May contain markdown or plain text.
   */
  message: string;

  /**
   * Current escalation tier (1-5).
   * Higher tiers indicate more urgent escalation.
   */
  escalationTier: number;

  /**
   * Reminder importance level.
   */
  importance: ReminderImportance;

  /**
   * ISO 8601 timestamp when notification was generated.
   */
  timestamp: string;

  // === OPTIONAL FIELDS ===

  /**
   * Available actions the user can take.
   * Render these as buttons/options in your UI.
   */
  actions?: AgentAction[];

  /**
   * URL for action callbacks.
   * POST commands to this URL if provided.
   */
  actionsUrl?: string;

  /**
   * Additional metadata.
   * May include category, tags, custom fields.
   */
  metadata?: Record<string, unknown>;

  /**
   * Original reminder due time (ISO 8601).
   */
  dueAt?: string;

  /**
   * Seconds until next escalation tier.
   * Use for countdown displays.
   */
  escalationCountdown?: number;
}

// ============================================
// WEBHOOK RESPONSE (What We Expect Back)
// ============================================

/**
 * Success response from webhook agent.
 */
export interface WebhookSuccessResponse {
  /** Must be true for success */
  success: true;

  /** Optional message ID from your system (for tracking) */
  messageId?: string;

  /** When your system received the notification (ISO 8601) */
  receivedAt?: string;

  /** Additional data you want to include */
  data?: Record<string, unknown>;
}

/**
 * Error response from webhook agent.
 */
export interface WebhookErrorResponse {
  /** Must be false for errors */
  success: false;

  /** Error code (e.g., "RATE_LIMITED", "INVALID_CONFIG") */
  error: string;

  /** Human-readable error message */
  message: string;

  /** Whether the request should be retried */
  retryable?: boolean;

  /** Seconds to wait before retrying (for rate limiting) */
  retryAfter?: number;
}

/**
 * Union type for all webhook responses.
 */
export type WebhookResponse = WebhookSuccessResponse | WebhookErrorResponse;

// ============================================
// COMMAND INTERFACE (Sending Commands Back)
// ============================================

/**
 * Command sent from agent to control reminders.
 */
export interface AgentCommand {
  /**
   * Notification ID this command is for.
   * Required for command verification.
   */
  notificationId: string;

  /**
   * User ID (for verification).
   */
  userId: string;

  /**
   * Reminder ID.
   */
  reminderId: string;

  /**
   * Command action to perform.
   */
  action: CommandAction;

  /**
   * Action-specific data.
   */
  data?: {
    /**
     * For snooze: natural language duration.
     * Examples: "1h", "30m", "tomorrow", "next Friday"
     */
    duration?: string;

    /**
     * For snooze: specific time (ISO 8601).
     * Takes precedence over duration if both provided.
     */
    snoozeUntil?: string;

    /**
     * For complete: source identifier.
     * Examples: "manual", "voice", "button"
     */
    source?: string;

    /** Additional data */
    [key: string]: unknown;
  };

  /**
   * Raw input from user (for NLP processing).
   * Example: "remind me tomorrow at 9am"
   */
  rawInput?: string;

  /**
   * Device/agent that sent the command.
   * Useful for multi-device tracking.
   */
  deviceId?: string;

  /**
   * Command timestamp (ISO 8601).
   */
  timestamp: string;
}

/**
 * Response after processing a command.
 */
export interface CommandResponse {
  /** Whether command was successful */
  success: boolean;

  /** Resulting reminder status (if changed) */
  reminderStatus?: ReminderStatus;

  /** For snooze: when reminder will trigger again (ISO 8601) */
  nextTriggerAt?: string;

  /** Error code if failed */
  error?: string;

  /** Human-readable message */
  message?: string;
}

// ============================================
// PULL MODE (For Polling Agents)
// ============================================

/**
 * Response from the pending notifications endpoint.
 */
export interface PendingNotificationsResponse {
  /** Array of pending notifications */
  notifications: NotificationPayload[];

  /** Recommended poll interval in seconds */
  pollInterval: number;

  /** Next poll URL (may include cursor for pagination) */
  nextPollUrl?: string;
}

/**
 * Request to acknowledge receipt of a notification.
 */
export interface AcknowledgeRequest {
  /** When your agent received the notification (ISO 8601) */
  receivedAt: string;

  /** Device ID that received it */
  deviceId?: string;
}

// ============================================
// CONFIGURATION SCHEMAS
// ============================================

/**
 * Webhook agent configuration.
 */
export interface WebhookAgentConfig {
  /** Webhook URL (required, must be HTTPS) */
  url: string;

  /** HTTP method (default: POST) */
  method?: 'POST' | 'PUT';

  /** Custom headers to include */
  headers?: Record<string, string>;

  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Enable retries (default: true) */
  retryEnabled?: boolean;

  /** Authentication configuration */
  auth?: WebhookAuthConfig;
}

/**
 * Webhook authentication configuration.
 */
export interface WebhookAuthConfig {
  /** Auth type */
  type: 'none' | 'bearer' | 'basic' | 'api_key';

  /** Bearer token or API key value */
  token?: string;

  /** Basic auth username */
  username?: string;

  /** Basic auth password */
  password?: string;

  /** Custom header name for API key auth */
  headerName?: string;
}

/**
 * Email agent configuration.
 */
export interface EmailAgentConfig {
  /** Recipient email address */
  email: string;

  /** Email format preference */
  format?: 'html' | 'text' | 'both';

  /** Include action buttons in email */
  includeActions?: boolean;
}

/**
 * SMS agent configuration.
 */
export interface SmsAgentConfig {
  /** Phone number (E.164 format) */
  phoneNumber: string;

  /** SMS provider preference */
  provider?: 'twilio' | 'aws_sns' | 'default';
}

/**
 * Push notification agent configuration.
 */
export interface PushAgentConfig {
  /** Device token */
  deviceToken: string;

  /** Platform */
  platform: 'ios' | 'android' | 'web';

  /** Topic/channel for push notifications */
  topic?: string;
}

/**
 * Union of all agent configurations.
 */
export type AgentConfig =
  | WebhookAgentConfig
  | EmailAgentConfig
  | SmsAgentConfig
  | PushAgentConfig
  | Record<string, unknown>; // For custom agents

// ============================================
// AGENT DEFINITION (Registration)
// ============================================

/**
 * Agent capabilities.
 */
export interface AgentCapabilities {
  /** Can receive push notifications */
  canReceivePush: boolean;

  /** Can poll for notifications */
  canPoll: boolean;

  /** Can send commands back */
  canSendCommands: boolean;

  /** Supports rich content (HTML, images) */
  supportsRichContent?: boolean;

  /** Supports interactive actions */
  supportsActions?: boolean;

  /** Maximum message length */
  maxMessageLength?: number;
}

/**
 * Agent definition for registration.
 */
export interface AgentDefinition {
  /** Agent type identifier */
  type: AgentType | string;

  /** Human-readable name */
  name: string;

  /** Description */
  description: string;

  /** Agent capabilities */
  capabilities: AgentCapabilities;

  /** JSON Schema for configuration validation */
  configSchema: Record<string, unknown>;

  /** Minimum subscription tier required */
  minimumTier: 'FREE' | 'PERSONAL' | 'PRO' | 'FAMILY';

  /** Icon URL */
  iconUrl?: string;

  /** Documentation URL */
  docsUrl?: string;
}

// ============================================
// SECURITY
// ============================================

/**
 * Webhook signature header format.
 */
export const SIGNATURE_HEADER = 'X-Webhook-Signature';

/**
 * Signature prefix.
 */
export const SIGNATURE_PREFIX = 'sha256=';

/**
 * Verifies webhook signature.
 *
 * @param payload - Raw JSON body string
 * @param signature - Value of X-Webhook-Signature header
 * @param secret - Your webhook secret
 * @returns true if signature is valid
 */
export type SignatureVerifier = (
  payload: string,
  signature: string,
  secret: string,
) => boolean;

// ============================================
// ERROR CODES
// ============================================

/**
 * Standard agent error codes.
 */
export const AGENT_ERROR_CODES = {
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  SIGNATURE_MISMATCH: 'SIGNATURE_MISMATCH',
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  SUBSCRIPTION_INACTIVE: 'SUBSCRIPTION_INACTIVE',
  RATE_LIMITED: 'RATE_LIMITED',
  TIMEOUT: 'TIMEOUT',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
  CONFIG_INVALID: 'CONFIG_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type AgentErrorCode = (typeof AGENT_ERROR_CODES)[keyof typeof AGENT_ERROR_CODES];

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard for success response.
 */
export function isSuccessResponse(
  response: WebhookResponse,
): response is WebhookSuccessResponse {
  return response.success === true;
}

/**
 * Type guard for error response.
 */
export function isErrorResponse(
  response: WebhookResponse,
): response is WebhookErrorResponse {
  return response.success === false;
}

/**
 * Type guard for valid notification payload.
 */
export function isValidNotificationPayload(
  payload: unknown,
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

/**
 * Type guard for valid command.
 */
export function isValidCommand(command: unknown): command is AgentCommand {
  if (typeof command !== 'object' || command === null) return false;
  
  const c = command as Record<string, unknown>;
  
  return (
    typeof c.notificationId === 'string' &&
    typeof c.userId === 'string' &&
    typeof c.reminderId === 'string' &&
    typeof c.action === 'string' &&
    ['snooze', 'dismiss', 'complete', 'acknowledge'].includes(c.action as string) &&
    typeof c.timestamp === 'string'
  );
}



