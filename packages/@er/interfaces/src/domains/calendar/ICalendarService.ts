import type { CalendarConnection, CalendarSyncRule } from '@er/types';

/**
 * Service interface for calendar connection operations.
 * Follows ISP - only connection management methods.
 */
export interface ICalendarConnectionService {
  /**
   * Find all connections for a user.
   */
  findByUser(userId: string): Promise<CalendarConnection[]>;

  /**
   * Initiate OAuth connection flow.
   */
  initiateConnection(userId: string, provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE'): Promise<OAuthUrl>;

  /**
   * Complete OAuth connection (handle callback).
   */
  completeConnection(userId: string, provider: string, code: string, state: string): Promise<CalendarConnection>;

  /**
   * Disconnect a calendar.
   * @throws {NotFoundError} If connection doesn't exist
   */
  disconnect(connectionId: string): Promise<void>;

  /**
   * Refresh access token for a connection.
   */
  refreshToken(connectionId: string): Promise<void>;
}

/**
 * Service interface for calendar sync operations.
 * Separated per ISP - syncing is distinct from connection management.
 */
export interface ICalendarSyncService {
  /**
   * Sync all calendars for a user.
   */
  syncUserCalendars(userId: string): Promise<SyncResult>;

  /**
   * Sync a specific calendar connection.
   */
  syncConnection(connectionId: string): Promise<SyncResult>;

  /**
   * Apply sync rules to reminders.
   */
  applyRules(userId: string): Promise<number>;

  /**
   * Detect holidays and adjust reminders.
   */
  detectHolidays(userId: string, dateRange: { start: Date; end: Date }): Promise<HolidayEvent[]>;
}

/**
 * Service interface for calendar sync rules.
 * Separated per ISP - rule management is distinct from syncing.
 */
export interface ICalendarSyncRuleService {
  /**
   * Find all rules for a user.
   */
  findByUser(userId: string): Promise<CalendarSyncRule[]>;

  /**
   * Create a sync rule.
   */
  create(userId: string, data: CreateSyncRuleDto): Promise<CalendarSyncRule>;

  /**
   * Update a sync rule.
   */
  update(ruleId: string, data: UpdateSyncRuleDto): Promise<CalendarSyncRule>;

  /**
   * Delete a sync rule.
   */
  delete(ruleId: string): Promise<void>;
}

export interface OAuthUrl {
  authUrl: string;
  state: string;
}

export interface SyncResult {
  eventsProcessed: number;
  rulesApplied: number;
  errors: string[];
}

export interface HolidayEvent {
  date: Date;
  name: string;
  affectedReminders: string[];
}

export interface CreateSyncRuleDto {
  connectionId: string;
  calendarId: string;
  labelKey: string;
  action: 'PAUSE_DURING' | 'SNOOZE_UNTIL_END' | 'SKIP_DAY';
  affectedReminderIds: string[];
}

export interface UpdateSyncRuleDto {
  labelKey?: string;
  action?: 'PAUSE_DURING' | 'SNOOZE_UNTIL_END' | 'SKIP_DAY';
  affectedReminderIds?: string[];
}

