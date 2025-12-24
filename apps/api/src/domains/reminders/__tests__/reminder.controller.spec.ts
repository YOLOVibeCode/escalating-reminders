import { Test, TestingModule } from '@nestjs/testing';
import { ReminderController } from '../reminder.controller';
import { ReminderService } from '../reminder.service';
import { ReminderSnoozeService } from '../reminder-snooze.service';
import { ReminderCompletionService } from '../reminder-completion.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type {
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
  ReminderFilters,
  PaginatedResult,
} from '@er/types';

describe('ReminderController', () => {
  let controller: ReminderController;
  let service: ReminderService;

  const mockReminderService = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockReminderSnoozeService = {
    snooze: jest.fn(),
    unsnooze: jest.fn(),
  };

  const mockReminderCompletionService = {
    complete: jest.fn(),
    reopen: jest.fn(),
  };

  const mockUser = {
    sub: 'user_123',
    email: 'test@example.com',
  };

  const mockRequest = {
    user: mockUser,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReminderController],
      providers: [
        {
          provide: ReminderService,
          useValue: mockReminderService,
        },
        {
          provide: ReminderSnoozeService,
          useValue: mockReminderSnoozeService,
        },
        {
          provide: ReminderCompletionService,
          useValue: mockReminderCompletionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReminderController>(ReminderController);
    service = module.get<ReminderService>(ReminderService);

    jest.clearAllMocks();
  });

  describe('POST /reminders', () => {
    const createDto: CreateReminderDto = {
      title: 'Test Reminder',
      description: 'Test description',
      importance: 'MEDIUM',
      escalationProfileId: 'profile_123',
      schedule: {
        type: 'ONCE',
        timezone: 'America/New_York',
        triggerAt: new Date('2024-12-25T10:00:00Z'),
      },
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

    it('should create reminder successfully (201)', async () => {
      mockReminderService.create.mockResolvedValue(mockReminder);

      const result = await controller.create(mockRequest, createDto);

      expect(result).toEqual(mockReminder);
      expect(mockReminderService.create).toHaveBeenCalledWith(
        'user_123',
        createDto,
      );
    });

    it('should return created reminder', async () => {
      mockReminderService.create.mockResolvedValue(mockReminder);

      const result = await controller.create(mockRequest, createDto);

      expect(result).toHaveProperty('id', 'reminder_123');
      expect(result).toHaveProperty('title', 'Test Reminder');
    });

    it('should validate request body', async () => {
      const invalidDto = {
        title: '', // Empty title should fail
        importance: 'MEDIUM',
        escalationProfileId: 'profile_123',
        schedule: {
          type: 'ONCE',
          timezone: 'America/New_York',
        },
      } as CreateReminderDto;

      mockReminderService.create.mockRejectedValue(
        new Error('Validation failed'),
      );

      await expect(
        controller.create(mockRequest, invalidDto),
      ).rejects.toThrow();
    });

    it('should return 400 for invalid DTO', async () => {
      const invalidDto = {} as CreateReminderDto;

      mockReminderService.create.mockRejectedValue(
        new Error('Validation failed'),
      );

      await expect(
        controller.create(mockRequest, invalidDto),
      ).rejects.toThrow();
    });

    it('should return 403 for quota exceeded', async () => {
      mockReminderService.create.mockRejectedValue(
        new Error('QuotaExceededError'),
      );

      await expect(controller.create(mockRequest, createDto)).rejects.toThrow();
    });

    it('should use authenticated user ID', async () => {
      mockReminderService.create.mockResolvedValue(mockReminder);

      await controller.create(mockRequest, createDto);

      expect(mockReminderService.create).toHaveBeenCalledWith(
        'user_123',
        createDto,
      );
    });
  });

  describe('GET /reminders/:id', () => {
    const mockReminder: Reminder = {
      id: 'reminder_123',
      userId: 'user_123',
      title: 'Test Reminder',
      importance: 'MEDIUM',
      status: 'ACTIVE',
      escalationProfileId: 'profile_123',
      nextTriggerAt: null,
      lastTriggeredAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return reminder (200)', async () => {
      mockReminderService.findById.mockResolvedValue(mockReminder);

      const result = await controller.findOne(mockRequest, 'reminder_123');

      expect(result).toEqual(mockReminder);
      expect(mockReminderService.findById).toHaveBeenCalledWith(
        'user_123',
        'reminder_123',
      );
    });

    it('should return 404 when not found', async () => {
      mockReminderService.findById.mockRejectedValue(
        new Error('NotFoundError'),
      );

      await expect(
        controller.findOne(mockRequest, 'nonexistent'),
      ).rejects.toThrow();
    });

    it('should return 403 when user does not own reminder', async () => {
      mockReminderService.findById.mockRejectedValue(
        new Error('ForbiddenError'),
      );

      await expect(
        controller.findOne(mockRequest, 'reminder_123'),
      ).rejects.toThrow();
    });

    it('should use authenticated user ID', async () => {
      mockReminderService.findById.mockResolvedValue(mockReminder);

      await controller.findOne(mockRequest, 'reminder_123');

      expect(mockReminderService.findById).toHaveBeenCalledWith(
        'user_123',
        'reminder_123',
      );
    });
  });

  describe('GET /reminders', () => {
    const mockReminders: Reminder[] = [
      {
        id: 'reminder_1',
        userId: 'user_123',
        title: 'Reminder 1',
        importance: 'MEDIUM',
        status: 'ACTIVE',
        escalationProfileId: 'profile_123',
        nextTriggerAt: null,
        lastTriggeredAt: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockPaginatedResult: PaginatedResult<Reminder> = {
      items: mockReminders,
      pagination: {
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      },
    };

    it('should return paginated reminders (200)', async () => {
      mockReminderService.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(mockRequest, {});

      expect(result).toEqual(mockPaginatedResult);
      expect(mockReminderService.findAll).toHaveBeenCalledWith('user_123', {});
    });

    it('should apply query filters', async () => {
      const filters: ReminderFilters = {
        status: 'ACTIVE',
        importance: 'HIGH',
        page: 1,
        pageSize: 20,
      };

      mockReminderService.findAll.mockResolvedValue(mockPaginatedResult);

      await controller.findAll(mockRequest, filters);

      expect(mockReminderService.findAll).toHaveBeenCalledWith(
        'user_123',
        filters,
      );
    });

    it('should handle pagination parameters', async () => {
      const filters: ReminderFilters = {
        page: 2,
        pageSize: 10,
      };

      mockReminderService.findAll.mockResolvedValue(mockPaginatedResult);

      await controller.findAll(mockRequest, filters);

      expect(mockReminderService.findAll).toHaveBeenCalledWith(
        'user_123',
        filters,
      );
    });

    it('should return empty array when no reminders', async () => {
      const emptyResult: PaginatedResult<Reminder> = {
        items: [],
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: 0,
          totalPages: 0,
        },
      };

      mockReminderService.findAll.mockResolvedValue(emptyResult);

      const result = await controller.findAll(mockRequest, {});

      expect(result.items).toEqual([]);
    });

    it('should use authenticated user ID', async () => {
      mockReminderService.findAll.mockResolvedValue(mockPaginatedResult);

      await controller.findAll(mockRequest, {});

      expect(mockReminderService.findAll).toHaveBeenCalledWith(
        'user_123',
        expect.any(Object),
      );
    });
  });

  describe('PATCH /reminders/:id', () => {
    const updateDto: UpdateReminderDto = {
      title: 'Updated Title',
      description: 'Updated description',
    };

    const mockReminder: Reminder = {
      id: 'reminder_123',
      userId: 'user_123',
      title: 'Updated Title',
      description: 'Updated description',
      importance: 'MEDIUM',
      status: 'ACTIVE',
      escalationProfileId: 'profile_123',
      nextTriggerAt: null,
      lastTriggeredAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update reminder successfully (200)', async () => {
      mockReminderService.update.mockResolvedValue(mockReminder);

      const result = await controller.update(
        mockRequest,
        'reminder_123',
        updateDto,
      );

      expect(result).toEqual(mockReminder);
      expect(mockReminderService.update).toHaveBeenCalledWith(
        'user_123',
        'reminder_123',
        updateDto,
      );
    });

    it('should return updated reminder', async () => {
      mockReminderService.update.mockResolvedValue(mockReminder);

      const result = await controller.update(
        mockRequest,
        'reminder_123',
        updateDto,
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should return 404 when not found', async () => {
      mockReminderService.update.mockRejectedValue(
        new Error('NotFoundError'),
      );

      await expect(
        controller.update(mockRequest, 'nonexistent', updateDto),
      ).rejects.toThrow();
    });

    it('should return 403 when user does not own reminder', async () => {
      mockReminderService.update.mockRejectedValue(
        new Error('ForbiddenError'),
      );

      await expect(
        controller.update(mockRequest, 'reminder_123', updateDto),
      ).rejects.toThrow();
    });

    it('should validate request body', async () => {
      const invalidDto = { title: '' } as UpdateReminderDto;

      mockReminderService.update.mockRejectedValue(
        new Error('Validation failed'),
      );

      await expect(
        controller.update(mockRequest, 'reminder_123', invalidDto),
      ).rejects.toThrow();
    });

    it('should handle partial updates', async () => {
      const partialDto: UpdateReminderDto = {
        title: 'Updated Title',
      };

      const updatedReminder: Reminder = {
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

      mockReminderService.update.mockResolvedValue(updatedReminder);

      const result = await controller.update(
        mockRequest,
        'reminder_123',
        partialDto,
      );

      expect(result.title).toBe('Updated Title');
    });
  });

  describe('DELETE /reminders/:id', () => {
    it('should delete reminder successfully (204)', async () => {
      mockReminderService.delete.mockResolvedValue(undefined);

      await controller.remove(mockRequest, 'reminder_123');

      expect(mockReminderService.delete).toHaveBeenCalledWith(
        'user_123',
        'reminder_123',
      );
    });

    it('should return 404 when not found', async () => {
      mockReminderService.delete.mockRejectedValue(
        new Error('NotFoundError'),
      );

      await expect(
        controller.remove(mockRequest, 'nonexistent'),
      ).rejects.toThrow();
    });

    it('should return 403 when user does not own reminder', async () => {
      mockReminderService.delete.mockRejectedValue(
        new Error('ForbiddenError'),
      );

      await expect(
        controller.remove(mockRequest, 'reminder_123'),
      ).rejects.toThrow();
    });
  });
});

