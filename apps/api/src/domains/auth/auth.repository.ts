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

  // Session management can be implemented via cache or separate table
  // For now, we'll rely on JWT token expiration
}

