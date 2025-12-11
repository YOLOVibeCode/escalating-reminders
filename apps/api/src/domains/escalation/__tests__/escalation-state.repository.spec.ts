import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { EscalationStateRepository } from '../escalation-state.repository';
import type { EscalationState } from '@er/types';

describe('EscalationStateRepository', () => {
  let repository: EscalationStateRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    escalationState: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationStateRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<EscalationStateRepository>(
      EscalationStateRepository,
    );
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create escalation state successfully', async () => {
      const createData = {
        reminderId: 'reminder_123',
        profileId: 'profile_123',
        currentTier: 1,
        startedAt: new Date(),
        status: 'ACTIVE',
      };

      const mockState: EscalationState = {
        id: 'state_123',
        ...createData,
        lastEscalatedAt: null,
        acknowledgedAt: null,
        acknowledgedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.escalationState.create.mockResolvedValue(mockState);

      const result = await repository.create(createData);

      expect(result).toEqual(mockState);
      expect(mockPrismaService.escalationState.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe('findByReminderId', () => {
    it('should return state when exists', async () => {
      const mockState: EscalationState = {
        id: 'state_123',
        reminderId: 'reminder_123',
        profileId: 'profile_123',
        currentTier: 1,
        startedAt: new Date(),
        lastEscalatedAt: null,
        acknowledgedAt: null,
        acknowledgedBy: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.escalationState.findUnique.mockResolvedValue(mockState);

      const result = await repository.findByReminderId('reminder_123');

      expect(result).toEqual(mockState);
      expect(mockPrismaService.escalationState.findUnique).toHaveBeenCalledWith(
        {
          where: { reminderId: 'reminder_123' },
        },
      );
    });

    it('should return null when not found', async () => {
      mockPrismaService.escalationState.findUnique.mockResolvedValue(null);

      const result = await repository.findByReminderId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update state successfully', async () => {
      const updateData = {
        currentTier: 2,
        lastEscalatedAt: new Date(),
      };

      const mockUpdatedState: EscalationState = {
        id: 'state_123',
        reminderId: 'reminder_123',
        profileId: 'profile_123',
        currentTier: 2,
        startedAt: new Date(),
        lastEscalatedAt: new Date(),
        acknowledgedAt: null,
        acknowledgedBy: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.escalationState.update.mockResolvedValue(
        mockUpdatedState,
      );

      const result = await repository.update('state_123', updateData);

      expect(result).toEqual(mockUpdatedState);
      expect(mockPrismaService.escalationState.update).toHaveBeenCalledWith({
        where: { id: 'state_123' },
        data: updateData,
      });
    });
  });

  describe('findDueForAdvancement', () => {
    it('should return states due for advancement', async () => {
      const now = new Date();
      const mockStates: EscalationState[] = [
        {
          id: 'state_1',
          reminderId: 'reminder_1',
          profileId: 'profile_123',
          currentTier: 1,
          startedAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
          lastEscalatedAt: null,
          acknowledgedAt: null,
          acknowledgedBy: null,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.escalationState.findMany.mockResolvedValue(mockStates);

      const result = await repository.findDueForAdvancement(10);

      expect(result).toEqual(mockStates);
      expect(mockPrismaService.escalationState.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
        },
        take: 10,
        orderBy: { lastEscalatedAt: 'asc' },
      });
    });

    it('should respect limit parameter', async () => {
      mockPrismaService.escalationState.findMany.mockResolvedValue([]);

      await repository.findDueForAdvancement(5);

      expect(mockPrismaService.escalationState.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
        },
        take: 5,
        orderBy: { lastEscalatedAt: 'asc' },
      });
    });
  });
});

