import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuthAuthService } from '../oauth-auth.service';
import { AuthRepository } from '../auth.repository';
import { OAuthProviderService } from '../oauth-provider.service';
import type {
  IOAuthProviderService,
  OAuthProvider,
  OAuthUserInfo,
} from '@er/interfaces';
import type { User, TokenPair } from '@er/types';

describe('OAuthAuthService', () => {
  let service: OAuthAuthService;
  let authRepository: AuthRepository;
  let oauthProviderService: IOAuthProviderService;
  let jwtService: JwtService;

  const mockAuthRepository = {
    findByEmail: jest.fn(),
    findByOAuthProvider: jest.fn(),
    create: jest.fn(),
    updateOAuthLink: jest.fn(),
  };

  const mockOAuthProviderService = {
    getAuthorizationUrl: jest.fn(),
    exchangeCodeForUserInfo: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthAuthService,
        {
          provide: AuthRepository,
          useValue: mockAuthRepository,
        },
        {
          provide: OAuthProviderService,
          useValue: mockOAuthProviderService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OAuthAuthService>(OAuthAuthService);
    authRepository = module.get<AuthRepository>(AuthRepository);
    oauthProviderService = module.get<IOAuthProviderService>(OAuthProviderService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        'JWT_SECRET': 'test-secret',
        'JWT_EXPIRES_IN': '15m',
        'JWT_REFRESH_EXPIRES_IN': '7d',
      };
      return config[key];
    });

    mockJwtService.sign.mockImplementation((payload: any) => {
      return `mock-token-${payload.sub}`;
    });
  });

  describe('authenticateWithOAuth', () => {
    const mockOAuthUserInfo: OAuthUserInfo = {
      providerId: 'google-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      picture: 'https://example.com/avatar.jpg',
    };

    it('should create new user if OAuth user does not exist', async () => {
      mockAuthRepository.findByOAuthProvider.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(null);
      mockAuthRepository.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        oauthProvider: 'GOOGLE',
        oauthProviderId: 'google-user-123',
        passwordHash: null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User);

      const result = await service.authenticateWithOAuth(
        'GOOGLE',
        mockOAuthUserInfo,
      );

      expect(result.isNewUser).toBe(true);
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.oauthProvider).toBe('GOOGLE');
      expect(result.user.oauthProviderId).toBe('google-user-123');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
      expect(mockAuthRepository.create).toHaveBeenCalled();
    });

    it('should login existing user if OAuth account exists', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'test@example.com',
        oauthProvider: 'GOOGLE',
        oauthProviderId: 'google-user-123',
        passwordHash: null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      mockAuthRepository.findByOAuthProvider.mockResolvedValue(existingUser);

      const result = await service.authenticateWithOAuth(
        'GOOGLE',
        mockOAuthUserInfo,
      );

      expect(result.isNewUser).toBe(false);
      expect(result.user.id).toBe('user-123');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
      expect(mockAuthRepository.create).not.toHaveBeenCalled();
    });

    it('should link OAuth to existing email account', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        oauthProvider: null,
        oauthProviderId: null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      mockAuthRepository.findByOAuthProvider.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(existingUser);
      mockAuthRepository.updateOAuthLink.mockResolvedValue({
        ...existingUser,
        oauthProvider: 'GOOGLE',
        oauthProviderId: 'google-user-123',
        emailVerified: true,
      } as User);

      const result = await service.authenticateWithOAuth(
        'GOOGLE',
        mockOAuthUserInfo,
      );

      expect(result.isNewUser).toBe(false);
      expect(result.user.oauthProvider).toBe('GOOGLE');
      expect(result.user.oauthProviderId).toBe('google-user-123');
    });

    it('should throw error if email exists but OAuth provider mismatch', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'test@example.com',
        oauthProvider: 'MICROSOFT',
        oauthProviderId: 'ms-user-456',
        passwordHash: null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      mockAuthRepository.findByOAuthProvider.mockResolvedValue(null);
      mockAuthRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(
        service.authenticateWithOAuth('GOOGLE', mockOAuthUserInfo),
      ).rejects.toThrow(
        'Email already registered with different OAuth provider',
      );
    });
  });
});
