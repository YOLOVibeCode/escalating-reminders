import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import type { IAdminService, IAdminRepository, IAdminAuthorizationService, IEventBus } from '@er/interfaces';
import type { AdminUser, SupportNote } from '@er/types';
import { AdminRole } from '@er/types';
import { AdminPermission } from '@er/interfaces';
import { ERROR_CODES } from '@er/constants';

/**
 * Admin service.
 * Implements IAdminService interface.
 * Handles admin business logic operations.
 */
@Injectable()
export class AdminService implements IAdminService {
  constructor(
    @Inject('IAdminRepository')
    private readonly repository: IAdminRepository,
    @Inject('IAdminAuthorizationService')
    private readonly authorization: IAdminAuthorizationService,
    @Inject('IEventBus')
    private readonly eventBus: IEventBus,
  ) {}

  async promoteToAdmin(
    userId: string,
    role: AdminRole,
    adminUserId: string,
  ): Promise<AdminUser> {
    // Verify requesting admin has permission
    const requestingAdmin = await this.authorization.verifyAdminAccess(adminUserId);
    this.authorization.requirePermission(requestingAdmin, AdminPermission.MANAGE_ADMINS);

    // Check if user is already an admin
    const existingAdmin = await this.repository.findAdminByUserId(userId);
    if (existingAdmin) {
      throw new ConflictException({
        code: ERROR_CODES.RESOURCE_ALREADY_EXISTS,
        message: 'User is already an admin',
      });
    }

    // Create admin user
    const admin = await this.repository.createAdmin({
      userId,
      role,
      permissions: {},
    });

    // Log admin action
    await this.repository.createAdminAction({
      adminUserId,
      action: 'admin.created',
      targetType: 'AdminUser',
      targetId: admin.id,
      reason: `Promoted user to ${role}`,
      changes: { role },
    });

    // Emit event
    await this.eventBus.publish({
      type: 'admin.created',
      payload: {
        adminId: admin.id,
        userId,
        role,
        promotedBy: adminUserId,
        timestamp: new Date(),
      },
    });

    return admin;
  }

  async demoteFromAdmin(adminUserId: string, requestingAdminId: string): Promise<void> {
    // Verify requesting admin has permission
    const requestingAdmin = await this.authorization.verifyAdminAccess(requestingAdminId);
    this.authorization.requirePermission(requestingAdmin, AdminPermission.MANAGE_ADMINS);

    // Verify admin exists
    const admin = await this.repository.findAdminById(adminUserId);
    if (!admin) {
      throw new NotFoundException({
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Admin not found',
      });
    }

    // Prevent self-demotion
    if (adminUserId === requestingAdminId) {
      throw new ConflictException({
        code: ERROR_CODES.INVALID_OPERATION,
        message: 'Cannot demote yourself',
      });
    }

    // Delete admin
    await this.repository.deleteAdmin(adminUserId);

    // Log admin action
    await this.repository.createAdminAction({
      adminUserId: requestingAdminId,
      action: 'admin.deleted',
      targetType: 'AdminUser',
      targetId: adminUserId,
      reason: 'Admin demoted',
      changes: { role: admin.role },
    });

    // Emit event
    await this.eventBus.publish({
      type: 'admin.deleted',
      payload: {
        adminId: adminUserId,
        demotedBy: requestingAdminId,
        timestamp: new Date(),
      },
    });
  }

  async updateAdminRole(
    adminUserId: string,
    role: AdminRole,
    requestingAdminId: string,
  ): Promise<AdminUser> {
    // Verify requesting admin has permission
    const requestingAdmin = await this.authorization.verifyAdminAccess(requestingAdminId);
    this.authorization.requirePermission(requestingAdmin, AdminPermission.MANAGE_ADMINS);

    // Verify admin exists
    const existingAdmin = await this.repository.findAdminById(adminUserId);
    if (!existingAdmin) {
      throw new NotFoundException({
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Admin not found',
      });
    }

    // Update role
    const admin = await this.repository.updateAdmin(adminUserId, { role });

    // Log admin action
    await this.repository.createAdminAction({
      adminUserId: requestingAdminId,
      action: 'admin.role_updated',
      targetType: 'AdminUser',
      targetId: adminUserId,
      reason: `Role changed from ${existingAdmin.role} to ${role}`,
      changes: { oldRole: existingAdmin.role, newRole: role },
    });

    // Emit event
    await this.eventBus.publish({
      type: 'admin.role_updated',
      payload: {
        adminId: adminUserId,
        oldRole: existingAdmin.role,
        newRole: role,
        updatedBy: requestingAdminId,
        timestamp: new Date(),
      },
    });

    return admin;
  }

  async suspendUser(userId: string, reason: string, adminUserId: string): Promise<void> {
    // Verify admin has permission
    const admin = await this.authorization.verifyAdminAccess(adminUserId);
    this.authorization.requirePermission(admin, AdminPermission.SUSPEND_USER);

    // Log admin action
    await this.repository.createAdminAction({
      adminUserId,
      action: 'user.suspended',
      targetType: 'User',
      targetId: userId,
      reason,
      changes: { status: 'SUSPENDED' },
    });

    // Emit event (actual user suspension handled by User domain)
    await this.eventBus.publish({
      type: 'user.suspended',
      payload: {
        userId,
        adminUserId,
        reason,
        timestamp: new Date(),
      },
    });
  }

  async unsuspendUser(userId: string, adminUserId: string): Promise<void> {
    // Verify admin has permission
    const admin = await this.authorization.verifyAdminAccess(adminUserId);
    this.authorization.requirePermission(admin, AdminPermission.SUSPEND_USER);

    // Log admin action
    await this.repository.createAdminAction({
      adminUserId,
      action: 'user.unsuspended',
      targetType: 'User',
      targetId: userId,
      reason: 'User account unsuspended',
      changes: { status: 'ACTIVE' },
    });

    // Emit event
    await this.eventBus.publish({
      type: 'user.unsuspended',
      payload: {
        userId,
        adminUserId,
        timestamp: new Date(),
      },
    });
  }

  async deleteUser(userId: string, reason: string, adminUserId: string): Promise<void> {
    // Verify admin has permission
    const admin = await this.authorization.verifyAdminAccess(adminUserId);
    this.authorization.requirePermission(admin, AdminPermission.DELETE_USER);

    // Log admin action
    await this.repository.createAdminAction({
      adminUserId,
      action: 'user.deleted',
      targetType: 'User',
      targetId: userId,
      reason,
      changes: { status: 'DELETED' },
    });

    // Emit event (actual deletion handled by User domain)
    await this.eventBus.publish({
      type: 'user.deleted',
      payload: {
        userId,
        adminUserId,
        reason,
        timestamp: new Date(),
      },
    });
  }

  async addSupportNote(
    userId: string,
    content: string,
    adminUserId: string,
  ): Promise<SupportNote> {
    // Verify admin has permission
    const admin = await this.authorization.verifyAdminAccess(adminUserId);
    this.authorization.requirePermission(admin, AdminPermission.CREATE_SUPPORT_NOTES);

    const note = await this.repository.createSupportNote({
      userId,
      adminUserId,
      content,
      isPinned: false,
    });

    return note;
  }

  async updateSupportNote(
    noteId: string,
    content: string,
    adminUserId: string,
  ): Promise<SupportNote> {
    // Verify admin has permission
    const admin = await this.authorization.verifyAdminAccess(adminUserId);
    this.authorization.requirePermission(admin, AdminPermission.CREATE_SUPPORT_NOTES);

    // Note: In a real implementation, you'd check if admin created the note
    // For now, any admin with CREATE permission can update

    const note = await this.repository.updateSupportNote(noteId, { content });

    return note;
  }

  async deleteSupportNote(noteId: string, adminUserId: string): Promise<void> {
    // Verify admin has permission
    const admin = await this.authorization.verifyAdminAccess(adminUserId);
    this.authorization.requirePermission(admin, AdminPermission.CREATE_SUPPORT_NOTES);

    await this.repository.deleteSupportNote(noteId);
  }

  async hasPermission(adminUserId: string, permission: AdminPermission): Promise<boolean> {
    const admin = await this.authorization.verifyAdminAccess(adminUserId);
    return this.authorization.checkPermission(admin, permission);
  }

  async canAccessResource(
    adminUserId: string,
    resource: string,
    resourceId: string,
  ): Promise<boolean> {
    const admin = await this.authorization.verifyAdminAccess(adminUserId);
    return this.authorization.checkResourceAccess(admin, resource, resourceId);
  }
}
