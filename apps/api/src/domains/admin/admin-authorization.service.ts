import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import type { IAdminAuthorizationService, IAdminRepository } from '@er/interfaces';
import type { AdminUser } from '@er/types';
import { AdminRole } from '@er/types';
import { AdminPermission } from '@er/interfaces';

/**
 * Admin authorization service.
 * Implements IAdminAuthorizationService interface.
 * Handles permission checks and role-based access control.
 */
@Injectable()
export class AdminAuthorizationService implements IAdminAuthorizationService {
  constructor(
    @Inject('IAdminRepository')
    private readonly repository: IAdminRepository,
  ) {}

  /**
   * Permission matrix: Maps roles to their allowed permissions.
   */
  private readonly PERMISSION_MATRIX: Record<AdminRole, AdminPermission[]> = {
    [AdminRole.SUPER_ADMIN]: [
      AdminPermission.ALL, // Wildcard - has all permissions
    ],
    [AdminRole.SUPPORT_ADMIN]: [
      AdminPermission.VIEW_USERS,
      AdminPermission.VIEW_USER_DETAILS,
      AdminPermission.VIEW_BILLING,
      AdminPermission.VIEW_SYSTEM_STATUS,
      AdminPermission.CREATE_SUPPORT_NOTES,
      AdminPermission.VIEW_SUPPORT_NOTES,
      AdminPermission.VIEW_LOGS,
    ],
    [AdminRole.BILLING_ADMIN]: [
      AdminPermission.VIEW_USERS,
      AdminPermission.VIEW_USER_DETAILS,
      AdminPermission.VIEW_BILLING,
      AdminPermission.MANAGE_BILLING,
      AdminPermission.OVERRIDE_SUBSCRIPTIONS,
      AdminPermission.PROCESS_REFUNDS,
      AdminPermission.VIEW_SYSTEM_STATUS,
    ],
    [AdminRole.READONLY_ADMIN]: [
      AdminPermission.VIEW_ALL,
      AdminPermission.VIEW_USERS,
      AdminPermission.VIEW_USER_DETAILS,
      AdminPermission.VIEW_BILLING,
      AdminPermission.VIEW_SYSTEM_STATUS,
      AdminPermission.VIEW_SUPPORT_NOTES,
      AdminPermission.VIEW_LOGS,
    ],
  };

  async verifyAdminAccess(userId: string): Promise<AdminUser> {
    const admin = await this.repository.findAdminByUserId(userId);

    if (!admin) {
      throw new ForbiddenException({
        code: 'AUTH_FORBIDDEN',
        message: 'User is not an admin',
      });
    }

    return admin;
  }

  checkPermission(adminUser: AdminUser, permission: AdminPermission): boolean {
    const rolePermissions = this.PERMISSION_MATRIX[adminUser.role] ?? [];

    // SUPER_ADMIN has ALL permission (wildcard)
    if (rolePermissions.includes(AdminPermission.ALL)) {
      return true;
    }

    // Check if permission is in role's permission list
    return rolePermissions.includes(permission);
  }

  async checkResourceAccess(
    adminUser: AdminUser,
    resource: string,
    resourceId: string,
  ): Promise<boolean> {
    // SUPER_ADMIN can access all resources
    if (adminUser.role === AdminRole.SUPER_ADMIN) {
      return true;
    }

    // For now, resource-level access is same as permission check
    // Can be extended with more granular checks (e.g., own resources only)
    return true;
  }

  requirePermission(adminUser: AdminUser, permission: AdminPermission): void {
    if (!this.checkPermission(adminUser, permission)) {
      throw new ForbiddenException({
        code: 'AUTH_FORBIDDEN',
        message: `Admin lacks required permission: ${permission}`,
      });
    }
  }

  getPermissionsForRole(role: AdminRole): AdminPermission[] {
    return this.PERMISSION_MATRIX[role] || [];
  }

  canRolePerformAction(role: AdminRole, permission: AdminPermission): boolean {
    const rolePermissions = this.PERMISSION_MATRIX[role];

    if (!rolePermissions) {
      return false;
    }

    if (rolePermissions.includes(AdminPermission.ALL)) {
      return true;
    }

    return rolePermissions.includes(permission);
  }
}
