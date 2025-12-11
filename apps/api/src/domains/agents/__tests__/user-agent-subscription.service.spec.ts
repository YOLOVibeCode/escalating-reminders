import { Test, TestingModule } from '@nestjs/testing';
import { UserAgentSubscriptionService } from '../user-agent-subscription.service';
import { UserAgentSubscriptionRepository } from '../user-agent-subscription.repository';
import { AgentDefinitionRepository } from '../agent-definition.repository';
import { AuthRepository } from '../../auth/auth.repository';
import { SUBSCRIPTION_TIERS } from '@er/constants';
import type { UserAgentSubscription, AgentDefinition } from '@er/types';

describe('UserAgentSubscriptionService', () => {
  let service: UserAgentSubscriptionService;
  let subscriptionRepository: UserAgentSubscriptionRepository;
  let agentDefinitionRepository: AgentDefinitionRepository;
  let authRepository: AuthRepository;

  const mockSubscriptionRepository = {
    findByUser: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    countByUser: jest.fn(),
    findByUserAndAgentType: jest.fn(),
  };

  const mockAgentDefinitionRepository = {
    findByType: jest.fn(),
    findAll: jest.fn(),
  };

  const mockAuthRepository = {
    findByIdWithSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAgentSubscriptionService,
        {
          provide: UserAgentSubscriptionRepository,
          useValue: mockSubscriptionRepository,
        },
        {
          provide: AgentDefinitionRepository,
          useValue: mockAgentDefinitionRepository,
        },
        {
          provide: AuthRepository,
          useValue: mockAuthRepository,
        },
      ],
    }).compile();

    service = module.get<UserAgentSubscriptionService>(
      UserAgentSubscriptionService,
    );
    subscriptionRepository = module.get<UserAgentSubscriptionRepository>(
      UserAgentSubscriptionRepository,
    );
    agentDefinitionRepository = module.get<AgentDefinitionRepository>(
      AgentDefinitionRepository,
    );
    authRepository = module.get<AuthRepository>(AuthRepository);

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

      mockSubscriptionRepository.findByUser.mockResolvedValue(
        mockSubscriptions,
      );

      const result = await service.findByUser('user_123');

      expect(result).toEqual(mockSubscriptions);
    });
  });

  describe('subscribe', () => {
    const mockAgentDefinition: AgentDefinition = {
      id: 'agent_1',
      type: 'email',
      name: 'Email',
      description: 'Send via email',
      version: '1.0.0',
      author: 'System',
      isOfficial: true,
      isVerified: true,
      capabilities: {},
      configurationSchema: {},
      minimumTier: 'FREE',
      iconUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should subscribe to agent successfully', async () => {
      mockAuthRepository.findByIdWithSubscription.mockResolvedValue({
        id: 'user_123',
        subscription: { tier: 'FREE' },
      });
      mockAgentDefinitionRepository.findByType.mockResolvedValue(
        mockAgentDefinition,
      );
      mockSubscriptionRepository.countByUser.mockResolvedValue(0);
      mockSubscriptionRepository.findByUserAndAgentType.mockResolvedValue(
        null,
      );
      mockSubscriptionRepository.create.mockResolvedValue({
        id: 'sub_1',
        userId: 'user_123',
        agentDefinitionId: 'agent_1',
        isEnabled: true,
        configuration: { apiKey: 'test' },
        webhookSecret: null,
        lastTestedAt: null,
        lastTestResult: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.subscribe(
        'user_123',
        'agent_1',
        { apiKey: 'test' },
      );

      expect(result).toBeDefined();
      expect(mockSubscriptionRepository.create).toHaveBeenCalled();
    });

    it('should check subscription tier quota', async () => {
      mockAuthRepository.findByIdWithSubscription.mockResolvedValue({
        id: 'user_123',
        subscription: { tier: 'FREE' },
      });
      mockAgentDefinitionRepository.findByType.mockResolvedValue(
        mockAgentDefinition,
      );
      // FREE tier allows max 1 agent
      mockSubscriptionRepository.countByUser.mockResolvedValue(1);

      await expect(
        service.subscribe('user_123', 'agent_1', {}),
      ).rejects.toThrow('QuotaExceededError');
    });

    it('should throw NotFoundError if agent does not exist', async () => {
      mockAgentDefinitionRepository.findByType.mockResolvedValue(null);

      await expect(
        service.subscribe('user_123', 'nonexistent', {}),
      ).rejects.toThrow('NotFoundError');
    });

    it('should check user tier meets agent minimum tier', async () => {
      const premiumAgent: AgentDefinition = {
        ...mockAgentDefinition,
        type: 'sms',
        minimumTier: 'PERSONAL',
      };

      mockAuthRepository.findByIdWithSubscription.mockResolvedValue({
        id: 'user_123',
        subscription: { tier: 'FREE' },
      });
      mockAgentDefinitionRepository.findByType.mockResolvedValue(premiumAgent);

      await expect(
        service.subscribe('user_123', 'agent_1', {}),
      ).rejects.toThrow('ForbiddenError');
    });
  });

  describe('update', () => {
    it('should update subscription successfully', async () => {
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

      mockSubscriptionRepository.findById.mockResolvedValue(mockSubscription);
      mockSubscriptionRepository.update.mockResolvedValue({
        ...mockSubscription,
        configuration: { apiKey: 'updated' },
      });

      const result = await service.update('user_123', 'sub_1', {
        apiKey: 'updated',
      });

      expect(result.configuration).toEqual({ apiKey: 'updated' });
    });

    it('should throw NotFoundError if subscription does not exist', async () => {
      mockSubscriptionRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('user_123', 'nonexistent', {}),
      ).rejects.toThrow('NotFoundError');
    });

    it('should throw ForbiddenError if user does not own subscription', async () => {
      const otherUserSubscription: UserAgentSubscription = {
        id: 'sub_1',
        userId: 'other_user',
        agentDefinitionId: 'agent_1',
        isEnabled: true,
        configuration: {},
        webhookSecret: null,
        lastTestedAt: null,
        lastTestResult: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionRepository.findById.mockResolvedValue(
        otherUserSubscription,
      );

      await expect(
        service.update('user_123', 'sub_1', {}),
      ).rejects.toThrow('ForbiddenError');
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe successfully', async () => {
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

      mockSubscriptionRepository.findById.mockResolvedValue(mockSubscription);
      mockSubscriptionRepository.delete.mockResolvedValue(undefined);

      await service.unsubscribe('user_123', 'sub_1');

      expect(mockSubscriptionRepository.delete).toHaveBeenCalledWith('sub_1');
    });
  });

  describe('test', () => {
    it('should test agent configuration', async () => {
      const mockSubscription: UserAgentSubscription = {
        id: 'sub_1',
        userId: 'user_123',
        agentDefinitionId: 'agent_1',
        isEnabled: true,
        configuration: { apiKey: 'test' },
        webhookSecret: null,
        lastTestedAt: null,
        lastTestResult: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionRepository.findById.mockResolvedValue(mockSubscription);

      // For now, test will be a placeholder
      const result = await service.test('user_123', 'sub_1');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    });
  });
});

