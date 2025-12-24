import { Test, TestingModule } from '@nestjs/testing';
import { AdminDashboardService } from '../admin-dashboard.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import type { SystemHealthSnapshot } from '@er/types';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let prismaService: PrismaService;
  let cacheService: RedisService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    subscription: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    paymentHistory: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    reminder: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    notificationLog: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    systemHealthSnapshot: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminDashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: 'ICache',
          useValue: mockCacheService,
        },
        // Note: In real implementation, you'd inject actual repositories
        // For testing, we're mocking Prisma directly
      ],
    }).compile();

    service = module.get<AdminDashboardService>(AdminDashboardService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<RedisService>('ICache');

    jest.clearAllMocks();
  });

  describe('getDashboardOverview', () => {
    it('should return dashboard overview with cached data', async () => {
      const cachedOverview = {
        mrr: 1000,
        activeUsers: 50,
        activeReminders: 200,
        deliveryRate: 95.5,
        queueDepth: 10,
        recentErrors: 2,
        timestamp: new Date(),
      };

      mockCacheService.get.mockResolvedValue(cachedOverview);

      const result = await service.getDashboardOverview();

      expect(result).toEqual(cachedOverview);
      expect(mockCacheService.get).toHaveBeenCalledWith('admin:dashboard:overview');
    });

    it('should calculate overview when cache miss', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.subscription.findMany.mockResolvedValue([
        {
          id: 'sub_1',
          paymentHistory: [{ amount: 10000 }],
        },
      ]);
      mockPrismaService.user.count.mockResolvedValue(50);
      mockPrismaService.reminder.count.mockResolvedValue(200);
      mockPrismaService.notificationLog.count
        .mockResolvedValueOnce(100) // sent
        .mockResolvedValueOnce(95); // delivered

      const result = await service.getDashboardOverview();

      expect(result).toHaveProperty('mrr');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('activeReminders');
      expect(result).toHaveProperty('deliveryRate');
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(1000) // total
        .mockResolvedValueOnce(800) // active
        .mockResolvedValueOnce(5) // new today
        .mockResolvedValueOnce(30) // new this week
        .mockResolvedValueOnce(120); // new this month

      mockPrismaService.subscription.groupBy.mockResolvedValue([
        { tier: 'FREE', _count: 500 },
        { tier: 'PERSONAL', _count: 300 },
        { tier: 'PRO', _count: 200 },
      ]);

      const result = await service.getUserStats();

      expect(result.total).toBe(1000);
      expect(result.active).toBe(800);
      expect(result.newToday).toBe(5);
      expect(result.byTier).toHaveProperty('FREE');
    });
  });

  describe('getUserList', () => {
    it('should return paginated user list', async () => {
      const mockUsers = [
        {
          id: 'user_1',
          email: 'user1@example.com',
          createdAt: new Date(),
        },
        {
          id: 'user_2',
          email: 'user2@example.com',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(100);

      const result = await service.getUserList({ page: 1, pageSize: 10 });

      expect(result.items).toEqual(mockUsers);
      expect(result.pagination.totalItems).toBe(100);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
    });

    it('should filter users by search term', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.getUserList({ search: 'test@example.com', page: 1, pageSize: 10 });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: expect.objectContaining({ contains: 'test@example.com' }),
          }),
        }),
      );
    });
  });

  describe('getBillingStats', () => {
    it('should return billing statistics', async () => {
      mockPrismaService.subscription.count
        .mockResolvedValueOnce(1000) // total
        .mockResolvedValueOnce(900) // active
        .mockResolvedValueOnce(50) // canceled
        .mockResolvedValueOnce(50); // past due

      mockPrismaService.subscription.findMany.mockResolvedValue([
        {
          id: 'sub_1',
          paymentHistory: [{ amount: 10000 }],
        },
      ]);

      mockPrismaService.subscription.groupBy.mockResolvedValue([
        { tier: 'FREE', _count: 500 },
        { tier: 'PERSONAL', _count: 300 },
        { tier: 'PRO', _count: 200 },
      ]);

      const result = await service.getBillingStats();

      expect(result.totalSubscriptions).toBe(1000);
      expect(result.activeSubscriptions).toBe(900);
      expect(result.mrr).toBeGreaterThan(0);
      expect(result.byTier).toHaveProperty('FREE');
    });
  });

  describe('getSystemHealth', () => {
    it('should return current system health', async () => {
      const mockSnapshot: SystemHealthSnapshot = {
        id: 'snapshot_123',
        timestamp: new Date(),
        queueStats: {
          waiting: 10,
          active: 5,
        },
        workerStats: {
          total: 3,
          active: 2,
        },
        databaseStats: {
          connections: 10,
        },
        redisStats: {
          memoryUsed: 1024,
        },
        notificationStats: {
          sent: 100,
        },
        errorCount: 2,
        createdAt: new Date(),
      };

      mockPrismaService.systemHealthSnapshot.findFirst.mockResolvedValue(mockSnapshot);

      const result = await service.getSystemHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('queues');
      expect(result).toHaveProperty('workers');
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('redis');
    });

    it('should return degraded status if error count is high', async () => {
      const mockSnapshot: SystemHealthSnapshot = {
        id: 'snapshot_123',
        timestamp: new Date(),
        queueStats: {},
        workerStats: {},
        databaseStats: {},
        redisStats: {},
        notificationStats: {},
        errorCount: 100, // High error count
        createdAt: new Date(),
      };

      mockPrismaService.systemHealthSnapshot.findFirst.mockResolvedValue(mockSnapshot);

      const result = await service.getSystemHealth();

      expect(result.status).toBe('down');
    });
  });

  describe('getReminderStats', () => {
    it('should return reminder statistics', async () => {
      mockPrismaService.reminder.count
        .mockResolvedValueOnce(1000) // total
        .mockResolvedValueOnce(800) // active
        .mockResolvedValueOnce(50) // snoozed
        .mockResolvedValueOnce(100) // completed
        .mockResolvedValueOnce(50); // archived

      mockPrismaService.reminder.groupBy.mockResolvedValue([
        { importance: 'LOW', _count: 200 },
        { importance: 'MEDIUM', _count: 500 },
        { importance: 'HIGH', _count: 250 },
        { importance: 'CRITICAL', _count: 50 },
      ]);
      mockPrismaService.reminder.findMany.mockResolvedValue([]);

      const result = await service.getReminderStats();

      expect(result.total).toBe(1000);
      expect(result.active).toBe(800);
      expect(result.byImportance).toHaveProperty('LOW');
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics', async () => {
      mockPrismaService.notificationLog.count
        .mockResolvedValueOnce(1000) // total
        .mockResolvedValueOnce(950) // sent
        .mockResolvedValueOnce(900) // delivered
        .mockResolvedValueOnce(50); // failed

      mockPrismaService.notificationLog.groupBy.mockResolvedValue([
        { agentType: 'email', _count: 500 },
        { agentType: 'sms', _count: 300 },
        { agentType: 'webhook', _count: 200 },
      ]);
      mockPrismaService.notificationLog.findMany.mockResolvedValue([]);

      const result = await service.getNotificationStats();

      expect(result.total).toBe(1000);
      expect(result.sent).toBe(950);
      expect(result.delivered).toBe(900);
      expect(result.deliveryRate).toBeGreaterThan(0);
      expect(result.byAgentType).toHaveProperty('email');
    });
  });
});
