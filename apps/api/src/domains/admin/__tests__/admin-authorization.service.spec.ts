import { Test, TestingModule } from '@nestjs/testing';
import { AdminAuthorizationService } from '../admin-authorization.service';
import { AdminRepository } from '../admin.repository';
import type { AdminUser } from '@er/types';
import { AdminRole } from '@er/types';
import { AdminPermission } from '@er/interfaces';
import { ForbiddenException } from '@nestjs/common';

describe('AdminAuthorizationService', () => {
  let service: AdminAuthorizationService;
  let repository: AdminRepository;

  const mockRepository = {
    findAdminByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthorizationService,
        {
          provide: 'IAdminRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AdminAuthorizationService>(AdminAuthorizationService);
    repository = module.get<AdminRepository>('IAdminRepository');

    jest.clearAllMocks();
  });

  describe('verifyAdminAccess', () => {
    const mockAdmin: AdminUser = {
      id: 'admin_123',
      userId: 'user_123',
      role: AdminRole.SUPER_ADMIN,
      permissions: {},
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return admin user if user is admin', async () => {
      mockRepository.findAdminByUserId.mockResolvedValue(mockAdmin);

      const result = await service.verifyAdminAccess('user_123');

      expect(result).toEqual(mockAdmin);
      expect(mockRepository.findAdminByUserId).toHaveBeenCalledWith('user_123');
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      mockRepository.findAdminByUserId.mockResolvedValue(null);

      await expect(service.verifyAdminAccess('user_123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('checkPermission', () => {
    it('should return true for SUPER_ADMIN with any permission', () => {
      const superAdmin: AdminUser = {
        id: 'admin_123',
        userId: 'user_123',
        role: AdminRole.SUPER_ADMIN,
        permissions: {},
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.checkPermission(superAdmin, AdminPermission.SUSPEND_USER);

      expect(result).toBe(true);
    });

    it('should return true for SUPPORT_ADMIN with VIEW_USERS permission', () => {
      const supportAdmin: AdminUser = {
        id: 'admin_123',
        userId: 'user_123',
        role: AdminRole.SUPPORT_ADMIN,
        permissions: {},
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.checkPermission(supportAdmin, AdminPermission.VIEW_USERS);

      expect(result).toBe(true);
    });

    it('should return false for SUPPORT_ADMIN with SUSPEND_USER permission', () => {
      const supportAdmin: AdminUser = {
        id: 'admin_123',
        userId: 'user_123',
        role: AdminRole.SUPPORT_ADMIN,
        permissions: {},
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.checkPermission(supportAdmin, AdminPermission.SUSPEND_USER);

      expect(result).toBe(false);
    });

    it('should return true for BILLING_ADMIN with MANAGE_BILLING permission', () => {
      const billingAdmin: AdminUser = {
        id: 'admin_123',
        userId: 'user_123',
        role: AdminRole.BILLING_ADMIN,
        permissions: {},
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.checkPermission(billingAdmin, AdminPermission.MANAGE_BILLING);

      expect(result).toBe(true);
    });

    it('should return false for READONLY_ADMIN with any write permission', () => {
      const readonlyAdmin: AdminUser = {
        id: 'admin_123',
        userId: 'user_123',
        role: AdminRole.READONLY_ADMIN,
        permissions: {},
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.checkPermission(readonlyAdmin, AdminPermission.SUSPEND_USER);

      expect(result).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should not throw if admin has permission', () => {
      const superAdmin: AdminUser = {
        id: 'admin_123',
        userId: 'user_123',
        role: AdminRole.SUPER_ADMIN,
        permissions: {},
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => {
        service.requirePermission(superAdmin, AdminPermission.SUSPEND_USER);
      }).not.toThrow();
    });

    it('should throw ForbiddenException if admin lacks permission', () => {
      const readonlyAdmin: AdminUser = {
        id: 'admin_123',
        userId: 'user_123',
        role: AdminRole.READONLY_ADMIN,
        permissions: {},
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => {
        service.requirePermission(readonlyAdmin, AdminPermission.SUSPEND_USER);
      }).toThrow(ForbiddenException);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return all permissions for SUPER_ADMIN', () => {
      const permissions = service.getPermissionsForRole(AdminRole.SUPER_ADMIN);

      expect(permissions).toContain(AdminPermission.ALL);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return limited permissions for SUPPORT_ADMIN', () => {
      const permissions = service.getPermissionsForRole(AdminRole.SUPPORT_ADMIN);

      expect(permissions).toContain(AdminPermission.VIEW_USERS);
      expect(permissions).toContain(AdminPermission.CREATE_SUPPORT_NOTES);
      expect(permissions).not.toContain(AdminPermission.SUSPEND_USER);
    });

    it('should return billing permissions for BILLING_ADMIN', () => {
      const permissions = service.getPermissionsForRole(AdminRole.BILLING_ADMIN);

      expect(permissions).toContain(AdminPermission.MANAGE_BILLING);
      expect(permissions).toContain(AdminPermission.OVERRIDE_SUBSCRIPTIONS);
    });

    it('should return view-only permissions for READONLY_ADMIN', () => {
      const permissions = service.getPermissionsForRole(AdminRole.READONLY_ADMIN);

      expect(permissions).toContain(AdminPermission.VIEW_ALL);
      expect(permissions).not.toContain(AdminPermission.SUSPEND_USER);
    });
  });

  describe('canRolePerformAction', () => {
    it('should return true for SUPER_ADMIN with any action', () => {
      const result = service.canRolePerformAction(
        AdminRole.SUPER_ADMIN,
        AdminPermission.SUSPEND_USER,
      );

      expect(result).toBe(true);
    });

    it('should return false for READONLY_ADMIN with write actions', () => {
      const result = service.canRolePerformAction(
        AdminRole.READONLY_ADMIN,
        AdminPermission.SUSPEND_USER,
      );

      expect(result).toBe(false);
    });
  });
});
