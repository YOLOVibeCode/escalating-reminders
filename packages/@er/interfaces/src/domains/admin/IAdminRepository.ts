import type {
  AdminUser,
  AdminAction,
  SupportNote,
  SystemHealthSnapshot,
  AdminRole,
  AdminUserCreateInput,
  AdminUserUpdateInput,
  AdminActionCreateInput,
  SupportNoteCreateInput,
  SupportNoteUpdateInput,
  SystemHealthSnapshotCreateInput,
  PaginatedResult,
} from '@er/types';

/**
 * Repository interface for admin data access.
 * Follows ISP - only data access methods, no business logic.
 */
export interface IAdminRepository {
  // Admin User Operations
  /**
   * Find admin user by user ID.
   */
  findAdminByUserId(userId: string): Promise<AdminUser | null>;

  /**
   * Find admin user by admin ID.
   */
  findAdminById(id: string): Promise<AdminUser | null>;

  /**
   * Create a new admin user.
   */
  createAdmin(data: AdminUserCreateInput): Promise<AdminUser>;

  /**
   * Update admin user.
   */
  updateAdmin(id: string, data: AdminUserUpdateInput): Promise<AdminUser>;

  /**
   * Delete admin user.
   */
  deleteAdmin(id: string): Promise<void>;

  /**
   * List all admin users with optional filters.
   */
  listAdmins(filters?: AdminFilters): Promise<AdminUser[]>;

  // Admin Action Operations
  /**
   * Create an admin action log entry.
   */
  createAdminAction(action: AdminActionCreateInput): Promise<AdminAction>;

  /**
   * Get admin actions with filters.
   */
  getAdminActions(filters: AdminActionFilters): Promise<PaginatedResult<AdminAction>>;

  // Support Note Operations
  /**
   * Create a support note.
   */
  createSupportNote(note: SupportNoteCreateInput): Promise<SupportNote>;

  /**
   * Get all support notes for a user.
   */
  getSupportNotes(userId: string): Promise<SupportNote[]>;

  /**
   * Update a support note.
   */
  updateSupportNote(id: string, data: SupportNoteUpdateInput): Promise<SupportNote>;

  /**
   * Delete a support note.
   */
  deleteSupportNote(id: string): Promise<void>;

  // System Health Operations
  /**
   * Create a system health snapshot.
   */
  createHealthSnapshot(snapshot: SystemHealthSnapshotCreateInput): Promise<SystemHealthSnapshot>;

  /**
   * Get health snapshots with filters.
   */
  getHealthSnapshots(filters: HealthSnapshotFilters): Promise<PaginatedResult<SystemHealthSnapshot>>;

  /**
   * Get the latest health snapshot.
   */
  getLatestHealthSnapshot(): Promise<SystemHealthSnapshot | null>;
}

/**
 * Filters for listing admin users.
 */
export interface AdminFilters {
  role?: AdminRole;
  search?: string;
}

/**
 * Filters for querying admin actions.
 */
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

/**
 * Filters for querying health snapshots.
 */
export interface HealthSnapshotFilters {
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}
