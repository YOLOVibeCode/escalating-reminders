/**
 * Tests for notification query service.
 * Following TDD - tests written before implementation.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { NotificationQueryService } from '../notification-query.service';
import { NotificationRepository } from '../notification.repository';
import { NotFoundError } from '../../../common/exceptions';
import type { NotificationLog, PaginatedResult } from '@er/types';

describe('NotificationQueryService', () => {
  let service: NotificationQueryService;
  let repository: NotificationRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notificationLog: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationQueryService,
        NotificationRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationQueryService>(NotificationQueryService);
    repository = module.get<NotificationRepository>(NotificationRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    const userId = 'user-123';
    const mockNotifications: NotificationLog[] = [
      {
        id: 'notif-1',
        userId,
        reminderId: 'reminder-1',
        agentType: 'webhook',
        tier: 1,
        status: 'DELIVERED',
        sentAt: new Date(),
        deliveredAt: new Date(),
        createdAt: new Date(),
      } as NotificationLog,
    ];

    it('should return paginated notifications', async () => {
      mockPrismaService.notificationLog.findMany.mockResolvedValue(mockNotifications);
      mockPrismaService.notificationLog.count.mockResolvedValue(1);

      const result = await service.findAll(userId, { page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.totalItems).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(20);
    });

    it('should filter by reminderId if provided', async () => {
      mockPrismaService.notificationLog.findMany.mockResolvedValue(mockNotifications);
      mockPrismaService.notificationLog.count.mockResolvedValue(1);

      await service.findAll(userId, { reminderId: 'reminder-1', page: 1, pageSize: 20 });

      expect(mockPrismaService.notificationLog.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          reminderId: 'reminder-1',
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by status if provided', async () => {
      mockPrismaService.notificationLog.findMany.mockResolvedValue(mockNotifications);
      mockPrismaService.notificationLog.count.mockResolvedValue(1);

      await service.findAll(userId, { status: 'DELIVERED', page: 1, pageSize: 20 });

      expect(mockPrismaService.notificationLog.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          status: 'DELIVERED',
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    const userId = 'user-123';
    const notificationId = 'notif-123';
    const mockNotification: NotificationLog = {
      id: notificationId,
      userId,
      reminderId: 'reminder-1',
      agentType: 'webhook',
      tier: 1,
      status: 'DELIVERED',
      createdAt: new Date(),
    } as NotificationLog;

    it('should return notification by ID', async () => {
      mockPrismaService.notificationLog.findUnique.mockResolvedValue(mockNotification);

      const result = await service.findById(userId, notificationId);

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notificationLog.findUnique).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
    });

    it('should throw NotFoundError if notification does not exist', async () => {
      mockPrismaService.notificationLog.findUnique.mockResolvedValue(null);

      await expect(service.findById(userId, notificationId)).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user does not own notification', async () => {
      mockPrismaService.notificationLog.findUnique.mockResolvedValue({
        ...mockNotification,
        userId: 'other-user',
      });

      await expect(service.findById(userId, notificationId)).rejects.toThrow(ForbiddenError);
    });
  });
});


