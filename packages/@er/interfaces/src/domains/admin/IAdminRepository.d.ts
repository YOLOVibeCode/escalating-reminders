import type { AdminUser, AdminAction, SupportNote, SystemHealthSnapshot, AdminRole, AdminUserCreateInput, AdminUserUpdateInput, AdminActionCreateInput, SupportNoteCreateInput, SupportNoteUpdateInput, SystemHealthSnapshotCreateInput, PaginatedResult } from '@er/types';
export interface IAdminRepository {
    findAdminByUserId(userId: string): Promise<AdminUser | null>;
    findAdminById(id: string): Promise<AdminUser | null>;
    createAdmin(data: AdminUserCreateInput): Promise<AdminUser>;
    updateAdmin(id: string, data: AdminUserUpdateInput): Promise<AdminUser>;
    deleteAdmin(id: string): Promise<void>;
    listAdmins(filters?: AdminFilters): Promise<AdminUser[]>;
    createAdminAction(action: AdminActionCreateInput): Promise<AdminAction>;
    getAdminActions(filters: AdminActionFilters): Promise<PaginatedResult<AdminAction>>;
    createSupportNote(note: SupportNoteCreateInput): Promise<SupportNote>;
    getSupportNotes(userId: string): Promise<SupportNote[]>;
    updateSupportNote(id: string, data: SupportNoteUpdateInput): Promise<SupportNote>;
    deleteSupportNote(id: string): Promise<void>;
    createHealthSnapshot(snapshot: SystemHealthSnapshotCreateInput): Promise<SystemHealthSnapshot>;
    getHealthSnapshots(filters: HealthSnapshotFilters): Promise<PaginatedResult<SystemHealthSnapshot>>;
    getLatestHealthSnapshot(): Promise<SystemHealthSnapshot | null>;
}
export interface AdminFilters {
    role?: AdminRole;
    search?: string;
}
export interface AdminActionFilters {
    adminUserId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
}
export interface HealthSnapshotFilters {
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
}
//# sourceMappingURL=IAdminRepository.d.ts.map