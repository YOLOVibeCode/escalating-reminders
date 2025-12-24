"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateReminder = validateCreateReminder;
exports.validateUpdateReminder = validateUpdateReminder;
function validateTitle(title) {
    if (!title || title.trim().length === 0) {
        return {
            field: 'title',
            message: 'Title is required',
            code: 'VALIDATION_MISSING_FIELD',
        };
    }
    if (title.length > 200) {
        return {
            field: 'title',
            message: 'Title must be 200 characters or less',
            code: 'VALIDATION_INVALID_FORMAT',
        };
    }
    return null;
}
function validateDescription(description) {
    if (description && description.length > 2000) {
        return {
            field: 'description',
            message: 'Description must be 2000 characters or less',
            code: 'VALIDATION_INVALID_FORMAT',
        };
    }
    return null;
}
function validateImportance(importance) {
    if (!importance) {
        return {
            field: 'importance',
            message: 'Importance is required',
            code: 'VALIDATION_MISSING_FIELD',
        };
    }
    const validValues = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validValues.includes(importance)) {
        return {
            field: 'importance',
            message: `Importance must be one of: ${validValues.join(', ')}`,
            code: 'VALIDATION_INVALID_FORMAT',
        };
    }
    return null;
}
function validateEscalationProfileId(escalationProfileId) {
    if (!escalationProfileId || escalationProfileId.trim().length === 0) {
        return {
            field: 'escalationProfileId',
            message: 'Escalation profile ID is required',
            code: 'VALIDATION_MISSING_FIELD',
        };
    }
    return null;
}
function validateSchedule(schedule) {
    if (!schedule) {
        return {
            field: 'schedule',
            message: 'Schedule is required',
            code: 'VALIDATION_MISSING_FIELD',
        };
    }
    if (!schedule.timezone || schedule.timezone.trim().length === 0) {
        return {
            field: 'schedule.timezone',
            message: 'Timezone is required',
            code: 'VALIDATION_MISSING_FIELD',
        };
    }
    if (schedule.type === 'CRON' && (!schedule.cronExpression || schedule.cronExpression.trim().length === 0)) {
        return {
            field: 'schedule.cronExpression',
            message: 'Cron expression is required for CRON schedule type',
            code: 'VALIDATION_MISSING_FIELD',
        };
    }
    if (schedule.type === 'ONCE' && (!schedule.triggerAt || isNaN(new Date(schedule.triggerAt).getTime()))) {
        return {
            field: 'schedule.triggerAt',
            message: 'Trigger date is required for ONCE schedule type',
            code: 'VALIDATION_MISSING_FIELD',
        };
    }
    return null;
}
function validateCreateReminder(dto) {
    const errors = [];
    const titleError = validateTitle(dto.title);
    if (titleError)
        errors.push(titleError);
    const descriptionError = validateDescription(dto.description);
    if (descriptionError)
        errors.push(descriptionError);
    const importanceError = validateImportance(dto.importance);
    if (importanceError)
        errors.push(importanceError);
    const escalationProfileError = validateEscalationProfileId(dto.escalationProfileId);
    if (escalationProfileError)
        errors.push(escalationProfileError);
    const scheduleError = validateSchedule(dto.schedule);
    if (scheduleError)
        errors.push(scheduleError);
    return {
        isValid: errors.length === 0,
        errors,
    };
}
function validateUpdateReminder(dto) {
    const errors = [];
    if (dto.title !== undefined) {
        const titleError = validateTitle(dto.title);
        if (titleError)
            errors.push(titleError);
    }
    if (dto.description !== undefined) {
        const descriptionError = validateDescription(dto.description);
        if (descriptionError)
            errors.push(descriptionError);
    }
    if (dto.importance !== undefined) {
        const importanceError = validateImportance(dto.importance);
        if (importanceError)
            errors.push(importanceError);
    }
    if (dto.escalationProfileId !== undefined) {
        const escalationProfileError = validateEscalationProfileId(dto.escalationProfileId);
        if (escalationProfileError)
            errors.push(escalationProfileError);
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=reminder-validation.js.map