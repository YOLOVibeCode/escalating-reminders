import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ReminderTriggerJob } from './jobs/reminder-trigger-job';
import { EscalationAdvancementJob } from './jobs/escalation-advancement-job';
import { SystemHealthSnapshotJob } from './jobs/system-health-snapshot-job';
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

    // Get jobs
    const reminderTriggerJob = app.get(ReminderTriggerJob);
    const escalationAdvancementJob = app.get(EscalationAdvancementJob);
    const systemHealthSnapshotJob = app.get(SystemHealthSnapshotJob);

    // Run immediately on startup
    logger.log('Running initial jobs...');
    await Promise.all([
      reminderTriggerJob.execute(),
      escalationAdvancementJob.execute(),
      systemHealthSnapshotJob.execute(),
    ]);

    // Schedule reminder trigger job to run every minute
    const reminderInterval = setInterval(async () => {
      try {
        await reminderTriggerJob.execute();
      } catch (error) {
        logger.error('Error in scheduled reminder trigger job:', error);
      }
    }, 60 * 1000); // 60 seconds

    // Schedule escalation advancement job to run every minute
    const escalationInterval = setInterval(async () => {
      try {
        await escalationAdvancementJob.execute();
      } catch (error) {
        logger.error('Error in scheduled escalation advancement job:', error);
      }
    }, 60 * 1000); // 60 seconds

    // Schedule system health snapshot job to run every 5 minutes
    const healthSnapshotInterval = setInterval(async () => {
      try {
        await systemHealthSnapshotJob.execute();
      } catch (error) {
        logger.error('Error in scheduled system health snapshot job:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    logger.log(
      'Scheduler service started. Running reminder trigger and escalation advancement jobs every minute, system health snapshot every 5 minutes.',
    );

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('SIGTERM received, shutting down scheduler...');
      clearInterval(reminderInterval);
      clearInterval(escalationInterval);
      clearInterval(healthSnapshotInterval);
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('SIGINT received, shutting down scheduler...');
      clearInterval(reminderInterval);
      clearInterval(escalationInterval);
      clearInterval(healthSnapshotInterval);
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start scheduler service:', error);
    process.exit(1);
  }
}

bootstrap();

