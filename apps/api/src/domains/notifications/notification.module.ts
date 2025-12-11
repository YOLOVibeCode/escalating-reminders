import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { NotificationQueryService } from './notification-query.service';
import { NotificationController } from './notification.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { ReminderModule } from '../reminders/reminder.module';
import { EscalationModule } from '../escalation/escalation.module';
import { AgentModule } from '../agents/agent.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Notification module.
 * Provides notification delivery and query functionality.
 */
@Module({
  imports: [DatabaseModule, ReminderModule, EscalationModule, AgentModule, AuthModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, NotificationQueryService],
  exports: [NotificationService, NotificationQueryService],
})
export class NotificationModule {}

