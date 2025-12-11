import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { UserAgentSubscriptionRepository } from '../user-agent-subscription.repository';
import type { UserAgentSubscription } from '@er/types';

describe('UserAgentSubscriptionRepository', () => {
  let repository: UserAgentSubscriptionRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    userAgentSubscription: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAgentSubscriptionRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UserAgentSubscriptionRepository>(
      UserAgentSubscriptionRepository,
    );
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('findByUser', () => {
    it('should return all subscriptions for a user', async () => {
      const mockSubscriptions: UserAgentSubscription[] = [
        {
          id: 'sub_1',
          userId: 'user_123',
          agentDefinitionId: 'agent_1',
          isEnabled: true,
          configuration: {},
          webhookSecret: null,
          lastTestedAt: null,
          lastTestResult: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.userAgentSubscription.findMany.mockResolvedValue(
        mockSubscriptions,
      );

      const result = await repository.findByUser('user_123');

      expect(result).toEqual(mockSubscriptions);
      expect(
        mockPrismaService.userAgentSubscription.findMany,
      ).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        include: {
          agentDefinition: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return subscription by ID', async () => {
      const mockSubscription: UserAgentSubscription = {
        id: 'sub_1',
        userId: 'user_123',
        agentDefinitionId: 'agent_1',
        isEnabled: true,
        configuration: {},
        webhookSecret: null,
        lastTestedAt: null,
        lastTestResult: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.userAgentSubscription.findUnique.mockResolvedValue(
        mockSubscription,
      );

      const result = await repository.findById('sub_1');

      expect(result).toEqual(mockSubscription);
    });

    it('should return null when not found', async () => {
      mockPrismaService.userAgentSubscription.findUnique.mockResolvedValue(
        null,
      );

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create subscription successfully', async () => {
      const createData = {
        userId: 'user_123',
        agentDefinitionId: 'agent_1',
        isEnabled: true,
        configuration: { apiKey: 'test_key' },
        webhookSecret: 'secret_123',
      };

      const mockSubscription: UserAgentSubscription = {
        id: 'sub_1',
        ...createData,
        lastTestedAt: null,
        lastTestResult: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.userAgentSubscription.create.mockResolvedValue(
        mockSubscription,
      );

      const result = await repository.create(createData);

      expect(result).toEqual(mockSubscription);
      expect(
        mockPrismaService.userAgentSubscription.create,
      ).toHaveBeenCalledWith({
        data: createData,
        include: {
          agentDefinition: true,
        },
      });
    });
  });

  describe('update', () => {
    it('should update subscription successfully', async () => {
      const updateData = {
        configuration: { apiKey: 'updated_key' },
        isEnabled: false,
      };

      const mockUpdatedSubscription: UserAgentSubscription = {
        id: 'sub_1',
        userId: 'user_123',
        agentDefinitionId: 'agent_1',
        isEnabled: false,
        configuration: { apiKey: 'updated_key' },
        webhookSecret: null,
        lastTestedAt: null,
        lastTestResult: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.userAgentSubscription.update.mockResolvedValue(
        mockUpdatedSubscription,
      );

      const result = await repository.update('sub_1', updateData);

      expect(result).toEqual(mockUpdatedSubscription);
    });
  });

  describe('delete', () => {
    it('should delete subscription successfully', async () => {
      mockPrismaService.userAgentSubscription.delete.mockResolvedValue({
        id: 'sub_1',
      });

      await repository.delete('sub_1');

      expect(
        mockPrismaService.userAgentSubscription.delete,
      ).toHaveBeenCalledWith({
        where: { id: 'sub_1' },
      });
    });
  });

  describe('countByUser', () => {
    it('should return correct count', async () => {
      mockPrismaService.userAgentSubscription.count.mockResolvedValue(3);

      const result = await repository.countByUser('user_123');

      expect(result).toBe(3);
      expect(
        mockPrismaService.userAgentSubscription.count,
      ).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
      });
    });
  });

  describe('findByUserAndAgentType', () => {
    it('should return subscription for user and agent type', async () => {
      const mockSubscription: UserAgentSubscription = {
        id: 'sub_1',
        userId: 'user_123',
        agentDefinitionId: 'agent_1',
        isEnabled: true,
        configuration: {},
        webhookSecret: null,
        lastTestedAt: null,
        lastTestResult: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.userAgentSubscription.findMany.mockResolvedValue([
        mockSubscription,
      ]);

      const result = await repository.findByUserAndAgentType(
        'user_123',
        'email',
      );

      expect(result).toEqual(mockSubscription);
    });
  });
});

