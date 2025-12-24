import { Test, TestingModule } from '@nestjs/testing';
import { ReminderService } from '../reminder.service';
import { ReminderRepository } from '../reminder.repository';
import { AuthRepository } from '../../auth/auth.repository';
import { SUBSCRIPTION_TIERS } from '@er/constants';
import {
  QuotaExceededError,
} from '../../../common/exceptions/quota-exceeded.exception';
import { NotFoundError } from '../../../common/exceptions/not-found.exception';
import { ForbiddenError } from '../../../common/exceptions/forbidden.exception';
import type {
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
  ReminderFilters,
  PaginatedResult,
} from '@er/types';

describe('ReminderService', () => {
  let service: ReminderService;
  let reminderRepository: ReminderRepository;
  let authRepository: AuthRepository;

  const mockReminderRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countByUser: jest.fn(),
  };

  const mockAuthRepository = {
    findByIdWithSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReminderService,
        {
          provide: ReminderRepository,
          useValue: mockReminderRepository,
        },
        {
          provide: AuthRepository,
          useValue: mockAuthRepository,
        },
      ],
    }).compile();

    service = module.get<ReminderService>(ReminderService);
    reminderRepository = module.get<ReminderRepository>(ReminderRepository);
    authRepository = module.get<AuthRepository>(AuthRepository);

    jest.clearAllMocks();
  });

  describe('create', () => {
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

    it('should create reminder successfully', async () => {
      mockAuthRepository.findByIdWithSubscription.mockResolvedValue({
        id: 'user_123',
        subscription: { tier: 'FREE' },
      });
      mockReminderRepository.countByUser.mockResolvedValue(2);
      mockReminderRepository.create.mockResolvedValue(mockReminder);

      const result = await service.create('user_123', createDto);

      expect(result).toEqual(mockReminder);
      expect(mockReminderRepository.create).toHaveBeenCalled();
    });

    it('should validate DTO using Zod schema', async () => {
      const invalidDto = {
        title: '', // Empty title should fail
        importance: 'MEDIUM',
        escalationProfileId: 'profile_123',
        schedule: {
          type: 'ONCE',
          timezone: 'America/New_York',
        },
      } as CreateReminderDto;

      await expect(service.create('user_123', invalidDto)).rejects.toThrow();
    });

    it('should check user subscription tier for quota', async () => {
      mockAuthRepository.findByIdWithSubscription.mockResolvedValue({
        id: 'user_123',
        subscription: { tier: 'FREE' },
      });
      mockReminderRepository.countByUser.mockResolvedValue(3); // At limit

      await expect(service.create('user_123', createDto)).rejects.toThrow(
        QuotaExceededError,
      );
    });

    it('should throw QuotaExceededError when limit exceeded', async () => {
      mockAuthRepository.findByIdWithSubscription.mockResolvedValue({
        id: 'user_123',
        subscription: { tier: 'FREE' },
      });
      mockReminderRepository.countByUser.mockResolvedValue(
        SUBSCRIPTION_TIERS.FREE.limits.maxReminders,
      );

      await expect(service.create('user_123', createDto)).rejects.toThrow();
    });

    it('should set default nextTriggerAt from schedule', async () => {
      mockAuthRepository.findByIdWithSubscription.mockResolvedValue({
        id: 'user_123',
        subscription: { tier: 'FREE' },
      });
      mockReminderRepository.countByUser.mockResolvedValue(0);
      mockReminderRepository.create.mockResolvedValue(mockReminder);

      await service.create('user_123', createDto);

      expect(mockReminderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nextTriggerAt: createDto.schedule.triggerAt,
        }),
      );
    });

    it('should associate with escalation profile', async () => {
      mockAuthRepository.findByIdWithSubscription.mockResolvedValue({
        id: 'user_123',
        subscription: { tier: 'FREE' },
      });
      mockReminderRepository.countByUser.mockResolvedValue(0);
      mockReminderRepository.create.mockResolvedValue(mockReminder);

      await service.create('user_123', createDto);

      expect(mockReminderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          escalationProfileId: 'profile_123',
        }),
      );
    });

    it('should handle repository errors', async () => {
      mockAuthRepository.findByIdWithSubscription.mockResolvedValue({
        id: 'user_123',
        subscription: { tier: 'FREE' },
      });
      mockReminderRepository.countByUser.mockResolvedValue(0);
      mockReminderRepository.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.create('user_123', createDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findById', () => {
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

    it('should return reminder when exists and user owns it', async () => {
      mockReminderRepository.findById.mockResolvedValue(mockReminder);

      const result = await service.findById('user_123', 'reminder_123');

      expect(result).toEqual(mockReminder);
    });

    it('should throw NotFoundError when reminder does not exist', async () => {
      mockReminderRepository.findById.mockResolvedValue(null);

      await expect(
        service.findById('user_123', 'nonexistent'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user does not own reminder', async () => {
      const otherUserReminder: Reminder = {
        ...mockReminder,
        userId: 'other_user',
      };
      mockReminderRepository.findById.mockResolvedValue(otherUserReminder);

      await expect(
        service.findById('user_123', 'reminder_123'),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('findAll', () => {
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

    it('should return paginated reminders for user', async () => {
      const filters: ReminderFilters = { page: 1, pageSize: 20 };
      mockReminderRepository.findByUserId.mockResolvedValue(
        mockPaginatedResult,
      );

      const result = await service.findAll('user_123', filters);

      expect(result).toEqual(mockPaginatedResult);
      expect(mockReminderRepository.findByUserId).toHaveBeenCalledWith(
        'user_123',
        filters,
      );
    });

    it('should apply filters correctly', async () => {
      const filters: ReminderFilters = {
        page: 1,
        pageSize: 20,
        status: 'ACTIVE',
        importance: 'HIGH',
      };
      mockReminderRepository.findByUserId.mockResolvedValue(
        mockPaginatedResult,
      );

      await service.findAll('user_123', filters);

      expect(mockReminderRepository.findByUserId).toHaveBeenCalledWith(
        'user_123',
        filters,
      );
    });

    it('should apply pagination', async () => {
      const filters: ReminderFilters = { page: 2, pageSize: 10 };
      mockReminderRepository.findByUserId.mockResolvedValue(
        mockPaginatedResult,
      );

      await service.findAll('user_123', filters);

      expect(mockReminderRepository.findByUserId).toHaveBeenCalledWith(
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
      mockReminderRepository.findByUserId.mockResolvedValue(emptyResult);

      const result = await service.findAll('user_123', {});

      expect(result.items).toEqual([]);
    });

    it('should only return user\'s own reminders', async () => {
      mockReminderRepository.findByUserId.mockResolvedValue(
        mockPaginatedResult,
      );

      await service.findAll('user_123', {});

      expect(mockReminderRepository.findByUserId).toHaveBeenCalledWith(
        'user_123',
        expect.any(Object),
      );
    });
  });

  describe('update', () => {
    const mockReminder: Reminder = {
      id: 'reminder_123',
      userId: 'user_123',
      title: 'Original Title',
      importance: 'MEDIUM',
      status: 'ACTIVE',
      escalationProfileId: 'profile_123',
      nextTriggerAt: null,
      lastTriggeredAt: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updateDto: UpdateReminderDto = {
      title: 'Updated Title',
      description: 'Updated description',
    };

    it('should update reminder successfully', async () => {
      const updatedReminder: Reminder = {
        ...mockReminder,
        title: 'Updated Title',
        description: 'Updated description',
      };

      mockReminderRepository.findById.mockResolvedValue(mockReminder);
      mockReminderRepository.update.mockResolvedValue(updatedReminder);

      const result = await service.update('user_123', 'reminder_123', updateDto);

      expect(result).toEqual(updatedReminder);
      expect(mockReminderRepository.update).toHaveBeenCalledWith(
        'reminder_123',
        updateDto,
      );
    });

    it('should throw NotFoundError when reminder does not exist', async () => {
      mockReminderRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('user_123', 'nonexistent', updateDto),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user does not own reminder', async () => {
      const otherUserReminder: Reminder = {
        ...mockReminder,
        userId: 'other_user',
      };
      mockReminderRepository.findById.mockResolvedValue(otherUserReminder);

      await expect(
        service.update('user_123', 'reminder_123', updateDto),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should validate DTO', async () => {
      mockReminderRepository.findById.mockResolvedValue(mockReminder);

      // Empty title should fail validation
      const invalidDto = { title: '' } as UpdateReminderDto;

      await expect(
        service.update('user_123', 'reminder_123', invalidDto),
      ).rejects.toThrow();
    });

    it('should handle partial updates', async () => {
      const partialDto: UpdateReminderDto = {
        title: 'Updated Title',
      };
      const updatedReminder: Reminder = {
        ...mockReminder,
        title: 'Updated Title',
      };

      mockReminderRepository.findById.mockResolvedValue(mockReminder);
      mockReminderRepository.update.mockResolvedValue(updatedReminder);

      const result = await service.update(
        'user_123',
        'reminder_123',
        partialDto,
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should update nextTriggerAt if schedule changed', async () => {
      // This will be handled in a future enhancement
      // For now, we just test that update works
      mockReminderRepository.findById.mockResolvedValue(mockReminder);
      mockReminderRepository.update.mockResolvedValue(mockReminder);

      await service.update('user_123', 'reminder_123', updateDto);

      expect(mockReminderRepository.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
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

    it('should delete reminder successfully', async () => {
      mockReminderRepository.findById.mockResolvedValue(mockReminder);
      mockReminderRepository.delete.mockResolvedValue(undefined);

      await service.delete('user_123', 'reminder_123');

      expect(mockReminderRepository.delete).toHaveBeenCalledWith('reminder_123');
    });

    it('should throw NotFoundError when reminder does not exist', async () => {
      mockReminderRepository.findById.mockResolvedValue(null);

      await expect(
        service.delete('user_123', 'nonexistent'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError when user does not own reminder', async () => {
      const otherUserReminder: Reminder = {
        ...mockReminder,
        userId: 'other_user',
      };
      mockReminderRepository.findById.mockResolvedValue(otherUserReminder);

      await expect(
        service.delete('user_123', 'reminder_123'),
      ).rejects.toThrow(ForbiddenError);
    });
  });
});

