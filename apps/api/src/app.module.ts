import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Infrastructure
import { DatabaseModule } from './infrastructure/database/database.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { EventBusModule } from './infrastructure/events/event-bus.module';
import { LoggingModule } from './infrastructure/logging/logging.module';

// Common
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// Domain modules
import { AuthModule } from './domains/auth/auth.module';
import { ReminderModule } from './domains/reminders/reminder.module';

// Workers
import { ReminderTriggerJob } from './workers/jobs/reminder-trigger-job';
import { ReminderProcessor } from './workers/processors/reminder-processor';
import { NotificationProcessor } from './workers/processors/notification-processor';

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
  ],
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
    ReminderProcessor,
    NotificationProcessor,
  ],
})
export class AppModule {}

