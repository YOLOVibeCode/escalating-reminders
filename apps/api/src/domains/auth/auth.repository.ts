import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { User, UserCreateInput, UserUpdateInput } from '@er/types';

/**
 * Auth repository.
 * Handles database operations for authentication.
 * Implements ISP - only auth-related database operations.
 */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByIdWithSubscription(id: string): Promise<(User & { subscription: { tier: string } | null }) | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        subscription: {
          select: { tier: true },
        },
      },
    }) as Promise<(User & { subscription: { tier: string } | null }) | null>;
  }

  async findByIdWithProfile(id: string): Promise<(User & { profile: any; subscription: any }) | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        subscription: {
          select: {
            tier: true,
            status: true,
          },
        },
      },
    }) as Promise<(User & { profile: any; subscription: any }) | null>;
  }

  async create(data: UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Update or create user profile.
   */
  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      timezone?: string;
      preferences?: Record<string, unknown>;
    },
  ): Promise<{ displayName: string; timezone: string; preferences: Record<string, unknown> }> {
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    const updateData: any = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.preferences !== undefined) updateData.preferences = data.preferences;

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        displayName: data.displayName || '',
        timezone: data.timezone || 'America/New_York',
        preferences: (data.preferences || {}) as any,
      },
    });

    return {
      displayName: profile.displayName,
      timezone: profile.timezone,
      preferences: profile.preferences as Record<string, unknown>,
    };
  }

  /**
   * Find user by OAuth provider and provider ID.
   */
  async findByOAuthProvider(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        oauthProvider_oauthProviderId: {
          oauthProvider: provider as any,
          oauthProviderId: providerId,
        },
      },
    });
  }

  /**
   * Update OAuth link on existing user.
   */
  async updateOAuthLink(
    userId: string,
    data: {
      oauthProvider: string;
      oauthProviderId: string;
      emailVerified: boolean;
    },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        oauthProvider: data.oauthProvider as any,
        oauthProviderId: data.oauthProviderId,
        emailVerified: data.emailVerified,
      },
    });
  }

  // Session management can be implemented via cache or separate table
  // For now, we'll rely on JWT token expiration
}

