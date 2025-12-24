import type { AdminUser, AdminRole, SupportNote } from '@er/types';
export interface IAdminService {
    promoteToAdmin(userId: string, role: AdminRole, adminUserId: string): Promise<AdminUser>;
    demoteFromAdmin(adminUserId: string, requestingAdminId: string): Promise<void>;
    updateAdminRole(adminUserId: string, role: AdminRole, requestingAdminId: string): Promise<AdminUser>;
    suspendUser(userId: string, reason: string, adminUserId: string): Promise<void>;
    unsuspendUser(userId: string, adminUserId: string): Promise<void>;
    disableUserDelivery(userId: string, reason: string, adminUserId: string): Promise<void>;
    enableUserDelivery(userId: string, adminUserId: string): Promise<void>;
    deleteUser(userId: string, reason: string, adminUserId: string): Promise<void>;
    addSupportNote(userId: string, content: string, adminUserId: string): Promise<SupportNote>;
    updateSupportNote(noteId: string, content: string, adminUserId: string): Promise<SupportNote>;
    deleteSupportNote(noteId: string, adminUserId: string): Promise<void>;
    hasPermission(adminUserId: string, permission: AdminPermission): Promise<boolean>;
    canAccessResource(adminUserId: string, resource: string, resourceId: string): Promise<boolean>;
}
export declare enum AdminPermission {
    VIEW_USERS = "VIEW_USERS",
    SUSPEND_USER = "SUSPEND_USER",
    DELETE_USER = "DELETE_USER",
    VIEW_USER_DETAILS = "VIEW_USER_DETAILS",
    VIEW_BILLING = "VIEW_BILLING",
    MANAGE_BILLING = "MANAGE_BILLING",
    OVERRIDE_SUBSCRIPTIONS = "OVERRIDE_SUBSCRIPTIONS",
    PROCESS_REFUNDS = "PROCESS_REFUNDS",
    VIEW_SYSTEM_STATUS = "VIEW_SYSTEM_STATUS",
    MANAGE_QUEUES = "MANAGE_QUEUES",
    VIEW_LOGS = "VIEW_LOGS",
    CREATE_SUPPORT_NOTES = "CREATE_SUPPORT_NOTES",
    VIEW_SUPPORT_NOTES = "VIEW_SUPPORT_NOTES",
    MANAGE_ADMINS = "MANAGE_ADMINS",
    VIEW_ALL = "VIEW_ALL",
    ALL = "ALL"
}
//# sourceMappingURL=IAdminService.d.ts.map