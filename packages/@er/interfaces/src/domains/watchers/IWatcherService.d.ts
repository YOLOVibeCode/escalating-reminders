import type { EmailWatcher, WatcherEvent } from '@er/types';
export interface IEmailWatcherService {
    findByUser(userId: string): Promise<EmailWatcher[]>;
    findByReminder(reminderId: string): Promise<EmailWatcher[]>;
    create(userId: string, reminderId: string, data: CreateEmailWatcherDto): Promise<EmailWatcher>;
    update(watcherId: string, data: UpdateEmailWatcherDto): Promise<EmailWatcher>;
    delete(watcherId: string): Promise<void>;
    test(watcherId: string): Promise<WatcherTestResult>;
}
export interface IWatcherPollingService {
    pollAll(limit?: number): Promise<WatcherEvent[]>;
    poll(watcherId: string): Promise<WatcherEvent[]>;
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
//# sourceMappingURL=IWatcherService.d.ts.map