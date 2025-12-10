import { isValidEmail, isValidPhoneUS } from '@er/constants';
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

/**
 * Validate email address.
 */
function validateEmail(email: string | undefined): ValidationError | null {
  if (!email || email.trim().length === 0) {
    return {
      field: 'email',
      message: 'Email is required',
      code: 'VALIDATION_MISSING_FIELD',
    };
  }

  if (!isValidEmail(email)) {
    return {
      field: 'email',
      message: 'Invalid email format',
      code: 'VALIDATION_INVALID_FORMAT',
    };
  }

  return null;
}

/**
 * Validate password.
 */
function validatePassword(password: string | undefined): ValidationError | null {
  if (!password || password.length === 0) {
    return {
      field: 'password',
      message: 'Password is required',
      code: 'VALIDATION_MISSING_FIELD',
    };
  }

  if (password.length < 8) {
    return {
      field: 'password',
      message: 'Password must be at least 8 characters',
      code: 'VALIDATION_INVALID_FORMAT',
    };
  }

  if (password.length > 128) {
    return {
      field: 'password',
      message: 'Password must be 128 characters or less',
      code: 'VALIDATION_INVALID_FORMAT',
    };
  }

  // At least one letter and one number
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      field: 'password',
      message: 'Password must contain at least one letter and one number',
      code: 'VALIDATION_INVALID_FORMAT',
    };
  }

  return null;
}

/**
 * Validate display name.
 */
function validateDisplayName(displayName: string | undefined): ValidationError | null {
  if (!displayName || displayName.trim().length === 0) {
    return {
      field: 'displayName',
      message: 'Display name is required',
      code: 'VALIDATION_MISSING_FIELD',
    };
  }

  if (displayName.length > 100) {
    return {
      field: 'displayName',
      message: 'Display name must be 100 characters or less',
      code: 'VALIDATION_INVALID_FORMAT',
    };
  }

  return null;
}

/**
 * Validate timezone.
 */
function validateTimezone(timezone: string | undefined): ValidationError | null {
  if (timezone && timezone.trim().length > 0) {
    // Basic IANA timezone validation
    const timezonePattern = /^[A-Za-z_]+\/[A-Za-z_]+$/;
    if (!timezonePattern.test(timezone)) {
      return {
        field: 'timezone',
        message: 'Invalid timezone format. Use IANA timezone (e.g., America/New_York)',
        code: 'VALIDATION_INVALID_FORMAT',
      };
    }
  }

  return null;
}

/**
 * Validate user creation DTO.
 */
export function validateCreateUser(dto: CreateUserDto): ValidationResult {
  const errors: ValidationError[] = [];

  const emailError = validateEmail(dto.email);
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(dto.password);
  if (passwordError) errors.push(passwordError);

  const displayNameError = validateDisplayName(dto.displayName);
  if (displayNameError) errors.push(displayNameError);

  const timezoneError = validateTimezone(dto.timezone);
  if (timezoneError) errors.push(timezoneError);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate user update DTO (partial).
 */
export function validateUpdateUser(dto: Partial<CreateUserDto>): ValidationResult {
  const errors: ValidationError[] = [];

  if (dto.email !== undefined) {
    const emailError = validateEmail(dto.email);
    if (emailError) errors.push(emailError);
  }

  if (dto.password !== undefined) {
    const passwordError = validatePassword(dto.password);
    if (passwordError) errors.push(passwordError);
  }

  if (dto.displayName !== undefined) {
    const displayNameError = validateDisplayName(dto.displayName);
    if (displayNameError) errors.push(displayNameError);
  }

  if (dto.timezone !== undefined) {
    const timezoneError = validateTimezone(dto.timezone);
    if (timezoneError) errors.push(timezoneError);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

