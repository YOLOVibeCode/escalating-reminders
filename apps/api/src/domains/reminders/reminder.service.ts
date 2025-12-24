import { Injectable } from '@nestjs/common';
import { ReminderRepository } from './reminder.repository';
import { AuthRepository } from '../auth/auth.repository';
import { SUBSCRIPTION_TIERS } from '@er/constants';
import { validateCreateReminder, validateUpdateReminder } from '@er/utils';
import { NotFoundError, ForbiddenError, QuotaExceededError, ValidationError } from '../../common/exceptions';
import type { IReminderService } from '@er/interfaces';
import type {
  Reminder,
  CreateReminderDto,
  UpdateReminderDto,
  ReminderFilters,
  PaginatedResult,
  ReminderStatus,
} from '@er/types';

/**
 * Reminder service.
 * Implements IReminderService interface.
 * Handles reminder business logic.
 */
@Injectable()
export class ReminderService implements IReminderService {
  constructor(
    private readonly repository: ReminderRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async create(userId: string, dto: CreateReminderDto): Promise<Reminder> {
    // Validate DTO
    const validation = validateCreateReminder(dto);
    if (!validation.isValid) {
      throw new ValidationError(
        'Invalid reminder data',
        validation.errors.map((e) => ({ field: e.field, message: e.message })),
      );
    }

    // Check user subscription tier for quota
    const user = await this.authRepository.findByIdWithSubscription(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const tier = user.subscription?.tier || 'FREE';
    const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
    const currentCount = await this.repository.countByUser(userId);
    const maxReminders = tierConfig.limits.maxReminders;

    // Check quota (unlimited is -1)
    if (maxReminders !== -1 && currentCount >= maxReminders) {
      throw new QuotaExceededError(
        `Reminder limit reached. Maximum reminders for ${tierConfig.name} tier: ${maxReminders}`,
      );
    }

    // Set default nextTriggerAt from schedule
    const nextTriggerAt = dto.schedule.triggerAt;

    // Create reminder
    const createData: any = {
      userId,
      title: dto.title,
      importance: dto.importance,
      status: 'ACTIVE' as ReminderStatus,
      escalationProfileId: dto.escalationProfileId,
    };
    if (dto.description !== undefined) createData.description = dto.description;
    if (nextTriggerAt) createData.nextTriggerAt = nextTriggerAt;

    const reminder = await this.repository.create(createData);

    return reminder;
  }

  async findById(userId: string, reminderId: string): Promise<Reminder> {
    const reminder = await this.repository.findById(reminderId);

    if (!reminder) {
      throw new NotFoundError(`Reminder with ID ${reminderId} not found`);
    }

    if (reminder.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this reminder');
    }

    return reminder;
  }

  async findAll(
    userId: string,
    filters: ReminderFilters,
  ): Promise<PaginatedResult<Reminder>> {
    return this.repository.findByUserId(userId, filters);
  }

  async update(
    userId: string,
    reminderId: string,
    dto: UpdateReminderDto,
  ): Promise<Reminder> {
    // Validate DTO
    const validation = validateUpdateReminder(dto);
    if (!validation.isValid) {
      throw new ValidationError(
        'Invalid reminder data',
        validation.errors.map((e) => ({ field: e.field, message: e.message })),
      );
    }

    // Check ownership
    const reminder = await this.findById(userId, reminderId);

    // Update reminder
    return this.repository.update(reminderId, dto);
  }

  async delete(userId: string, reminderId: string): Promise<void> {
    // Check ownership
    await this.findById(userId, reminderId);

    // Delete reminder
    await this.repository.delete(reminderId);
  }
}

