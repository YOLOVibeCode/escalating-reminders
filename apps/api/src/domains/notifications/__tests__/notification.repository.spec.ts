import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { NotificationRepository } from '../notification.repository';
import type { NotificationLog } from '@er/types';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notificationLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<NotificationRepository>(NotificationRepository);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create notification log successfully', async () => {
      const createData = {
        userId: 'user_123',
        reminderId: 'reminder_123',
        agentType: 'webhook',
        tier: 1,
        status: 'PENDING',
        metadata: { title: 'Test', message: 'Test message' },
      };

      const mockNotification: NotificationLog = {
        id: 'notif_123',
        ...createData,
        escalationStateId: null,
        sentAt: null,
        deliveredAt: null,
        failureReason: null,
        createdAt: new Date(),
      };

      mockPrismaService.notificationLog.create.mockResolvedValue(
        mockNotification,
      );

      const result = await repository.create(createData);

      expect(result).toEqual(mockNotification);
      expect(mockPrismaService.notificationLog.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe('update', () => {
    it('should update notification log successfully', async () => {
      const updateData = {
        status: 'DELIVERED',
        deliveredAt: new Date(),
      };

      const mockUpdatedNotification: NotificationLog = {
        id: 'notif_123',
        userId: 'user_123',
        reminderId: 'reminder_123',
        escalationStateId: null,
        agentType: 'webhook',
        tier: 1,
        status: 'DELIVERED',
        sentAt: new Date(),
        deliveredAt: new Date(),
        failureReason: null,
        metadata: {},
        createdAt: new Date(),
      };

      mockPrismaService.notificationLog.update.mockResolvedValue(
        mockUpdatedNotification,
      );

      const result = await repository.update('notif_123', updateData);

      expect(result).toEqual(mockUpdatedNotification);
      expect(mockPrismaService.notificationLog.update).toHaveBeenCalledWith({
        where: { id: 'notif_123' },
        data: updateData,
      });
    });
  });

  describe('findByReminderId', () => {
    it('should return notifications for a reminder', async () => {
      const mockNotifications: NotificationLog[] = [
        {
          id: 'notif_1',
          userId: 'user_123',
          reminderId: 'reminder_123',
          escalationStateId: null,
          agentType: 'webhook',
          tier: 1,
          status: 'DELIVERED',
          sentAt: new Date(),
          deliveredAt: new Date(),
          failureReason: null,
          metadata: {},
          createdAt: new Date(),
        },
      ];

      mockPrismaService.notificationLog.findMany.mockResolvedValue(
        mockNotifications,
      );

      const result = await repository.findByReminderId('reminder_123');

      expect(result).toEqual(mockNotifications);
      expect(mockPrismaService.notificationLog.findMany).toHaveBeenCalledWith({
        where: { reminderId: 'reminder_123' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});

