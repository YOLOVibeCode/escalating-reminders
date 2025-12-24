import { Module } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { ReminderController } from './reminder.controller';
import { ReminderRepository } from './reminder.repository';
import { ReminderSnoozeService } from './reminder-snooze.service';
import { ReminderCompletionService } from './reminder-completion.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { EscalationModule } from '../escalation/escalation.module';

/**
 * Reminder module.
 * Provides reminder functionality.
 */
@Module({
  imports: [DatabaseModule, AuthModule, EscalationModule],
  controllers: [ReminderController],
  providers: [
    ReminderService,
    ReminderRepository,
    ReminderSnoozeService,
    ReminderCompletionService,
  ],
  exports: [
    ReminderService,
    ReminderRepository,
    ReminderSnoozeService,
    ReminderCompletionService,
  ],
})
export class ReminderModule {}

