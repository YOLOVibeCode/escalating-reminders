import type {
  User,
  CreateUserDto,
  LoginDto,
  TokenPair,
  AccessTokenPayload,
  RefreshTokenPayload,
} from '@er/types';

/**
 * Service interface for authentication operations.
 * Follows ISP - only authentication-specific methods.
 */
export interface IAuthService {
  /**
   * Register a new user.
   * @throws {ValidationError} If DTO is invalid
   * @throws {ConflictError} If email already exists
   */
  register(dto: CreateUserDto): Promise<{ user: User; tokens: TokenPair }>;

  /**
   * Authenticate a user.
   * @throws {UnauthorizedError} If credentials are invalid
   */
  login(dto: LoginDto): Promise<{ user: User; tokens: TokenPair }>;

  /**
   * Refresh access token.
   * @throws {UnauthorizedError} If refresh token is invalid
   */
  refreshToken(refreshToken: string): Promise<TokenPair>;

  /**
   * Invalidate refresh token.
   */
  logout(refreshToken: string): Promise<void>;
}

/**
 * Service interface for token operations.
 * Separated per ISP - token management is distinct from authentication.
 */
export interface ITokenService {
  /**
   * Generate access and refresh tokens.
   */
  generateTokenPair(userId: string, email: string): Promise<TokenPair>;

  /**
   * Verify and decode access token.
   * @throws {UnauthorizedError} If token is invalid or expired
   */
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;

  /**
   * Verify refresh token.
   * @throws {UnauthorizedError} If token is invalid or expired
   */
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;

  /**
   * Revoke refresh token.
   */
  revokeRefreshToken(token: string): Promise<void>;
}

/**
 * Service interface for password operations.
 * Separated per ISP - password hashing is distinct from authentication.
 */
export interface IPasswordService {
  /**
   * Hash a password.
   */
  hash(password: string): Promise<string>;

  /**
   * Verify password against hash.
   */
  verify(password: string, hash: string): Promise<boolean>;
}

