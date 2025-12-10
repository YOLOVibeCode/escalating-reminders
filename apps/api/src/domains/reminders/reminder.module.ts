import { Module } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { ReminderController } from './reminder.controller';
import { ReminderRepository } from './reminder.repository';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Reminder module.
 * Provides reminder functionality.
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ReminderController],
  providers: [ReminderService, ReminderRepository],
  exports: [ReminderService],
})
export class ReminderModule {}

