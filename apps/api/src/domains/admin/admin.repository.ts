import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { IAdminRepository } from '@er/interfaces';
import type {
  AdminUser,
  AdminAction,
  SupportNote,
  SystemHealthSnapshot,
  AdminUserCreateInput,
  AdminUserUpdateInput,
  AdminActionCreateInput,
  SupportNoteCreateInput,
  SupportNoteUpdateInput,
  SystemHealthSnapshotCreateInput,
  PaginatedResult,
} from '@er/types';
import type {
  AdminFilters,
  AdminActionFilters,
  HealthSnapshotFilters,
} from '@er/interfaces';

/**
 * Admin repository.
 * Handles database operations for admin domain.
 * Implements IAdminRepository interface.
 */
@Injectable()
export class AdminRepository implements IAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAdminByUserId(userId: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async findAdminById(id: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async createAdmin(data: AdminUserCreateInput): Promise<AdminUser> {
    return this.prisma.adminUser.create({
      data,
      include: { user: true },
    });
  }

  async updateAdmin(id: string, data: AdminUserUpdateInput): Promise<AdminUser> {
    return this.prisma.adminUser.update({
      where: { id },
      data,
      include: { user: true },
    });
  }

  async deleteAdmin(id: string): Promise<void> {
    await this.prisma.adminUser.delete({
      where: { id },
    });
  }

  async listAdmins(filters?: AdminFilters): Promise<AdminUser[]> {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.search) {
      where.user = {
        email: {
          contains: filters.search,
          mode: 'insensitive',
        },
      };
    }

    return this.prisma.adminUser.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdminAction(action: AdminActionCreateInput): Promise<AdminAction> {
    return this.prisma.adminAction.create({
      data: action,
    });
  }

  async getAdminActions(filters: AdminActionFilters): Promise<PaginatedResult<AdminAction>> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (filters.adminUserId) {
      where.adminUserId = filters.adminUserId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.targetType) {
      where.targetType = filters.targetType;
    }

    if (filters.targetId) {
      where.targetId = filters.targetId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.adminAction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          adminUser: {
            include: { user: true },
          },
        },
      }),
      this.prisma.adminAction.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  async createSupportNote(note: SupportNoteCreateInput): Promise<SupportNote> {
    return this.prisma.supportNote.create({
      data: note,
    });
  }

  async getSupportNotes(userId: string): Promise<SupportNote[]> {
    return this.prisma.supportNote.findMany({
      where: { userId },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        adminUser: {
          include: { user: true },
        },
      },
    });
  }

  async updateSupportNote(id: string, data: SupportNoteUpdateInput): Promise<SupportNote> {
    return this.prisma.supportNote.update({
      where: { id },
      data,
    });
  }

  async deleteSupportNote(id: string): Promise<void> {
    await this.prisma.supportNote.delete({
      where: { id },
    });
  }

  async createHealthSnapshot(
    snapshot: SystemHealthSnapshotCreateInput,
  ): Promise<SystemHealthSnapshot> {
    return this.prisma.systemHealthSnapshot.create({
      data: snapshot,
    });
  }

  async getHealthSnapshots(
    filters: HealthSnapshotFilters,
  ): Promise<PaginatedResult<SystemHealthSnapshot>> {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 100;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.systemHealthSnapshot.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.systemHealthSnapshot.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  async getLatestHealthSnapshot(): Promise<SystemHealthSnapshot | null> {
    return this.prisma.systemHealthSnapshot.findFirst({
      orderBy: { timestamp: 'desc' },
    });
  }
}
