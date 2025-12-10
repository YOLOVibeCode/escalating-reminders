import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { AuthRepository } from '../auth.repository';

describe('AuthRepository', () => {
  let repository: AuthRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<AuthRepository>(AuthRepository);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        passwordHash: '$2b$10$hashed',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findById('user_123');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_123' },
      });
    });
  });

  describe('findByIdWithSubscription', () => {
    it('should find user with subscription', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        subscription: { tier: 'FREE' },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByIdWithSubscription('user_123');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        include: {
          subscription: {
            select: { tier: true },
          },
        },
      });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createData = {
        email: 'test@example.com',
        passwordHash: '$2b$10$hashed',
        profile: {
          create: {
            displayName: 'Test User',
            timezone: 'America/New_York',
          },
        },
        subscription: {
          create: {
            tier: 'FREE',
            status: 'ACTIVE',
          },
        },
      };

      const mockUser = {
        id: 'user_123',
        ...createData,
      };

      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await repository.create(createData);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });
});

