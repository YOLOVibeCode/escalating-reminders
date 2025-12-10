import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ReminderTriggerJob } from './jobs/reminder-trigger-job';
import { Logger } from '@nestjs/common';

/**
 * Scheduler service.
 * Runs cron jobs to find due reminders and queue them.
 * MUST run as singleton (only one instance).
 */
async function bootstrap() {
  const logger = new Logger('Scheduler');

  try {
    logger.log('Starting scheduler service...');

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get the reminder trigger job
    const reminderTriggerJob = app.get(ReminderTriggerJob);

    // Run immediately on startup
    logger.log('Running initial reminder trigger check...');
    await reminderTriggerJob.execute();

    // Schedule to run every minute
    const interval = setInterval(async () => {
      try {
        await reminderTriggerJob.execute();
      } catch (error) {
        logger.error('Error in scheduled reminder trigger job:', error);
      }
    }, 60 * 1000); // 60 seconds

    logger.log('Scheduler service started. Running reminder trigger job every minute.');

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('SIGTERM received, shutting down scheduler...');
      clearInterval(interval);
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('SIGINT received, shutting down scheduler...');
      clearInterval(interval);
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start scheduler service:', error);
    process.exit(1);
  }
}

bootstrap();

