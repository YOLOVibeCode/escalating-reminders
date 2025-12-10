import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { QueueService } from '../infrastructure/queue/queue.service';
import { ReminderProcessor } from './processors/reminder-processor';
import { NotificationProcessor } from './processors/notification-processor';
import { Logger } from '@nestjs/common';

/**
 * Worker service.
 * Processes jobs from BullMQ queues.
 * Can run multiple instances for horizontal scaling.
 */
async function bootstrap() {
  const logger = new Logger('Worker');

  try {
    logger.log('Starting worker service...');

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get services
    const queueService = app.get(QueueService);
    const reminderProcessor = app.get(ReminderProcessor);
    const notificationProcessor = app.get(NotificationProcessor);

    // Register job processors

    // High-priority queue: reminder triggers
    await queueService.process('high-priority', 'reminder.trigger', async (data) => {
      await reminderProcessor.processReminderTrigger(data);
    });

    // Default queue: notifications
    await queueService.process('default', 'notification.send', async (data) => {
      await notificationProcessor.processNotificationSend(data);
    });

    logger.log('Worker service started. Processing jobs from queues...');

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('SIGTERM received, shutting down worker...');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('SIGINT received, shutting down worker...');
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start worker service:', error);
    process.exit(1);
  }
}

bootstrap();

