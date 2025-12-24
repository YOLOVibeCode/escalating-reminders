import type { CreateReminderDto, UpdateReminderDto } from '@er/types';
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export declare function validateCreateReminder(dto: CreateReminderDto): ValidationResult;
export declare function validateUpdateReminder(dto: UpdateReminderDto): ValidationResult;
//# sourceMappingURL=reminder-validation.d.ts.map