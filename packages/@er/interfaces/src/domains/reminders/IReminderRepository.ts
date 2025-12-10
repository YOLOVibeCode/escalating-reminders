import type {
  Reminder,
  ReminderFilters,
  PaginatedResult,
  CreateReminderDto,
  UpdateReminderDto,
} from '@er/types';

/**
 * Repository interface for reminder data access.
 * Follows ISP - only data access methods, no business logic.
 */
export interface IReminderRepository {
  create(data: ReminderCreateData): Promise<Reminder>;
  findById(id: string): Promise<Reminder | null>;
  findByUserId(userId: string, filters: ReminderFilters): Promise<PaginatedResult<Reminder>>;
  update(id: string, data: ReminderUpdateData): Promise<Reminder>;
  delete(id: string): Promise<void>;
  countByUser(userId: string): Promise<number>;
  findDueForTrigger(limit: number): Promise<Reminder[]>;
}

export interface ReminderCreateData {
  userId: string;
  title: string;
  description?: string;
  importance: string;
  status: string;
  escalationProfileId: string;
  nextTriggerAt?: Date;
}

export interface ReminderUpdateData {
  title?: string;
  description?: string;
  importance?: string;
  escalationProfileId?: string;
  status?: string;
  nextTriggerAt?: Date;
  lastTriggeredAt?: Date;
  completedAt?: Date;
}

