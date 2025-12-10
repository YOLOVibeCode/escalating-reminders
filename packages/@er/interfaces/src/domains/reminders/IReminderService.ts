import type {
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
  PaginatedResult,
  ReminderFilters,
} from '@er/types';

/**
 * Service interface for reminder CRUD operations.
 * Follows ISP - only reminder-specific CRUD methods.
 */
export interface IReminderService {
  /**
   * Create a new reminder.
   * @throws {ValidationError} If DTO is invalid
   * @throws {QuotaExceededError} If user exceeds reminder limit
   */
  create(userId: string, dto: CreateReminderDto): Promise<Reminder>;

  /**
   * Find a reminder by ID.
   * @throws {NotFoundError} If reminder doesn't exist
   * @throws {ForbiddenError} If user doesn't own reminder
   */
  findById(userId: string, reminderId: string): Promise<Reminder>;

  /**
   * Find all reminders for a user with pagination.
   */
  findAll(userId: string, filters: ReminderFilters): Promise<PaginatedResult<Reminder>>;

  /**
   * Update a reminder.
   * @throws {NotFoundError} If reminder doesn't exist
   * @throws {ForbiddenError} If user doesn't own reminder
   */
  update(userId: string, reminderId: string, dto: UpdateReminderDto): Promise<Reminder>;

  /**
   * Delete a reminder.
   * @throws {NotFoundError} If reminder doesn't exist
   * @throws {ForbiddenError} If user doesn't own reminder
   */
  delete(userId: string, reminderId: string): Promise<void>;
}

/**
 * Service interface for reminder snooze operations.
 * Separated per ISP - not all consumers need snooze functionality.
 */
export interface IReminderSnoozeService {
  /**
   * Snooze a reminder.
   * @param duration - Natural language duration (e.g., "until next Friday")
   * @throws {NotFoundError} If reminder doesn't exist
   * @throws {ForbiddenError} If user doesn't own reminder
   * @throws {ValidationError} If duration cannot be parsed
   */
  snooze(userId: string, reminderId: string, duration: string): Promise<ReminderSnooze>;

  /**
   * Cancel an active snooze.
   * @throws {NotFoundError} If reminder doesn't exist or isn't snoozed
   */
  cancelSnooze(userId: string, reminderId: string): Promise<void>;
}

/**
 * Service interface for reminder completion operations.
 * Separated per ISP - completion logic is distinct from CRUD.
 */
export interface IReminderCompletionService {
  /**
   * Mark reminder as complete.
   * @throws {NotFoundError} If reminder doesn't exist
   * @throws {ForbiddenError} If user doesn't own reminder
   */
  complete(userId: string, reminderId: string, source: CompletionSource): Promise<void>;

  /**
   * Acknowledge reminder (stop escalation without completing).
   * @throws {NotFoundError} If reminder doesn't exist
   */
  acknowledge(userId: string, reminderId: string): Promise<void>;
}

import type { ReminderSnooze, CompletionSource } from '@er/types';

