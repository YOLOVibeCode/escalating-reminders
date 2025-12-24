import type { AdminUser, AdminRole } from '@er/types';
import type { AdminPermission } from './IAdminService';
export interface IAdminAuthorizationService {
    verifyAdminAccess(userId: string): Promise<AdminUser>;
    checkPermission(adminUser: AdminUser, permission: AdminPermission): boolean;
    checkResourceAccess(adminUser: AdminUser, resource: string, resourceId: string): Promise<boolean>;
    requirePermission(adminUser: AdminUser, permission: AdminPermission): void;
    getPermissionsForRole(role: AdminRole): AdminPermission[];
    canRolePerformAction(role: AdminRole, permission: AdminPermission): boolean;
}
//# sourceMappingURL=IAdminAuthorizationService.d.ts.map