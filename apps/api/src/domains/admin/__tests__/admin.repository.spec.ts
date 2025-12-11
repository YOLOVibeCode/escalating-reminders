import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AdminRepository } from '../admin.repository';
import type {
  AdminUser,
  AdminAction,
  SupportNote,
  SystemHealthSnapshot,
} from '@er/types';
import { AdminRole } from '@er/types';

describe('AdminRepository', () => {
  let repository: AdminRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    adminUser: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    adminAction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    supportNote: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    systemHealthSnapshot: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<AdminRepository>(AdminRepository);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('findAdminByUserId', () => {
    it('should find admin user by user ID', async () => {
      const mockAdmin: AdminUser = {
        id: 'admin_123',
        userId: 'user_123',
        role: AdminRole.SUPER_ADMIN,
        permissions: {},
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.adminUser.findUnique.mockResolvedValue(mockAdmin);

      const result = await repository.findAdminByUserId('user_123');

      expect(result).toEqual(mockAdmin);
      expect(mockPrismaService.adminUser.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
      });
    });

    it('should return null if admin not found', async () => {
      mockPrismaService.adminUser.findUnique.mockResolvedValue(null);

      const result = await repository.findAdminByUserId('user_123');

      expect(result).toBeNull();
    });
  });

  describe('findAdminById', () => {
    it('should find admin user by admin ID', async () => {
      const mockAdmin: AdminUser = {
        id: 'admin_123',
        userId: 'user_123',
        role: AdminRole.SUPPORT_ADMIN,
        permissions: {},
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.adminUser.findUnique.mockResolvedValue(mockAdmin);

      const result = await repository.findAdminById('admin_123');

      expect(result).toEqual(mockAdmin);
      expect(mockPrismaService.adminUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'admin_123' },
      });
    });
  });

  describe('createAdmin', () => {
    it('should create a new admin user', async () => {
      const createData = {
        userId: 'user_123',
        role: AdminRole.SUPPORT_ADMIN,
        permissions: {},
      };

      const mockAdmin: AdminUser = {
        id: 'admin_123',
        ...createData,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.adminUser.create.mockResolvedValue(mockAdmin);

      const result = await repository.createAdmin(createData);

      expect(result).toEqual(mockAdmin);
      expect(mockPrismaService.adminUser.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe('updateAdmin', () => {
    it('should update admin user', async () => {
      const updateData = {
        role: AdminRole.BILLING_ADMIN,
      };

      const mockAdmin: AdminUser = {
        id: 'admin_123',
        userId: 'user_123',
        role: AdminRole.BILLING_ADMIN,
        permissions: {},
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.adminUser.update.mockResolvedValue(mockAdmin);

      const result = await repository.updateAdmin('admin_123', updateData);

      expect(result).toEqual(mockAdmin);
      expect(mockPrismaService.adminUser.update).toHaveBeenCalledWith({
        where: { id: 'admin_123' },
        data: updateData,
      });
    });
  });

  describe('deleteAdmin', () => {
    it('should delete admin user', async () => {
      mockPrismaService.adminUser.delete.mockResolvedValue({});

      await repository.deleteAdmin('admin_123');

      expect(mockPrismaService.adminUser.delete).toHaveBeenCalledWith({
        where: { id: 'admin_123' },
      });
    });
  });

  describe('listAdmins', () => {
    it('should list all admins', async () => {
      const mockAdmins: AdminUser[] = [
        {
          id: 'admin_1',
          userId: 'user_1',
          role: AdminRole.SUPER_ADMIN,
          permissions: {},
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'admin_2',
          userId: 'user_2',
          role: AdminRole.SUPPORT_ADMIN,
          permissions: {},
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.adminUser.findMany.mockResolvedValue(mockAdmins);

      const result = await repository.listAdmins();

      expect(result).toEqual(mockAdmins);
      expect(mockPrismaService.adminUser.findMany).toHaveBeenCalled();
    });

    it('should filter admins by role', async () => {
      const filters = { role: AdminRole.SUPER_ADMIN };
      mockPrismaService.adminUser.findMany.mockResolvedValue([]);

      await repository.listAdmins(filters);

      expect(mockPrismaService.adminUser.findMany).toHaveBeenCalledWith({
        where: { role: AdminRole.SUPER_ADMIN },
      });
    });
  });

  describe('createAdminAction', () => {
    it('should create an admin action log entry', async () => {
      const actionData = {
        adminUserId: 'admin_123',
        action: 'user.suspended',
        targetType: 'User',
        targetId: 'user_456',
        reason: 'Violation of terms',
        changes: { status: 'SUSPENDED' },
        ipAddress: '192.168.1.1',
      };

      const mockAction: AdminAction = {
        id: 'action_123',
        ...actionData,
        createdAt: new Date(),
      };

      mockPrismaService.adminAction.create.mockResolvedValue(mockAction);

      const result = await repository.createAdminAction(actionData);

      expect(result).toEqual(mockAction);
      expect(mockPrismaService.adminAction.create).toHaveBeenCalledWith({
        data: actionData,
      });
    });
  });

  describe('getAdminActions', () => {
    it('should get paginated admin actions', async () => {
      const filters = {
        adminUserId: 'admin_123',
        page: 1,
        pageSize: 10,
      };

      const mockActions: AdminAction[] = [
        {
          id: 'action_1',
          adminUserId: 'admin_123',
          action: 'user.suspended',
          targetType: 'User',
          targetId: 'user_456',
          reason: null,
          changes: {},
          ipAddress: null,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.adminAction.findMany.mockResolvedValue(mockActions);
      mockPrismaService.adminAction.count.mockResolvedValue(1);

      const result = await repository.getAdminActions(filters);

      expect(result.items).toEqual(mockActions);
      expect(result.pagination.totalItems).toBe(1);
      expect(mockPrismaService.adminAction.findMany).toHaveBeenCalled();
      expect(mockPrismaService.adminAction.count).toHaveBeenCalled();
    });
  });

  describe('createSupportNote', () => {
    it('should create a support note', async () => {
      const noteData = {
        userId: 'user_123',
        adminUserId: 'admin_123',
        content: 'Customer reported issue with reminders',
        isPinned: false,
      };

      const mockNote: SupportNote = {
        id: 'note_123',
        ...noteData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.supportNote.create.mockResolvedValue(mockNote);

      const result = await repository.createSupportNote(noteData);

      expect(result).toEqual(mockNote);
      expect(mockPrismaService.supportNote.create).toHaveBeenCalledWith({
        data: noteData,
      });
    });
  });

  describe('getSupportNotes', () => {
    it('should get all support notes for a user', async () => {
      const mockNotes: SupportNote[] = [
        {
          id: 'note_1',
          userId: 'user_123',
          adminUserId: 'admin_123',
          content: 'First note',
          isPinned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.supportNote.findMany.mockResolvedValue(mockNotes);

      const result = await repository.getSupportNotes('user_123');

      expect(result).toEqual(mockNotes);
      expect(mockPrismaService.supportNote.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('createHealthSnapshot', () => {
    it('should create a system health snapshot', async () => {
      const snapshotData = {
        timestamp: new Date(),
        queueStats: { waiting: 10, active: 5 },
        workerStats: { total: 3, active: 2 },
        databaseStats: { connections: 10 },
        redisStats: { memoryUsed: 1024 },
        notificationStats: { sent: 100 },
        errorCount: 2,
      };

      const mockSnapshot: SystemHealthSnapshot = {
        id: 'snapshot_123',
        ...snapshotData,
        createdAt: new Date(),
      };

      mockPrismaService.systemHealthSnapshot.create.mockResolvedValue(mockSnapshot);

      const result = await repository.createHealthSnapshot(snapshotData);

      expect(result).toEqual(mockSnapshot);
      expect(mockPrismaService.systemHealthSnapshot.create).toHaveBeenCalledWith({
        data: snapshotData,
      });
    });
  });

  describe('getLatestHealthSnapshot', () => {
    it('should get the latest health snapshot', async () => {
      const mockSnapshot: SystemHealthSnapshot = {
        id: 'snapshot_123',
        timestamp: new Date(),
        queueStats: {},
        workerStats: {},
        databaseStats: {},
        redisStats: {},
        notificationStats: {},
        errorCount: 0,
        createdAt: new Date(),
      };

      mockPrismaService.systemHealthSnapshot.findFirst.mockResolvedValue(mockSnapshot);

      const result = await repository.getLatestHealthSnapshot();

      expect(result).toEqual(mockSnapshot);
      expect(mockPrismaService.systemHealthSnapshot.findFirst).toHaveBeenCalledWith({
        orderBy: { timestamp: 'desc' },
      });
    });

    it('should return null if no snapshots exist', async () => {
      mockPrismaService.systemHealthSnapshot.findFirst.mockResolvedValue(null);

      const result = await repository.getLatestHealthSnapshot();

      expect(result).toBeNull();
    });
  });
});
