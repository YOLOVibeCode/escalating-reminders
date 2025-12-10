import type { NotificationLog, PendingNotification } from '@er/types';

/**
 * Service interface for notification delivery.
 * Follows ISP - only notification sending methods.
 */
export interface INotificationService {
  /**
   * Send notifications for a specific escalation tier.
   */
  sendTierNotifications(
    reminderId: string,
    userId: string,
    tier: number,
  ): Promise<NotificationLog[]>;

  /**
   * Send a single notification via a specific agent.
   * @throws {NotFoundError} If agent subscription doesn't exist
   */
  sendNotification(
    userId: string,
    reminderId: string,
    agentType: string,
    payload: NotificationPayload,
  ): Promise<NotificationLog>;

  /**
   * Mark notification as delivered (for pull-mode agents).
   */
  markAsDelivered(notificationId: string): Promise<void>;
}

/**
 * Service interface for pending notifications (pull mode).
 * Separated per ISP - pull mode is distinct from push mode.
 */
export interface IPendingNotificationService {
  /**
   * Create a pending notification for pull-mode agents.
   */
  create(userId: string, reminderId: string, agentType: string, payload: NotificationPayload): Promise<PendingNotification>;

  /**
   * Get pending notifications for a user and agent type.
   */
  getPending(userId: string, agentType: string): Promise<PendingNotification[]>;

  /**
   * Mark notification as retrieved.
   */
  markAsRetrieved(notificationId: string): Promise<void>;

  /**
   * Clean up expired pending notifications.
   */
  cleanupExpired(): Promise<number>;
}

export interface NotificationPayload {
  title: string;
  message: string;
  escalationTier: number;
  importance: string;
  actions: string[];
  actionsUrl?: string;
  metadata?: Record<string, unknown>;
}

