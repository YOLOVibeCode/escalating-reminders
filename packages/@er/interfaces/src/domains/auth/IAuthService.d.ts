import type { User, CreateUserDto, LoginDto, TokenPair, AccessTokenPayload, RefreshTokenPayload } from '@er/types';
export interface IAuthService {
    register(dto: CreateUserDto): Promise<{
        user: User;
        tokens: TokenPair;
    }>;
    login(dto: LoginDto): Promise<{
        user: User;
        tokens: TokenPair;
    }>;
    refreshToken(refreshToken: string): Promise<TokenPair>;
    logout(refreshToken: string): Promise<void>;
}
export interface ITokenService {
    generateTokenPair(userId: string, email: string): Promise<TokenPair>;
    verifyAccessToken(token: string): Promise<AccessTokenPayload>;
    verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
    revokeRefreshToken(token: string): Promise<void>;
}
export interface IPasswordService {
    hash(password: string): Promise<string>;
    verify(password: string, hash: string): Promise<boolean>;
}
//# sourceMappingURL=IAuthService.d.ts.map