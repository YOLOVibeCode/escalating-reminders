import type { SubscriptionTier, ReminderImportance, ReminderStatus, ScheduleType } from '@prisma/client';
import type { Prisma as PrismaTypes } from '@prisma/client';
export type { User, UserProfile, TrustedContact, ApiKey, Subscription, PaymentHistory, Reminder, ReminderSchedule, ReminderSnooze, CompletionCriteria, EscalationProfile, EscalationState, AgentDefinition, UserAgentSubscription, DeliveryWindowUsage, EmailWatcher, WatcherEvent, CalendarConnection, CalendarSyncRule, NotificationLog, PendingNotification, EventLog, AuditTrail, AdminUser, AdminAction, SupportNote, SystemHealthSnapshot, } from '@prisma/client';
export { SubscriptionTier, SubscriptionStatus, DeliveryState, ReminderImportance, ReminderStatus, ScheduleType, EscalationStatus, EmailProvider, CalendarProvider, CalendarRuleAction, NotificationStatus, AdminRole, } from '@prisma/client';
export type { Prisma } from '@prisma/client';
export type UserCreateInput = PrismaTypes.UserUncheckedCreateInput;
export type UserUpdateInput = PrismaTypes.UserUpdateInput;
export type ReminderCreateInput = PrismaTypes.ReminderUncheckedCreateInput;
export type ReminderUpdateInput = PrismaTypes.ReminderUpdateInput;
export type SubscriptionCreateInput = PrismaTypes.SubscriptionUncheckedCreateInput;
export type SubscriptionUpdateInput = PrismaTypes.SubscriptionUpdateInput;
export type AdminUserCreateInput = PrismaTypes.AdminUserUncheckedCreateInput;
export type AdminUserUpdateInput = PrismaTypes.AdminUserUpdateInput;
export type AdminActionCreateInput = PrismaTypes.AdminActionUncheckedCreateInput;
export type SupportNoteCreateInput = PrismaTypes.SupportNoteUncheckedCreateInput;
export type SupportNoteUpdateInput = PrismaTypes.SupportNoteUpdateInput;
export type SystemHealthSnapshotCreateInput = PrismaTypes.SystemHealthSnapshotCreateInput;
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: {
        timestamp: string;
        requestId: string;
    };
}
export interface PaginatedResult<T> {
    items: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalItems: number;
        totalPages: number;
    };
}
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Array<{
            field: string;
            message: string;
        }>;
        requestId: string;
    };
    meta: {
        timestamp: string;
    };
}
export interface CreateUserDto {
    email: string;
    password: string;
    displayName: string;
    timezone?: string;
}
export interface LoginDto {
    email: string;
    password: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface AccessTokenPayload {
    sub: string;
    email: string;
    tier: SubscriptionTier;
    iat?: number;
    exp?: number;
}
export interface RefreshTokenPayload {
    sub: string;
    sessionId: string;
    iat?: number;
    exp?: number;
}
export interface CreateReminderDto {
    title: string;
    description?: string;
    importance: ReminderImportance;
    escalationProfileId: string;
    schedule: CreateScheduleDto;
    completionCriteria?: CreateCompletionCriteriaDto;
}
export interface UpdateReminderDto {
    title?: string;
    description?: string;
    importance?: ReminderImportance;
    escalationProfileId?: string;
}
export interface CreateScheduleDto {
    type: ScheduleType;
    timezone: string;
    triggerAt?: Date;
    cronExpression?: string;
    intervalMinutes?: number;
    excludeDates?: Date[];
    excludeWeekends?: boolean;
}
export interface CreateCompletionCriteriaDto {
    type: 'manual' | 'email_watcher' | 'webhook' | 'api';
    config: Record<string, unknown>;
}
export type CompletionSource = 'manual' | 'email_watcher' | 'webhook' | 'agent' | 'contact';
export interface ReminderFilters {
    status?: ReminderStatus;
    importance?: ReminderImportance;
    page?: number;
    pageSize?: number;
}
export interface CreateEscalationProfileDto {
    name: string;
    description?: string;
    tiers: EscalationTier[];
}
export interface UpdateEscalationProfileDto {
    name?: string;
    description?: string;
    tiers?: EscalationTier[];
}
export interface EscalationTier {
    tierNumber: number;
    delayMinutes: number;
    agentIds: string[];
    includeTrustedContacts: boolean;
    message?: string;
}
export type EscalationCancelReason = 'acknowledged' | 'completed' | 'snoozed' | 'deleted';
//# sourceMappingURL=index.d.ts.map