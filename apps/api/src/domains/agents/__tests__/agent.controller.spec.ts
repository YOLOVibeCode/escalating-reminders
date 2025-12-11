import { Test, TestingModule } from '@nestjs/testing';
import { AgentController } from '../agent.controller';
import { AgentDefinitionService } from '../agent-definition.service';
import { UserAgentSubscriptionService } from '../user-agent-subscription.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type {
  AgentDefinition,
  UserAgentSubscription,
  TestResult,
} from '@er/types';

describe('AgentController', () => {
  let controller: AgentController;
  let agentDefinitionService: AgentDefinitionService;
  let subscriptionService: UserAgentSubscriptionService;

  const mockAgentDefinitionService = {
    findAll: jest.fn(),
    findByType: jest.fn(),
  };

  const mockSubscriptionService = {
    findByUser: jest.fn(),
    subscribe: jest.fn(),
    update: jest.fn(),
    unsubscribe: jest.fn(),
    test: jest.fn(),
  };

  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
  };

  const mockRequest = {
    user: mockUser,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [
        {
          provide: AgentDefinitionService,
          useValue: mockAgentDefinitionService,
        },
        {
          provide: UserAgentSubscriptionService,
          useValue: mockSubscriptionService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AgentController>(AgentController);
    agentDefinitionService = module.get<AgentDefinitionService>(
      AgentDefinitionService,
    );
    subscriptionService = module.get<UserAgentSubscriptionService>(
      UserAgentSubscriptionService,
    );

    jest.clearAllMocks();
  });

  describe('GET /agents', () => {
    it('should return all available agents', async () => {
      const mockAgents: AgentDefinition[] = [
        {
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
        },
      ];

      mockAgentDefinitionService.findAll.mockResolvedValue(mockAgents);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(mockAgents);
      expect(mockAgentDefinitionService.findAll).toHaveBeenCalledWith(
        'user_123',
      );
    });
  });

  describe('GET /agents/subscriptions', () => {
    it('should return user subscriptions', async () => {
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

      mockSubscriptionService.findByUser.mockResolvedValue(mockSubscriptions);

      const result = await controller.findSubscriptions(mockRequest);

      expect(result).toEqual(mockSubscriptions);
      expect(mockSubscriptionService.findByUser).toHaveBeenCalledWith(
        'user_123',
      );
    });
  });

  describe('POST /agents/:id/subscribe', () => {
    it('should subscribe to agent successfully', async () => {
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

      mockSubscriptionService.subscribe.mockResolvedValue(mockSubscription);

      const result = await controller.subscribe(
        mockRequest,
        'email',
        { configuration: { apiKey: 'test' } },
      );

      expect(result).toEqual(mockSubscription);
      expect(mockSubscriptionService.subscribe).toHaveBeenCalledWith(
        'user_123',
        'email',
        { apiKey: 'test' },
      );
    });
  });

  describe('PATCH /agents/subscriptions/:id', () => {
    it('should update subscription successfully', async () => {
      const mockUpdatedSubscription: UserAgentSubscription = {
        id: 'sub_1',
        userId: 'user_123',
        agentDefinitionId: 'agent_1',
        isEnabled: true,
        configuration: { apiKey: 'updated' },
        webhookSecret: null,
        lastTestedAt: null,
        lastTestResult: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSubscriptionService.update.mockResolvedValue(mockUpdatedSubscription);

      const result = await controller.updateSubscription(
        mockRequest,
        'sub_1',
        { configuration: { apiKey: 'updated' } },
      );

      expect(result).toEqual(mockUpdatedSubscription);
    });
  });

  describe('DELETE /agents/subscriptions/:id', () => {
    it('should unsubscribe successfully', async () => {
      mockSubscriptionService.unsubscribe.mockResolvedValue(undefined);

      await controller.unsubscribe(mockRequest, 'sub_1');

      expect(mockSubscriptionService.unsubscribe).toHaveBeenCalledWith(
        'user_123',
        'sub_1',
      );
    });
  });

  describe('POST /agents/subscriptions/:id/test', () => {
    it('should test subscription successfully', async () => {
      const mockTestResult: TestResult = {
        success: true,
        message: 'Test notification sent successfully',
        deliveryTime: 100,
      };

      mockSubscriptionService.test.mockResolvedValue(mockTestResult);

      const result = await controller.test(mockRequest, 'sub_1');

      expect(result).toEqual(mockTestResult);
      expect(mockSubscriptionService.test).toHaveBeenCalledWith(
        'user_123',
        'sub_1',
      );
    });
  });
});

