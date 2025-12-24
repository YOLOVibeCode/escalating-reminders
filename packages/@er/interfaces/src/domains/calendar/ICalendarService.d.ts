import type { CalendarConnection, CalendarSyncRule } from '@er/types';
export interface ICalendarConnectionService {
    findByUser(userId: string): Promise<CalendarConnection[]>;
    initiateConnection(userId: string, provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE'): Promise<OAuthUrl>;
    completeConnection(userId: string, provider: string, code: string, state: string): Promise<CalendarConnection>;
    disconnect(connectionId: string): Promise<void>;
    refreshToken(connectionId: string): Promise<void>;
}
export interface ICalendarSyncService {
    syncUserCalendars(userId: string): Promise<SyncResult>;
    syncConnection(connectionId: string): Promise<SyncResult>;
    applyRules(userId: string): Promise<number>;
    detectHolidays(userId: string, dateRange: {
        start: Date;
        end: Date;
    }): Promise<HolidayEvent[]>;
}
export interface ICalendarSyncRuleService {
    findByUser(userId: string): Promise<CalendarSyncRule[]>;
    create(userId: string, data: CreateSyncRuleDto): Promise<CalendarSyncRule>;
    update(ruleId: string, data: UpdateSyncRuleDto): Promise<CalendarSyncRule>;
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
//# sourceMappingURL=ICalendarService.d.ts.map