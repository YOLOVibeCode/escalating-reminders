import type { CreateUserDto } from '@er/types';
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export declare function validateCreateUser(dto: CreateUserDto): ValidationResult;
export declare function validateUpdateUser(dto: Partial<CreateUserDto>): ValidationResult;
//# sourceMappingURL=user-validation.d.ts.map