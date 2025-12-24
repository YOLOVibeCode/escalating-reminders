import type { EmailWatcher, WatcherEvent } from '@er/types';

/**
 * Service interface for email watcher operations.
 * Follows ISP - only watcher management methods.
 */
export interface IEmailWatcherService {
  /**
   * Find all watchers for a user.
   */
  findByUser(userId: string): Promise<EmailWatcher[]>;

  /**
   * Find watchers for a specific reminder.
   */
  findByReminder(reminderId: string): Promise<EmailWatcher[]>;

  /**
   * Create an email watcher.
   * @throws {ValidationError} If configuration is invalid
   * @throws {QuotaExceededError} If user exceeds watcher limit
   */
  create(userId: string, reminderId: string, data: CreateEmailWatcherDto): Promise<EmailWatcher>;

  /**
   * Update an email watcher.
   * @throws {NotFoundError} If watcher doesn't exist
   */
  update(watcherId: string, data: UpdateEmailWatcherDto): Promise<EmailWatcher>;

  /**
   * Delete an email watcher.
   * @throws {NotFoundError} If watcher doesn't exist
   */
  delete(watcherId: string): Promise<void>;

  /**
   * Test watcher rules against recent emails.
   * @throws {NotFoundError} If watcher doesn't exist
   */
  test(watcherId: string): Promise<WatcherTestResult>;
}

/**
 * Service interface for watcher polling operations.
 * Separated per ISP - polling is distinct from management.
 */
export interface IWatcherPollingService {
  /**
   * Poll all enabled watchers for matches.
   */
  pollAll(limit?: number): Promise<WatcherEvent[]>;

  /**
   * Poll a specific watcher.
   */
  poll(watcherId: string): Promise<WatcherEvent[]>;

  /**
   * Process a watcher match event.
   */
  processMatch(event: WatcherEvent): Promise<void>;
}

export interface CreateEmailWatcherDto {
  reminderId: string;
  provider: 'GMAIL' | 'OUTLOOK' | 'IMAP';
  credentials: Record<string, unknown>;
  rules: WatcherRule[];
}

export interface UpdateEmailWatcherDto {
  isEnabled?: boolean;
  credentials?: Record<string, unknown>;
  rules?: WatcherRule[];
}

export interface WatcherRule {
  type: 'contains' | 'exact' | 'regex';
  pattern: string;
  matchTarget: 'subject' | 'from' | 'body';
}

export interface WatcherTestResult {
  success: boolean;
  matches: number;
  sampleMatches?: Array<{
    emailSubject: string;
    emailFrom: string;
    matchedRule: string;
  }>;
  error?: string;
}

