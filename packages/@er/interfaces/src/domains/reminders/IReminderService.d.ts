import type { Reminder, CreateReminderDto, UpdateReminderDto, PaginatedResult, ReminderFilters } from '@er/types';
export interface IReminderService {
    create(userId: string, dto: CreateReminderDto): Promise<Reminder>;
    findById(userId: string, reminderId: string): Promise<Reminder>;
    findAll(userId: string, filters: ReminderFilters): Promise<PaginatedResult<Reminder>>;
    update(userId: string, reminderId: string, dto: UpdateReminderDto): Promise<Reminder>;
    delete(userId: string, reminderId: string): Promise<void>;
}
export interface IReminderSnoozeService {
    snooze(userId: string, reminderId: string, duration: string): Promise<ReminderSnooze>;
    cancelSnooze(userId: string, reminderId: string): Promise<void>;
}
export interface IReminderCompletionService {
    complete(userId: string, reminderId: string, source: CompletionSource): Promise<void>;
    acknowledge(userId: string, reminderId: string): Promise<void>;
}
import type { ReminderSnooze, CompletionSource } from '@er/types';
//# sourceMappingURL=IReminderService.d.ts.map