import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Patch,
  Query,
  Param,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { OAuthProviderService } from './oauth-provider.service';
import { OAuthAuthService } from './oauth-auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateUserDto, LoginDto, TokenPair, User } from '@er/types';
import type { OAuthProvider } from '@er/interfaces';

/**
 * Auth controller.
 * Handles HTTP requests for authentication endpoints.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthProviderService: OAuthProviderService,
    private readonly oauthAuthService: OAuthAuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: CreateUserDto): Promise<{ success: true; data: { user: User; tokens: TokenPair } }> {
    const result = await this.authService.register(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<{ success: true; data: { user: User; tokens: TokenPair } }> {
    const result = await this.authService.login(dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body('refreshToken') refreshToken: string): Promise<{ success: true; data: TokenPair }> {
    const result = await this.authService.refreshToken(refreshToken);
    return {
      success: true,
      data: result,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body('refreshToken') refreshToken: string): Promise<{ success: true }> {
    await this.authService.logout(refreshToken);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'User information retrieved' })
  async getMe(@Request() req: any): Promise<{ success: true; data: any }> {
    const user = await this.authService.getUserWithProfile(req.user.sub);
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        profile: user.profile,
        subscription: user.subscription,
      },
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(
    @Request() req: { user: { sub: string } },
    @Body() data: { displayName?: string; timezone?: string; preferences?: Record<string, unknown> },
  ): Promise<{ success: true; data: { displayName: string; timezone: string; preferences: Record<string, unknown> } }> {
    const result = await this.authService.updateProfile(req.user.sub, data);
    return {
      success: true,
      data: result,
    };
  }

  @Get('oauth/:provider/authorize')
  @ApiOperation({ summary: 'Get OAuth authorization URL' })
  @ApiResponse({ status: 200, description: 'Authorization URL generated' })
  @ApiResponse({ status: 400, description: 'Invalid provider' })
  async getOAuthAuthorizationUrl(
    @Param('provider') provider: string,
    @Query('redirectUri') redirectUri: string,
  ): Promise<{ success: true; data: { url: string; state: string } }> {
    if (!redirectUri) {
      throw new Error('redirectUri query parameter is required');
    }

    const result = await this.oauthProviderService.getAuthorizationUrl(
      provider.toUpperCase() as OAuthProvider,
      redirectUri,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Get('oauth/:provider/callback')
  @ApiOperation({ summary: 'Handle OAuth callback' })
  @ApiResponse({ status: 200, description: 'OAuth authentication successful' })
  @ApiResponse({ status: 401, description: 'OAuth authentication failed' })
  async handleOAuthCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('redirectUri') redirectUri: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!code) {
      res.redirect(`${redirectUri}?error=missing_code`);
      return;
    }

    try {
      // Exchange code for user info
      const userInfo = await this.oauthProviderService.exchangeCodeForUserInfo(
        provider.toUpperCase() as OAuthProvider,
        code,
        redirectUri,
      );

      // Authenticate or register user
      const result = await this.oauthAuthService.authenticateWithOAuth(
        provider.toUpperCase() as OAuthProvider,
        userInfo,
      );

      // Redirect to frontend with tokens
      const params = new URLSearchParams({
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        isNewUser: result.isNewUser.toString(),
      });

      res.redirect(`${redirectUri}?${params.toString()}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'OAuth authentication failed';
      res.redirect(`${redirectUri}?error=${encodeURIComponent(errorMessage)}`);
    }
  }
}

