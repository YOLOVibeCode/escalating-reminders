import type { NotificationLog, PendingNotification } from '@er/types';
import type { NotificationPayload } from '../agents/IAgentService';
export interface INotificationService {
    sendTierNotifications(reminderId: string, userId: string, tier: number): Promise<NotificationLog[]>;
    sendNotification(userId: string, reminderId: string, agentType: string, payload: NotificationPayload): Promise<NotificationLog>;
    markAsDelivered(notificationId: string): Promise<void>;
}
export interface IPendingNotificationService {
    create(userId: string, reminderId: string, agentType: string, payload: NotificationPayload): Promise<PendingNotification>;
    getPending(userId: string, agentType: string): Promise<PendingNotification[]>;
    markAsRetrieved(notificationId: string): Promise<void>;
    cleanupExpired(): Promise<number>;
}
//# sourceMappingURL=INotificationService.d.ts.map