import { validateCreateReminder, validateUpdateReminder } from '../../src/validation/reminder-validation';
import type { CreateReminderDto, UpdateReminderDto, ReminderImportance, ScheduleType } from '@er/types';

describe('ReminderValidation', () => {
  describe('validateCreateReminder', () => {
    it('should validate correct reminder DTO', () => {
      const dto: CreateReminderDto = {
        title: 'Test Reminder',
        description: 'Test description',
        importance: 'MEDIUM' as ReminderImportance,
        escalationProfileId: 'esc_123',
        schedule: {
          type: 'ONCE' as ScheduleType,
          timezone: 'America/New_York',
          triggerAt: new Date(Date.now() + 86400000), // Tomorrow
        },
      };

      const result = validateCreateReminder(dto);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing title', () => {
      const dto: CreateReminderDto = {
        title: '',
        importance: 'MEDIUM' as ReminderImportance,
        escalationProfileId: 'esc_123',
        schedule: {
          type: 'ONCE' as ScheduleType,
          timezone: 'America/New_York',
          triggerAt: new Date(Date.now() + 86400000),
        },
      };

      const result = validateCreateReminder(dto);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('should reject title too long', () => {
      const dto: CreateReminderDto = {
        title: 'a'.repeat(201),
        importance: 'MEDIUM' as ReminderImportance,
        escalationProfileId: 'esc_123',
        schedule: {
          type: 'ONCE' as ScheduleType,
          timezone: 'America/New_York',
          triggerAt: new Date(Date.now() + 86400000),
        },
      };

      const result = validateCreateReminder(dto);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('should reject missing importance', () => {
      const dto = {
        title: 'Test',
        escalationProfileId: 'esc_123',
        schedule: {
          type: 'ONCE' as ScheduleType,
          timezone: 'America/New_York',
          triggerAt: new Date(Date.now() + 86400000),
        },
      } as CreateReminderDto;

      const result = validateCreateReminder(dto);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'importance')).toBe(true);
    });

    it('should reject missing schedule', () => {
      const dto = {
        title: 'Test',
        importance: 'MEDIUM' as ReminderImportance,
        escalationProfileId: 'esc_123',
      } as CreateReminderDto;

      const result = validateCreateReminder(dto);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'schedule')).toBe(true);
    });
  });

  describe('validateUpdateReminder', () => {
    it('should validate partial update', () => {
      const dto: UpdateReminderDto = {
        title: 'Updated Title',
      };

      const result = validateUpdateReminder(dto);
      expect(result.isValid).toBe(true);
    });

    it('should validate empty update', () => {
      const dto: UpdateReminderDto = {};

      const result = validateUpdateReminder(dto);
      expect(result.isValid).toBe(true);
    });
  });
});

