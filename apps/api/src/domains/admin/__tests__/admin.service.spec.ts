import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../admin.service';
import { AdminRepository } from '../admin.repository';
import { AdminAuthorizationService } from '../admin-authorization.service';
import { EventBusService } from '../../../infrastructure/events/event-bus.service';
import type { AdminUser, SupportNote } from '@er/types';
import { AdminRole } from '@er/types';
import { AdminPermission } from '@er/interfaces';
import { ERROR_CODES } from '@er/constants';

describe('AdminService', () => {
  let service: AdminService;
  let repository: AdminRepository;
  let authorization: AdminAuthorizationService;
  let eventBus: EventBusService;

  const mockRepository = {
    findAdminByUserId: jest.fn(),
    findAdminById: jest.fn(),
    createAdmin: jest.fn(),
    updateAdmin: jest.fn(),
    deleteAdmin: jest.fn(),
    createAdminAction: jest.fn(),
    createSupportNote: jest.fn(),
    updateSupportNote: jest.fn(),
    deleteSupportNote: jest.fn(),
    getSupportNotes: jest.fn(),
  };

  const mockAuthorization = {
    verifyAdminAccess: jest.fn(),
    checkPermission: jest.fn(),
    requirePermission: jest.fn(),
    canAccessResource: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: 'IAdminRepository',
          useValue: mockRepository,
        },
        {
          provide: 'IAdminAuthorizationService',
          useValue: mockAuthorization,
        },
        {
          provide: 'IEventBus',
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    repository = module.get<AdminRepository>('IAdminRepository');
    authorization = module.get<AdminAuthorizationService>('IAdminAuthorizationService');
    eventBus = module.get<EventBusService>('IEventBus');

    jest.clearAllMocks();
  });

  describe('promoteToAdmin', () => {
    const mockAdmin: AdminUser = {
      id: 'admin_123',
      userId: 'user_123',
      role: AdminRole.SUPER_ADMIN,
      permissions: {},
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should promote user to admin successfully', async () => {
      const requestingAdmin: AdminUser = {
        ...mockAdmin,
        role: AdminRole.SUPER_ADMIN,
      };

      mockAuthorization.verifyAdminAccess.mockResolvedValue(requestingAdmin);
      mockAuthorization.checkPermission.mockReturnValue(true);
      mockRepository.findAdminByUserId.mockResolvedValue(null); // User is not already admin
      mockRepository.createAdmin.mockResolvedValue(mockAdmin);
      mockRepository.createAdminAction.mockResolvedValue({});

      const result = await service.promoteToAdmin(
        'user_123',
        AdminRole.SUPPORT_ADMIN,
        'admin_123',
      );

      expect(result).toEqual(mockAdmin);
      expect(mockRepository.createAdmin).toHaveBeenCalled();
      expect(mockRepository.createAdminAction).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should throw error if user is already an admin', async () => {
      const requestingAdmin: AdminUser = {
        ...mockAdmin,
        role: AdminRole.SUPER_ADMIN,
      };

      mockAuthorization.verifyAdminAccess.mockResolvedValue(requestingAdmin);
      mockAuthorization.checkPermission.mockReturnValue(true);
      mockRepository.findAdminByUserId.mockResolvedValue(mockAdmin); // Already admin

      await expect(
        service.promoteToAdmin('user_123', AdminRole.SUPPORT_ADMIN, 'admin_123'),
      ).rejects.toThrow();
    });

    it('should throw error if requesting admin lacks permission', async () => {
      const requestingAdmin: AdminUser = {
        ...mockAdmin,
        role: AdminRole.READONLY_ADMIN,
      };

      mockAuthorization.verifyAdminAccess.mockResolvedValue(requestingAdmin);
      mockAuthorization.checkPermission.mockReturnValue(false);
      mockAuthorization.requirePermission.mockImplementation(() => {
        throw new Error('Forbidden');
      });

      await expect(
        service.promoteToAdmin('user_123', AdminRole.SUPPORT_ADMIN, 'admin_123'),
      ).rejects.toThrow();
    });
  });

  describe('suspendUser', () => {
    const mockAdmin: AdminUser = {
      id: 'admin_123',
      userId: 'admin_user_123',
      role: AdminRole.SUPER_ADMIN,
      permissions: {},
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should suspend user successfully', async () => {
      mockAuthorization.verifyAdminAccess.mockResolvedValue(mockAdmin);
      mockAuthorization.checkPermission.mockReturnValue(true);
      mockRepository.createAdminAction.mockResolvedValue({});

      await service.suspendUser('user_123', 'Violation of terms', 'admin_123');

      expect(mockRepository.createAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.suspended',
          targetType: 'User',
          targetId: 'user_123',
          reason: 'Violation of terms',
        }),
      );
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should throw error if admin lacks permission', async () => {
      const readonlyAdmin: AdminUser = {
        ...mockAdmin,
        role: AdminRole.READONLY_ADMIN,
      };

      mockAuthorization.verifyAdminAccess.mockResolvedValue(readonlyAdmin);
      mockAuthorization.requirePermission.mockImplementation(() => {
        throw new Error('Forbidden');
      });

      await expect(
        service.suspendUser('user_123', 'Reason', 'admin_123'),
      ).rejects.toThrow();
    });
  });

  describe('addSupportNote', () => {
    const mockAdmin: AdminUser = {
      id: 'admin_123',
      userId: 'admin_user_123',
      role: AdminRole.SUPPORT_ADMIN,
      permissions: {},
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockNote: SupportNote = {
      id: 'note_123',
      userId: 'user_123',
      adminUserId: 'admin_123',
      content: 'Customer reported issue',
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should add support note successfully', async () => {
      mockAuthorization.verifyAdminAccess.mockResolvedValue(mockAdmin);
      mockRepository.createSupportNote.mockResolvedValue(mockNote);

      const result = await service.addSupportNote(
        'user_123',
        'Customer reported issue',
        'admin_123',
      );

      expect(result).toEqual(mockNote);
      expect(mockRepository.createSupportNote).toHaveBeenCalledWith({
        userId: 'user_123',
        adminUserId: 'admin_123',
        content: 'Customer reported issue',
        isPinned: false,
      });
    });
  });

  describe('hasPermission', () => {
    const mockAdmin: AdminUser = {
      id: 'admin_123',
      userId: 'admin_user_123',
      role: AdminRole.SUPER_ADMIN,
      permissions: {},
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return true if admin has permission', async () => {
      mockAuthorization.verifyAdminAccess.mockResolvedValue(mockAdmin);
      mockAuthorization.checkPermission.mockReturnValue(true);

      const result = await service.hasPermission(
        'admin_123',
        AdminPermission.SUSPEND_USER,
      );

      expect(result).toBe(true);
    });

    it('should return false if admin lacks permission', async () => {
      const readonlyAdmin: AdminUser = {
        ...mockAdmin,
        role: AdminRole.READONLY_ADMIN,
      };

      mockAuthorization.verifyAdminAccess.mockResolvedValue(readonlyAdmin);
      mockAuthorization.checkPermission.mockReturnValue(false);

      const result = await service.hasPermission(
        'admin_123',
        AdminPermission.SUSPEND_USER,
      );

      expect(result).toBe(false);
    });
  });
});
