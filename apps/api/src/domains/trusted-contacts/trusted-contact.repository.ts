import type { TrustedContact } from '@er/types';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class TrustedContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<TrustedContact[]> {
    return this.prisma.trustedContact.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string): Promise<TrustedContact | null> {
    return this.prisma.trustedContact.findUnique({ where: { id } });
  }

  async create(data: {
    userId: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    relationship: string;
    notificationPreferences: { email: boolean; sms: boolean };
  }): Promise<TrustedContact> {
    const createData: Record<string, unknown> = {
      userId: data.userId,
      name: data.name,
      relationship: data.relationship,
      notificationPreferences: data.notificationPreferences as object,
    };
    if (data.email !== undefined) createData.email = data.email;
    if (data.phone !== undefined) createData.phone = data.phone;

    return this.prisma.trustedContact.create({
      data: createData as Parameters<typeof this.prisma.trustedContact.create>[0]['data'],
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      email: string | null;
      phone: string | null;
      relationship: string;
      notificationPreferences: { email: boolean; sms: boolean };
    }>,
  ): Promise<TrustedContact> {
    const prismaData: Record<string, unknown> = { ...data };
    if (data.notificationPreferences !== undefined) {
      prismaData.notificationPreferences = data.notificationPreferences as object;
    }
    return this.prisma.trustedContact.update({
      where: { id },
      data: prismaData as Parameters<typeof this.prisma.trustedContact.update>[0]['data'],
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.trustedContact.delete({ where: { id } });
  }
}
