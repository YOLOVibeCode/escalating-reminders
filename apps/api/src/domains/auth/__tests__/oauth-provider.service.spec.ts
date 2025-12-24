import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OAuthProviderService } from '../oauth-provider.service';
import type {
  IOAuthProviderService,
  OAuthProvider,
  OAuthUserInfo,
} from '@er/interfaces';

describe('OAuthProviderService', () => {
  let service: OAuthProviderService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthProviderService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OAuthProviderService>(OAuthProviderService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();

    // Default config values
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        'GOOGLE_CLIENT_ID': 'test-google-client-id',
        'GOOGLE_CLIENT_SECRET': 'test-google-client-secret',
        'OAUTH_REDIRECT_BASE_URL': 'http://localhost:3000',
      };
      return config[key];
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate Google OAuth authorization URL', async () => {
      const redirectUri = 'http://localhost:3000/auth/oauth/callback';
      const result = await service.getAuthorizationUrl('GOOGLE', redirectUri);

      expect(result.url).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(result.url).toContain('test-google-client-id');
      expect(result.url).toContain(encodeURIComponent(redirectUri));
      expect(result.url).toContain('scope=openid+email+profile'); // URLSearchParams uses + for spaces
      expect(result.state).toBeTruthy();
      expect(result.state.length).toBeGreaterThan(10);
    });

    it('should include state parameter in URL', async () => {
      const redirectUri = 'http://localhost:3000/auth/oauth/callback';
      const result = await service.getAuthorizationUrl('GOOGLE', redirectUri);

      expect(result.url).toContain(`state=${result.state}`);
    });

    it('should throw error for unsupported provider', async () => {
      const redirectUri = 'http://localhost:3000/auth/oauth/callback';
      await expect(
        service.getAuthorizationUrl('GITHUB' as OAuthProvider, redirectUri),
      ).rejects.toThrow('Unsupported OAuth provider: GITHUB');
    });
  });

  describe('exchangeCodeForUserInfo', () => {
    it('should exchange Google OAuth code for user info', async () => {
      // Mock fetch for token exchange and user info
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'mock-access-token',
            token_type: 'Bearer',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'google-user-123',
            email: 'test@example.com',
            name: 'Test User',
            picture: 'https://example.com/avatar.jpg',
          }),
        });

      const redirectUri = 'http://localhost:3000/auth/oauth/callback';
      const result = await service.exchangeCodeForUserInfo(
        'GOOGLE',
        'mock-auth-code',
        redirectUri,
      );

      expect(result.providerId).toBe('google-user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.displayName).toBe('Test User');
      expect(result.picture).toBe('https://example.com/avatar.jpg');
    });

    it('should handle missing optional fields', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'mock-access-token',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'google-user-123',
            email: 'test@example.com',
          }),
        });

      const redirectUri = 'http://localhost:3000/auth/oauth/callback';
      const result = await service.exchangeCodeForUserInfo(
        'GOOGLE',
        'mock-auth-code',
        redirectUri,
      );

      expect(result.providerId).toBe('google-user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.displayName).toBeUndefined();
      expect(result.picture).toBeUndefined();
    });

    it('should throw error if token exchange fails', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code',
        }),
      });

      const redirectUri = 'http://localhost:3000/auth/oauth/callback';
      await expect(
        service.exchangeCodeForUserInfo('GOOGLE', 'invalid-code', redirectUri),
      ).rejects.toThrow('Failed to exchange OAuth code');
    });

    it('should throw error for unsupported provider', async () => {
      const redirectUri = 'http://localhost:3000/auth/oauth/callback';
      await expect(
        service.exchangeCodeForUserInfo(
          'GITHUB' as OAuthProvider,
          'code',
          redirectUri,
        ),
      ).rejects.toThrow('Unsupported OAuth provider: GITHUB');
    });
  });
});
