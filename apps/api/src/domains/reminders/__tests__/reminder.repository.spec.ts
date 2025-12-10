import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ReminderRepository } from '../reminder.repository';
import type {
  Reminder,
  ReminderFilters,
  PaginatedResult,
} from '@er/types';
import type {
  ReminderCreateData,
  ReminderUpdateData,
} from '@er/interfaces';

describe('ReminderRepository', () => {
  let repository: ReminderRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    reminder: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReminderRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<ReminderRepository>(ReminderRepository);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a reminder successfully', async () => {
      const createData: ReminderCreateData = {
        userId: 'user_123',
        title: 'Test Reminder',
        description: 'Test description',
        importance: 'MEDIUM',
        status: 'ACTIVE',
        escalationProfileId: 'profile_123',
        nextTriggerAt: new Date('2024-12-25T10:00:00Z'),
      };

      const mockReminder: Reminder = {
        id: 'reminder_123',
        userId: 'user_123',
        title: 'Test Reminder',
        description: 'Test description',
        importance: 'MEDIUM',
        status: 'ACTIVE',
        escalationProfileId: 'profile_123',
        nextTriggerAt: new Date('2024-12-25T10:00:00Z'),
        lastTriggeredAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.reminder.create.mockResolvedValue(mockReminder);

      const result = await repository.create(createData);

      expect(result).toEqual(mockReminder);
      expect(mockPrismaService.reminder.create).toHaveBeenCalledWith({
        data: createData,
      });
    });

    it('should handle database errors', async () => {
      const createData: ReminderCreateData = {
        userId: 'user_123',
        title: 'Test Reminder',
        importance: 'MEDIUM',
        status: 'ACTIVE',
        escalationProfileId: 'profile_123',
      };

      mockPrismaService.reminder.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(repository.create(createData)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findById', () => {
    it('should return reminder when exists', async () => {
      const mockReminder: Reminder = {
        id: 'reminder_123',
        userId: 'user_123',
        title: 'Test Reminder',
        description: 'Test description',
        importance: 'MEDIUM',
        status: 'ACTIVE',
        escalationProfileId: 'profile_123',
        nextTriggerAt: new Date('2024-12-25T10:00:00Z'),
        lastTriggeredAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.reminder.findUnique.mockResolvedValue(mockReminder);

      const result = await repository.findById('reminder_123');

      expect(result).toEqual(mockReminder);
      expect(mockPrismaService.reminder.findUnique).toHaveBeenCalledWith({
        where: { id: 'reminder_123' },
      });
    });

    it('should return null when not found', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
      expect(mockPrismaService.reminder.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' },
      });
    });
  });

  describe('findByUserId', () => {
    it('should return paginated reminders for user', async () => {
      const mockReminders: Reminder[] = [
        {
          id: 'reminder_1',
          userId: 'user_123',
          title: 'Reminder 1',
          importance: 'MEDIUM',
          status: 'ACTIVE',
          escalationProfileId: 'profile_123',
          nextTriggerAt: new Date('2024-12-25T10:00:00Z'),
          lastTriggeredAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'reminder_2',
          userId: 'user_123',
          title: 'Reminder 2',
          importance: 'HIGH',
          status: 'ACTIVE',
          escalationProfileId: 'profile_123',
          nextTriggerAt: new Date('2024-12-26T10:00:00Z'),
          lastTriggeredAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const filters: ReminderFilters = {
        page: 1,
        pageSize: 20,
      };

      mockPrismaService.reminder.findMany.mockResolvedValue(mockReminders);
      mockPrismaService.reminder.count.mockResolvedValue(2);

      const result = await repository.findByUserId('user_123', filters);

      expect(result.items).toEqual(mockReminders);
      expect(result.pagination.totalItems).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(20);
      expect(mockPrismaService.reminder.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by status', async () => {
      const filters: ReminderFilters = {
        page: 1,
        pageSize: 20,
        status: 'ACTIVE',
      };

      mockPrismaService.reminder.findMany.mockResolvedValue([]);
      mockPrismaService.reminder.count.mockResolvedValue(0);

      await repository.findByUserId('user_123', filters);

      expect(mockPrismaService.reminder.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          status: 'ACTIVE',
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by importance', async () => {
      const filters: ReminderFilters = {
        page: 1,
        pageSize: 20,
        importance: 'HIGH',
      };

      mockPrismaService.reminder.findMany.mockResolvedValue([]);
      mockPrismaService.reminder.count.mockResolvedValue(0);

      await repository.findByUserId('user_123', filters);

      expect(mockPrismaService.reminder.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          importance: 'HIGH',
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should sort by nextTriggerAt', async () => {
      const filters: ReminderFilters = {
        page: 1,
        pageSize: 20,
      };

      mockPrismaService.reminder.findMany.mockResolvedValue([]);
      mockPrismaService.reminder.count.mockResolvedValue(0);

      await repository.findByUserId('user_123', filters);

      expect(mockPrismaService.reminder.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle pagination', async () => {
      const filters: ReminderFilters = {
        page: 2,
        pageSize: 10,
      };

      mockPrismaService.reminder.findMany.mockResolvedValue([]);
      mockPrismaService.reminder.count.mockResolvedValue(25);

      const result = await repository.findByUserId('user_123', filters);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.pageSize).toBe(10);
      expect(result.pagination.totalItems).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(mockPrismaService.reminder.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('update', () => {
    it('should update reminder successfully', async () => {
      const updateData: ReminderUpdateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const mockUpdatedReminder: Reminder = {
        id: 'reminder_123',
        userId: 'user_123',
        title: 'Updated Title',
        description: 'Updated description',
        importance: 'MEDIUM',
        status: 'ACTIVE',
        escalationProfileId: 'profile_123',
        nextTriggerAt: new Date('2024-12-25T10:00:00Z'),
        lastTriggeredAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.reminder.update.mockResolvedValue(mockUpdatedReminder);

      const result = await repository.update('reminder_123', updateData);

      expect(result).toEqual(mockUpdatedReminder);
      expect(mockPrismaService.reminder.update).toHaveBeenCalledWith({
        where: { id: 'reminder_123' },
        data: updateData,
      });
    });

    it('should handle partial updates', async () => {
      const updateData: ReminderUpdateData = {
        title: 'Updated Title',
      };

      const mockUpdatedReminder: Reminder = {
        id: 'reminder_123',
        userId: 'user_123',
        title: 'Updated Title',
        importance: 'MEDIUM',
        status: 'ACTIVE',
        escalationProfileId: 'profile_123',
        nextTriggerAt: null,
        lastTriggeredAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.reminder.update.mockResolvedValue(mockUpdatedReminder);

      const result = await repository.update('reminder_123', updateData);

      expect(result).toEqual(mockUpdatedReminder);
    });

    it('should return null when reminder not found', async () => {
      mockPrismaService.reminder.update.mockRejectedValue({
        code: 'P2025',
        message: 'Record not found',
      });

      await expect(
        repository.update('nonexistent', { title: 'Updated' }),
      ).rejects.toMatchObject({
        code: 'P2025',
      });
    });
  });

  describe('delete', () => {
    it('should delete reminder successfully', async () => {
      mockPrismaService.reminder.delete.mockResolvedValue({
        id: 'reminder_123',
      });

      await repository.delete('reminder_123');

      expect(mockPrismaService.reminder.delete).toHaveBeenCalledWith({
        where: { id: 'reminder_123' },
      });
    });

    it('should handle non-existent reminder', async () => {
      mockPrismaService.reminder.delete.mockRejectedValue({
        code: 'P2025',
        message: 'Record not found',
      });

      await expect(repository.delete('nonexistent')).rejects.toMatchObject({
        code: 'P2025',
      });
    });
  });

  describe('countByUser', () => {
    it('should return correct count', async () => {
      mockPrismaService.reminder.count.mockResolvedValue(5);

      const result = await repository.countByUser('user_123');

      expect(result).toBe(5);
      expect(mockPrismaService.reminder.count).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
      });
    });
  });

  describe('findDueForTrigger', () => {
    it('should return reminders due for triggering', async () => {
      const now = new Date();
      const mockReminders: Reminder[] = [
        {
          id: 'reminder_1',
          userId: 'user_123',
          title: 'Due Reminder 1',
          importance: 'MEDIUM',
          status: 'ACTIVE',
          escalationProfileId: 'profile_123',
          nextTriggerAt: new Date(now.getTime() - 1000), // Past
          lastTriggeredAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'reminder_2',
          userId: 'user_123',
          title: 'Due Reminder 2',
          importance: 'HIGH',
          status: 'ACTIVE',
          escalationProfileId: 'profile_123',
          nextTriggerAt: now, // Now
          lastTriggeredAt: null,
          completedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.reminder.findMany.mockResolvedValue(mockReminders);

      const result = await repository.findDueForTrigger(10);

      expect(result).toEqual(mockReminders);
      expect(mockPrismaService.reminder.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          nextTriggerAt: {
            lte: expect.any(Date),
          },
        },
        take: 10,
        orderBy: { nextTriggerAt: 'asc' },
      });
    });

    it('should respect limit parameter', async () => {
      mockPrismaService.reminder.findMany.mockResolvedValue([]);

      await repository.findDueForTrigger(5);

      expect(mockPrismaService.reminder.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          nextTriggerAt: {
            lte: expect.any(Date),
          },
        },
        take: 5,
        orderBy: { nextTriggerAt: 'asc' },
      });
    });

    it('should only return ACTIVE reminders', async () => {
      mockPrismaService.reminder.findMany.mockResolvedValue([]);

      await repository.findDueForTrigger(10);

      expect(mockPrismaService.reminder.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          nextTriggerAt: {
            lte: expect.any(Date),
          },
        },
        take: 10,
        orderBy: { nextTriggerAt: 'asc' },
      });
    });
  });
});

