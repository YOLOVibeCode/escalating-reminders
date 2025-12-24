import type { CreateReminderDto, UpdateReminderDto, ReminderImportance, CreateScheduleDto } from '@er/types';

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
 * Validate reminder title.
 */
function validateTitle(title: string | undefined): ValidationError | null {
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

/**
 * Validate reminder description.
 */
function validateDescription(description: string | undefined): ValidationError | null {
  if (description && description.length > 2000) {
    return {
      field: 'description',
      message: 'Description must be 2000 characters or less',
      code: 'VALIDATION_INVALID_FORMAT',
    };
  }

  return null;
}

/**
 * Validate reminder importance.
 */
function validateImportance(importance: ReminderImportance | undefined): ValidationError | null {
  if (!importance) {
    return {
      field: 'importance',
      message: 'Importance is required',
      code: 'VALIDATION_MISSING_FIELD',
    };
  }

  const validValues: ReminderImportance[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  if (!validValues.includes(importance)) {
    return {
      field: 'importance',
      message: `Importance must be one of: ${validValues.join(', ')}`,
      code: 'VALIDATION_INVALID_FORMAT',
    };
  }

  return null;
}

/**
 * Validate escalation profile ID.
 */
function validateEscalationProfileId(
  escalationProfileId: string | undefined,
): ValidationError | null {
  if (!escalationProfileId || escalationProfileId.trim().length === 0) {
    return {
      field: 'escalationProfileId',
      message: 'Escalation profile ID is required',
      code: 'VALIDATION_MISSING_FIELD',
    };
  }

  return null;
}

/**
 * Validate schedule DTO.
 */
function validateSchedule(schedule: CreateScheduleDto | undefined): ValidationError | null {
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

  // Validate cron expression if schedule type is CRON
  if ((schedule.type as any) === 'CRON' && (!schedule.cronExpression || schedule.cronExpression.trim().length === 0)) {
    return {
      field: 'schedule.cronExpression',
      message: 'Cron expression is required for CRON schedule type',
      code: 'VALIDATION_MISSING_FIELD',
    };
  }

  // Validate triggerAt if schedule type is ONCE
  if (schedule.type === 'ONCE' && (!schedule.triggerAt || isNaN(new Date(schedule.triggerAt).getTime()))) {
    return {
      field: 'schedule.triggerAt',
      message: 'Trigger date is required for ONCE schedule type',
      code: 'VALIDATION_MISSING_FIELD',
    };
  }

  return null;
}

/**
 * Validate reminder creation DTO.
 */
export function validateCreateReminder(dto: CreateReminderDto): ValidationResult {
  const errors: ValidationError[] = [];

  const titleError = validateTitle(dto.title);
  if (titleError) errors.push(titleError);

  const descriptionError = validateDescription(dto.description);
  if (descriptionError) errors.push(descriptionError);

  const importanceError = validateImportance(dto.importance);
  if (importanceError) errors.push(importanceError);

  const escalationProfileError = validateEscalationProfileId(dto.escalationProfileId);
  if (escalationProfileError) errors.push(escalationProfileError);

  const scheduleError = validateSchedule(dto.schedule);
  if (scheduleError) errors.push(scheduleError);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate reminder update DTO.
 */
export function validateUpdateReminder(dto: UpdateReminderDto): ValidationResult {
  const errors: ValidationError[] = [];

  if (dto.title !== undefined) {
    const titleError = validateTitle(dto.title);
    if (titleError) errors.push(titleError);
  }

  if (dto.description !== undefined) {
    const descriptionError = validateDescription(dto.description);
    if (descriptionError) errors.push(descriptionError);
  }

  if (dto.importance !== undefined) {
    const importanceError = validateImportance(dto.importance);
    if (importanceError) errors.push(importanceError);
  }

  if (dto.escalationProfileId !== undefined) {
    const escalationProfileError = validateEscalationProfileId(dto.escalationProfileId);
    if (escalationProfileError) errors.push(escalationProfileError);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

