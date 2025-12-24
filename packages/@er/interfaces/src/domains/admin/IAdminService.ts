import type {
  AdminUser,
  AdminRole,
  SupportNote,
} from '@er/types';

/**
 * Service interface for admin operations.
 * Follows ISP - only business logic for admin management.
 */
export interface IAdminService {
  // Admin Management
  /**
   * Promote a user to admin role.
   * @throws {NotFoundError} If user doesn't exist
   * @throws {ConflictError} If user is already an admin
   * @throws {ForbiddenError} If requesting admin lacks permission
   */
  promoteToAdmin(
    userId: string,
    role: AdminRole,
    adminUserId: string,
  ): Promise<AdminUser>;

  /**
   * Demote an admin back to regular user.
   * @throws {NotFoundError} If admin doesn't exist
   * @throws {ForbiddenError} If requesting admin lacks permission
   */
  demoteFromAdmin(adminUserId: string, requestingAdminId: string): Promise<void>;

  /**
   * Update an admin's role.
   * @throws {NotFoundError} If admin doesn't exist
   * @throws {ForbiddenError} If requesting admin lacks permission
   */
  updateAdminRole(
    adminUserId: string,
    role: AdminRole,
    requestingAdminId: string,
  ): Promise<AdminUser>;

  // User Management (Admin Actions)
  /**
   * Suspend a user account.
   * @throws {NotFoundError} If user doesn't exist
   * @throws {ForbiddenError} If admin lacks permission
   */
  suspendUser(userId: string, reason: string, adminUserId: string): Promise<void>;

  /**
   * Unsuspend a user account.
   * @throws {NotFoundError} If user doesn't exist
   * @throws {ForbiddenError} If admin lacks permission
   */
  unsuspendUser(userId: string, adminUserId: string): Promise<void>;

  /**
   * Disable outbound delivery for a user (no messages sent).
   * This is distinct from usage suspension.
   */
  disableUserDelivery(userId: string, reason: string, adminUserId: string): Promise<void>;

  /**
   * Re-enable outbound delivery for a user.
   */
  enableUserDelivery(userId: string, adminUserId: string): Promise<void>;

  /**
   * Delete a user account (soft delete or hard delete).
   * @throws {NotFoundError} If user doesn't exist
   * @throws {ForbiddenError} If admin lacks permission
   */
  deleteUser(userId: string, reason: string, adminUserId: string): Promise<void>;

  // Support Notes
  /**
   * Add a support note to a user.
   * @throws {NotFoundError} If user doesn't exist
   */
  addSupportNote(
    userId: string,
    content: string,
    adminUserId: string,
  ): Promise<SupportNote>;

  /**
   * Update a support note.
   * @throws {NotFoundError} If note doesn't exist
   * @throws {ForbiddenError} If admin didn't create the note
   */
  updateSupportNote(
    noteId: string,
    content: string,
    adminUserId: string,
  ): Promise<SupportNote>;

  /**
   * Delete a support note.
   * @throws {NotFoundError} If note doesn't exist
   * @throws {ForbiddenError} If admin lacks permission
   */
  deleteSupportNote(noteId: string, adminUserId: string): Promise<void>;

  // Permission Checks
  /**
   * Check if admin has a specific permission.
   */
  hasPermission(adminUserId: string, permission: AdminPermission): Promise<boolean>;

  /**
   * Check if admin can access a specific resource.
   */
  canAccessResource(
    adminUserId: string,
    resource: string,
    resourceId: string,
  ): Promise<boolean>;
}

/**
 * Admin permissions enum.
 * Used for granular permission checks.
 */
export enum AdminPermission {
  // User Management
  VIEW_USERS = 'VIEW_USERS',
  SUSPEND_USER = 'SUSPEND_USER',
  DELETE_USER = 'DELETE_USER',
  VIEW_USER_DETAILS = 'VIEW_USER_DETAILS',

  // Billing Management
  VIEW_BILLING = 'VIEW_BILLING',
  MANAGE_BILLING = 'MANAGE_BILLING',
  OVERRIDE_SUBSCRIPTIONS = 'OVERRIDE_SUBSCRIPTIONS',
  PROCESS_REFUNDS = 'PROCESS_REFUNDS',

  // System Management
  VIEW_SYSTEM_STATUS = 'VIEW_SYSTEM_STATUS',
  MANAGE_QUEUES = 'MANAGE_QUEUES',
  VIEW_LOGS = 'VIEW_LOGS',

  // Support
  CREATE_SUPPORT_NOTES = 'CREATE_SUPPORT_NOTES',
  VIEW_SUPPORT_NOTES = 'VIEW_SUPPORT_NOTES',

  // Admin Management
  MANAGE_ADMINS = 'MANAGE_ADMINS',

  // Wildcards
  VIEW_ALL = 'VIEW_ALL',
  ALL = 'ALL',
}
