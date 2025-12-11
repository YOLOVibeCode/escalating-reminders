import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AgentDefinitionRepository } from '../agent-definition.repository';
import type { AgentDefinition } from '@er/types';

describe('AgentDefinitionRepository', () => {
  let repository: AgentDefinitionRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    agentDefinition: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentDefinitionRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<AgentDefinitionRepository>(
      AgentDefinitionRepository,
    );
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all agent definitions', async () => {
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

      mockPrismaService.agentDefinition.findMany.mockResolvedValue(mockAgents);

      const result = await repository.findAll();

      expect(result).toEqual(mockAgents);
      expect(mockPrismaService.agentDefinition.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
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

      mockPrismaService.agentDefinition.findUnique.mockResolvedValue(
        mockAgent,
      );

      const result = await repository.findByType('email');

      expect(result).toEqual(mockAgent);
      expect(
        mockPrismaService.agentDefinition.findUnique,
      ).toHaveBeenCalledWith({
        where: { type: 'email' },
      });
    });

    it('should return null when agent not found', async () => {
      mockPrismaService.agentDefinition.findUnique.mockResolvedValue(null);

      const result = await repository.findByType('nonexistent');

      expect(result).toBeNull();
    });
  });
});

