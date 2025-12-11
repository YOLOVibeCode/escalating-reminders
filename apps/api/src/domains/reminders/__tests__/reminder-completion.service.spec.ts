/**
 * Tests for reminder completion service.
 * Following TDD - tests written before implementation.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ReminderCompletionService } from '../reminder-completion.service';
import { ReminderRepository } from '../reminder.repository';
import { EscalationStateService } from '../../escalation/escalation-state.service';
import { NotFoundError, ForbiddenError } from '../../../common/exceptions';
import type { Reminder, EscalationState } from '@er/types';

describe('ReminderCompletionService', () => {
  let service: ReminderCompletionService;
  let reminderRepository: ReminderRepository;
  let escalationStateService: EscalationStateService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    reminder: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    escalationState: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReminderCompletionService,
        ReminderRepository,
        {
          provide: EscalationStateService,
          useValue: {
            acknowledge: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReminderCompletionService>(ReminderCompletionService);
    reminderRepository = module.get<ReminderRepository>(ReminderRepository);
    escalationStateService = module.get<EscalationStateService>(EscalationStateService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('complete', () => {
    const userId = 'user-123';
    const reminderId = 'reminder-123';
    const mockReminder: Reminder = {
      id: reminderId,
      userId,
      title: 'Test Reminder',
      status: 'ACTIVE',
      escalationProfileId: 'profile-123',
    } as Reminder;

    it('should mark reminder as completed successfully', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue(mockReminder);
      mockPrismaService.escalationState.findUnique.mockResolvedValue({
        id: 'state-123',
        reminderId,
        status: 'ACTIVE',
      });
      mockPrismaService.reminder.update.mockResolvedValue({
        ...mockReminder,
        status: 'COMPLETED',
        completedAt: new Date(),
      });
      mockPrismaService.escalationState.update.mockResolvedValue({
        id: 'state-123',
        status: 'COMPLETED',
      });

      await service.complete(userId, reminderId, 'manual');

      expect(mockPrismaService.reminder.update).toHaveBeenCalledWith({
        where: { id: reminderId },
        data: {
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        },
      });
      expect(mockPrismaService.escalationState.update).toHaveBeenCalledWith({
        where: { reminderId },
        data: {
          status: 'COMPLETED',
        },
      });
    });

    it('should throw NotFoundError if reminder does not exist', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue(null);

      await expect(service.complete(userId, reminderId, 'manual')).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user does not own reminder', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue({
        ...mockReminder,
        userId: 'other-user',
      });

      await expect(service.complete(userId, reminderId, 'manual')).rejects.toThrow(ForbiddenError);
    });
  });

  describe('acknowledge', () => {
    const userId = 'user-123';
    const reminderId = 'reminder-123';
    const mockReminder: Reminder = {
      id: reminderId,
      userId,
      title: 'Test Reminder',
      status: 'ACTIVE',
    } as Reminder;

    it('should acknowledge reminder successfully', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue(mockReminder);
      mockPrismaService.escalationState.findUnique.mockResolvedValue({
        id: 'state-123',
        reminderId,
        status: 'ACTIVE',
      });
      mockPrismaService.escalationState.update.mockResolvedValue({
        id: 'state-123',
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
      });

      await service.acknowledge(userId, reminderId);

      expect(mockPrismaService.escalationState.update).toHaveBeenCalledWith({
        where: { reminderId },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: expect.any(Date),
          acknowledgedBy: userId,
        },
      });
    });

    it('should throw NotFoundError if reminder does not exist', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue(null);

      await expect(service.acknowledge(userId, reminderId)).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user does not own reminder', async () => {
      mockPrismaService.reminder.findUnique.mockResolvedValue({
        ...mockReminder,
        userId: 'other-user',
      });

      await expect(service.acknowledge(userId, reminderId)).rejects.toThrow(ForbiddenError);
    });
  });
});


