import { Module } from '@nestjs/common';

import { NotificationQueryService } from './notification-query.service';
import { NotificationController } from './notification.controller';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AgentModule } from '../agents/agent.module';
import { AuthModule } from '../auth/auth.module';
import { EscalationModule } from '../escalation/escalation.module';
import { ReminderModule } from '../reminders/reminder.module';
import { SmsModule } from '../sms/sms.module';

/**
 * Notification module.
 * Provides notification delivery and query functionality.
 */
@Module({
  imports: [DatabaseModule, ReminderModule, EscalationModule, AgentModule, AuthModule, SmsModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, NotificationQueryService],
  exports: [NotificationService, NotificationQueryService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- NestJS @Module container
export class NotificationModule {}

