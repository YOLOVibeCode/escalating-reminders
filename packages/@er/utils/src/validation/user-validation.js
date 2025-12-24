"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateUser = validateCreateUser;
exports.validateUpdateUser = validateUpdateUser;
const constants_1 = require("../../../constants/src");
function validateEmail(email) {
    if (!email || email.trim().length === 0) {
        return {
            field: 'email',
            message: 'Email is required',
            code: 'VALIDATION_MISSING_FIELD',
        };
    }
    if (!(0, constants_1.isValidEmail)(email)) {
        return {
            field: 'email',
            message: 'Invalid email format',
            code: 'VALIDATION_INVALID_FORMAT',
        };
    }
    return null;
}
function validatePassword(password) {
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
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        return {
            field: 'password',
            message: 'Password must contain at least one letter and one number',
            code: 'VALIDATION_INVALID_FORMAT',
        };
    }
    return null;
}
function validateDisplayName(displayName) {
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
function validateTimezone(timezone) {
    if (timezone && timezone.trim().length > 0) {
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
function validateCreateUser(dto) {
    const errors = [];
    const emailError = validateEmail(dto.email);
    if (emailError)
        errors.push(emailError);
    const passwordError = validatePassword(dto.password);
    if (passwordError)
        errors.push(passwordError);
    const displayNameError = validateDisplayName(dto.displayName);
    if (displayNameError)
        errors.push(displayNameError);
    const timezoneError = validateTimezone(dto.timezone);
    if (timezoneError)
        errors.push(timezoneError);
    return {
        isValid: errors.length === 0,
        errors,
    };
}
function validateUpdateUser(dto) {
    const errors = [];
    if (dto.email !== undefined) {
        const emailError = validateEmail(dto.email);
        if (emailError)
            errors.push(emailError);
    }
    if (dto.password !== undefined) {
        const passwordError = validatePassword(dto.password);
        if (passwordError)
            errors.push(passwordError);
    }
    if (dto.displayName !== undefined) {
        const displayNameError = validateDisplayName(dto.displayName);
        if (displayNameError)
            errors.push(displayNameError);
    }
    if (dto.timezone !== undefined) {
        const timezoneError = validateTimezone(dto.timezone);
        if (timezoneError)
            errors.push(timezoneError);
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=user-validation.js.map