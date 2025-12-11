import { Test, TestingModule } from '@nestjs/testing';
import { SeedingService } from '../seeding.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import * as bcrypt from 'bcrypt';

describe('SeedingService', () => {
  let service: SeedingService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    escalationProfile: {
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    reminder: {
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    agentDefinition: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    userAgentSubscription: {
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    adminUser: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SeedingService>(SeedingService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('seedUsers', () => {
    it('should create test user if not exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // User doesn't exist
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // Admin doesn't exist

      const hashedPassword = await bcrypt.hash('TestUser123!', 10);
      const mockUser = {
        id: 'user-123',
        email: 'testuser@example.com',
        profile: { displayName: 'Test User' },
        subscription: { tier: 'PERSONAL' },
      };

      mockPrismaService.user.create.mockResolvedValueOnce(mockUser);
      mockPrismaService.user.create.mockResolvedValueOnce({
        id: 'admin-123',
        email: 'admin@example.com',
        adminUser: { role: 'SUPER_ADMIN' },
      });

      const result = await service.seedUsers();

      expect(result.user).toBeDefined();
      expect(result.admin).toBeDefined();
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(2);
    });

    it('should return existing users if they exist', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'testuser@example.com',
        profile: { displayName: 'Test User' },
        subscription: { tier: 'PERSONAL' },
      };

      const existingAdmin = {
        id: 'admin-123',
        email: 'admin@example.com',
        profile: { displayName: 'Admin' },
        subscription: { tier: 'PRO' },
        adminUser: { role: 'SUPER_ADMIN' },
      };

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(existingAdmin);

      const result = await service.seedUsers();

      expect(result.user).toEqual(existingUser);
      expect(result.admin).toEqual(existingAdmin);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('seedEscalationProfiles', () => {
    it('should create escalation profiles', async () => {
      const userId = 'user-123';
      mockPrismaService.escalationProfile.findFirst.mockResolvedValue(null);
      mockPrismaService.escalationProfile.create.mockResolvedValue({
        id: 'profile-1',
        name: 'Gentle',
      });

      const result = await service.seedEscalationProfiles(userId);

      expect(result.length).toBeGreaterThan(0);
      expect(mockPrismaService.escalationProfile.create).toHaveBeenCalled();
    });
  });

  describe('clearTestData', () => {
    it('should delete all test data', async () => {
      const testUsers = [
        { id: 'user-123' },
        { id: 'admin-123' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(testUsers);
      mockPrismaService.userAgentSubscription.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaService.reminder.deleteMany.mockResolvedValue({ count: 3 });
      mockPrismaService.escalationProfile.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaService.adminUser.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.user.deleteMany.mockResolvedValue({ count: 2 });

      await service.clearTestData();

      expect(mockPrismaService.userAgentSubscription.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.reminder.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.escalationProfile.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.adminUser.deleteMany).toHaveBeenCalled();
      expect(mockPrismaService.user.deleteMany).toHaveBeenCalled();
    });

    it('should handle empty database gracefully', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await expect(service.clearTestData()).resolves.not.toThrow();
    });
  });
});
