import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AdminModule } from './domains/admin/admin.module';
import { AgentModule } from './domains/agents/agent.module';
import { AuthModule } from './domains/auth/auth.module';
import { EscalationModule } from './domains/escalation/escalation.module';
import { NotificationModule } from './domains/notifications/notification.module';
import { ReminderModule } from './domains/reminders/reminder.module';
import { SeedingModule } from './domains/seeding/seeding.module';
import { SmsModule } from './domains/sms/sms.module';
import { TrustedContactModule } from './domains/trusted-contacts/trusted-contact.module';
import { HealthController } from './health.controller';
import { CacheModule } from './infrastructure/cache/cache.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { EventBusModule } from './infrastructure/events/event-bus.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { SmsInboundController } from './webhooks/sms-inbound.controller';
import { SmsStatusController } from './webhooks/sms-status.controller';
import { StoreWebhookController } from './webhooks/store-webhook.controller';
import { EscalationAdvancementJob } from './workers/jobs/escalation-advancement-job';
import { ReminderTriggerJob } from './workers/jobs/reminder-trigger-job';
import { SystemHealthSnapshotJob } from './workers/jobs/system-health-snapshot-job';
import { EscalationProcessor } from './workers/processors/escalation-processor';
import { NotificationProcessor } from './workers/processors/notification-processor';
import { ReminderProcessor } from './workers/processors/reminder-processor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Infrastructure (must be loaded first)
    DatabaseModule,
    CacheModule,
    QueueModule,
    EventBusModule,
    LoggingModule,

    // Domain modules
    AuthModule,
    ReminderModule,
    EscalationModule,
    AgentModule,
    NotificationModule,
    AdminModule,
    SeedingModule,
    SmsModule,
    TrustedContactModule,
  ],
  controllers: [HealthController, StoreWebhookController, SmsInboundController, SmsStatusController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Workers
    ReminderTriggerJob,
    EscalationAdvancementJob,
    SystemHealthSnapshotJob,
    ReminderProcessor,
    NotificationProcessor,
    EscalationProcessor,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- NestJS @Module container
export class AppModule {}
