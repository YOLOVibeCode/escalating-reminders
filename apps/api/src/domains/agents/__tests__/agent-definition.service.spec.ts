import { Test, TestingModule } from '@nestjs/testing';
import { AgentDefinitionService } from '../agent-definition.service';
import { AgentDefinitionRepository } from '../agent-definition.repository';
import { AuthRepository } from '../../auth/auth.repository';
import { NotFoundError } from '../../../common/exceptions/not-found.exception';
import type { AgentDefinition } from '@er/types';

describe('AgentDefinitionService', () => {
  let service: AgentDefinitionService;
  let repository: AgentDefinitionRepository;

  const mockRepository = {
    findAll: jest.fn(),
    findByType: jest.fn(),
  };

  const mockAuthRepository = {
    findByIdWithSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentDefinitionService,
        {
          provide: AgentDefinitionRepository,
          useValue: mockRepository,
        },
        {
          provide: AuthRepository,
          useValue: mockAuthRepository,
        },
      ],
    }).compile();

    service = module.get<AgentDefinitionService>(AgentDefinitionService);
    repository = module.get<AgentDefinitionRepository>(
      AgentDefinitionRepository,
    );

    jest.clearAllMocks();
  });

  describe('findAll', () => {
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
        {
          id: 'agent_2',
          type: 'sms',
          name: 'SMS',
          description: 'Send via SMS',
          version: '1.0.0',
          author: 'System',
          isOfficial: true,
          isVerified: true,
          capabilities: {},
          configurationSchema: {},
          minimumTier: 'PERSONAL',
          iconUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findAll.mockResolvedValue(mockAgents);

      const result = await service.findAll();

      expect(result).toEqual(mockAgents);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should filter by user subscription tier when userId provided', async () => {
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
        {
          id: 'agent_2',
          type: 'sms',
          name: 'SMS',
          description: 'Send via SMS',
          version: '1.0.0',
          author: 'System',
          isOfficial: true,
          isVerified: true,
          capabilities: {},
          configurationSchema: {},
          minimumTier: 'PERSONAL',
          iconUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.findAll.mockResolvedValue(mockAgents);
      mockAuthRepository.findByIdWithSubscription.mockResolvedValue({
        id: 'user_free',
        subscription: { tier: 'FREE' },
      });

      // User with FREE tier should only see FREE agents
      const result = await service.findAll('user_free');

      expect(result.length).toBe(1);
      expect(result[0]?.type).toBe('email');
    });
  });

  describe('findByType', () => {
    it('should return agent by type', async () => {
      const mockAgent: AgentDefinition = {
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

      mockRepository.findByType.mockResolvedValue(mockAgent);

      const result = await service.findByType('email');

      expect(result).toEqual(mockAgent);
    });

    it('should throw NotFoundError when agent does not exist', async () => {
      mockRepository.findByType.mockResolvedValue(null);

      await expect(service.findByType('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});

