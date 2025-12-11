import type { AdminUser, AdminRole } from '@er/types';
import type { AdminPermission } from './IAdminService';

/**
 * Service interface for admin authorization.
 * Follows ISP - only authorization logic, no business operations.
 */
export interface IAdminAuthorizationService {
  /**
   * Verify that a user is an admin and return AdminUser.
   * @throws {ForbiddenError} If user is not an admin
   */
  verifyAdminAccess(userId: string): Promise<AdminUser>;

  /**
   * Check if admin has a specific permission.
   * Returns boolean without throwing.
   */
  checkPermission(adminUser: AdminUser, permission: AdminPermission): boolean;

  /**
   * Check if admin can access a specific resource.
   * May involve additional checks beyond permissions.
   */
  checkResourceAccess(
    adminUser: AdminUser,
    resource: string,
    resourceId: string,
  ): Promise<boolean>;

  /**
   * Require a specific permission, throws if not granted.
   * @throws {ForbiddenError} If admin lacks permission
   */
  requirePermission(adminUser: AdminUser, permission: AdminPermission): void;

  /**
   * Get all permissions for an admin role.
   */
  getPermissionsForRole(role: AdminRole): AdminPermission[];

  /**
   * Check if admin role can perform an action.
   */
  canRolePerformAction(role: AdminRole, permission: AdminPermission): boolean;
}
