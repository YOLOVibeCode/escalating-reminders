import type { User, TokenPair } from '@er/types';
export type OAuthProvider = 'GOOGLE' | 'GITHUB' | 'MICROSOFT';
export interface OAuthUserInfo {
    providerId: string;
    email: string;
    displayName?: string;
    picture?: string;
}
export interface OAuthAuthorizationUrl {
    url: string;
    state: string;
}
export interface IOAuthProviderService {
    getAuthorizationUrl(provider: OAuthProvider, redirectUri: string): Promise<OAuthAuthorizationUrl>;
    exchangeCodeForUserInfo(provider: OAuthProvider, code: string, redirectUri: string): Promise<OAuthUserInfo>;
}
export interface IOAuthAuthService {
    authenticateWithOAuth(provider: OAuthProvider, userInfo: OAuthUserInfo): Promise<{
        user: User;
        tokens: TokenPair;
        isNewUser: boolean;
    }>;
}
//# sourceMappingURL=IOAuthProviderService.d.ts.map