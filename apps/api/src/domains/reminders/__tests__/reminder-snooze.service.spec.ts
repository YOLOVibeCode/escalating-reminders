/**
 * Tests for reminder snooze service.
 * Following TDD - tests written before implementation.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ReminderSnoozeService } from '../reminder-snooze.service';
import { ReminderRepository } from '../reminder.repository';
import { AuthRepository } from '../../auth/auth.repository';
import { NotFoundError, ForbiddenError, ValidationError } from '../../../common/exceptions';
import { parseNaturalLanguageDateTime } from '@er/utils';
import type { Reminder, ReminderSnooze } from '@er/types';

jest.mock('@er/utils', () => {
  const actual = jest.requireActual('@er/utils');
  return {
    ...actual,
    parseNaturalLanguageDateTime: jest.fn(),
  };
});

describe('ReminderSnoozeService', () => {
  let service: ReminderSnoozeService;
  let reminderRepository: ReminderRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    reminder: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    reminderSnooze: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReminderSnoozeService,
        ReminderRepository,
        AuthRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReminderSnoozeService>(ReminderSnoozeService);
    reminderRepository = module.get<ReminderRepository>(ReminderRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('snooze', () => {
    const userId = 'user-123';
    const reminderId = 'reminder-123';
    const mockReminder: Reminder = {
      id: reminderId,
      userId,
      title: 'Test Reminder',
      description: 'Test',
      importance: 'MEDIUM',
      status: 'ACTIVE',
      escalationProfileId: 'profile-123',
      nextTriggerAt: new Date('2024-01-15T10:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Reminder;

    it('should snooze reminder successfully with natural language duration', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue(mockReminder);
      
      const snoozeUntil = new Date('2024-01-20T10:00:00Z');
      const mockSnooze: ReminderSnooze = {
        id: 'snooze-123',
        reminderId,
        snoozedAt: new Date(),
        snoozeUntil,
        reason: null,
        originalInput: 'until next Friday',
        createdAt: new Date(),
      };

      mockPrismaService.reminderSnooze.create.mockResolvedValue(mockSnooze);
      mockPrismaService.reminder.update.mockResolvedValue({
        ...mockReminder,
        status: 'SNOOZED',
        nextTriggerAt: snoozeUntil,
      });

      (parseNaturalLanguageDateTime as unknown as jest.Mock).mockReturnValue({
        date: snoozeUntil,
        isValid: true,
        originalText: 'until next Friday',
        confidence: 'high',
      });

      const result = await service.snooze(userId, reminderId, 'until next Friday');

      expect(result.snoozeUntil).toEqual(snoozeUntil);
      expect(result.originalInput).toBe('until next Friday');
      expect(mockPrismaService.reminder.update).toHaveBeenCalledWith({
        where: { id: reminderId },
        data: {
          status: 'SNOOZED',
          nextTriggerAt: snoozeUntil,
        },
      });
    });

    it('should throw NotFoundError if reminder does not exist', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue(null);

      await expect(service.snooze(userId, reminderId, '1 hour')).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user does not own reminder', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue({
        ...mockReminder,
        userId: 'other-user',
      });

      await expect(service.snooze(userId, reminderId, '1 hour')).rejects.toThrow(ForbiddenError);
    });

    it('should throw ValidationError if duration cannot be parsed', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue(mockReminder);

      (parseNaturalLanguageDateTime as unknown as jest.Mock).mockReturnValue({
        date: new Date(),
        isValid: false,
        originalText: 'invalid duration',
        confidence: 'low',
      });

      await expect(service.snooze(userId, reminderId, 'invalid duration')).rejects.toThrow(ValidationError);
    });
  });

  describe('cancelSnooze', () => {
    const userId = 'user-123';
    const reminderId = 'reminder-123';
    const mockReminder: Reminder = {
      id: reminderId,
      userId,
      title: 'Test Reminder',
      status: 'SNOOZED',
    } as Reminder;

    const mockSnooze: ReminderSnooze = {
      id: 'snooze-123',
      reminderId,
      snoozedAt: new Date(),
      snoozeUntil: new Date('2024-01-20T10:00:00Z'),
      createdAt: new Date(),
    };

    it('should cancel snooze successfully', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue(mockReminder);
      mockPrismaService.reminderSnooze.findFirst.mockResolvedValue(mockSnooze);
      mockPrismaService.reminder.update.mockResolvedValue({
        ...mockReminder,
        status: 'ACTIVE',
      });

      await service.cancelSnooze(userId, reminderId);

      expect(mockPrismaService.reminderSnooze.delete).toHaveBeenCalledWith({
        where: { id: mockSnooze.id },
      });
      expect(mockPrismaService.reminder.update).toHaveBeenCalledWith({
        where: { id: reminderId },
        data: { status: 'ACTIVE' },
      });
    });

    it('should throw NotFoundError if reminder does not exist', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue(null);

      await expect(service.cancelSnooze(userId, reminderId)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if reminder is not snoozed', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue({
        ...mockReminder,
        status: 'ACTIVE',
      });
      mockPrismaService.reminderSnooze.findFirst.mockResolvedValue(null);

      await expect(service.cancelSnooze(userId, reminderId)).rejects.toThrow(NotFoundError);
    });
  });
});

