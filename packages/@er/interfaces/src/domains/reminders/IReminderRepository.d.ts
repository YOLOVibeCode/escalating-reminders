import type { Reminder, ReminderFilters, PaginatedResult, ReminderImportance, ReminderStatus } from '@er/types';
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
    importance: ReminderImportance;
    status: ReminderStatus;
    escalationProfileId: string;
    nextTriggerAt?: Date;
}
export interface ReminderUpdateData {
    title?: string;
    description?: string;
    importance?: ReminderImportance;
    escalationProfileId?: string;
    status?: ReminderStatus;
    nextTriggerAt?: Date;
    lastTriggeredAt?: Date;
    completedAt?: Date;
}
//# sourceMappingURL=IReminderRepository.d.ts.map