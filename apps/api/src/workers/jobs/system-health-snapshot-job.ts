import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { QueueService } from '../../infrastructure/queue/queue.service';
import type { IAdminRepository, ICache } from '@er/interfaces';

/**
 * System health snapshot job.
 * Collects system health metrics and saves them to the database.
 * Runs every 5 minutes.
 */
@Injectable()
export class SystemHealthSnapshotJob {
  private readonly logger = new Logger(SystemHealthSnapshotJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    @Inject('IAdminRepository')
    private readonly adminRepository: IAdminRepository,
    @Inject('ICache')
    private readonly cache: ICache,
  ) {}

  /**
   * Collect system health metrics and save snapshot.
   * This runs every 5 minutes via scheduler.
   */
  async execute(): Promise<void> {
    this.logger.log('Collecting system health snapshot...');

    try {
      const [queueStats, workerStats, databaseStats, redisStats, notificationStats, errorCount] =
        await Promise.all([
          this.collectQueueStats(),
          this.collectWorkerStats(),
          this.collectDatabaseStats(),
          this.collectRedisStats(),
          this.collectNotificationStats(),
          this.countRecentErrors(),
        ]);

      // Create snapshot
      await this.adminRepository.createHealthSnapshot({
        timestamp: new Date(),
        queueStats,
        workerStats,
        databaseStats,
        redisStats,
        notificationStats,
        errorCount,
      });

      this.logger.log('System health snapshot saved successfully');
    } catch (error) {
      this.logger.error('Error collecting system health snapshot:', error);
      // Don't throw - we don't want to crash the scheduler
    }
  }

  /**
   * Collect queue statistics from BullMQ.
   */
  private async collectQueueStats(): Promise<any> {
    try {
      const queues = ['high-priority', 'default', 'low-priority', 'scheduled'];
      const stats: any = {};

      for (const queueName of queues) {
        try {
          const queue = this.queueService.getQueue(queueName);
          const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
          ]);

          stats[queueName] = {
            waiting,
            active,
            completed,
            failed,
            delayed,
          };
        } catch (error) {
          this.logger.warn(`Failed to get stats for queue ${queueName}:`, error);
          stats[queueName] = {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
          };
        }
      }

      return stats;
    } catch (error) {
      this.logger.warn('Failed to collect queue stats:', error);
      return {
        'high-priority': this.getDefaultQueueInfo(),
        default: this.getDefaultQueueInfo(),
        'low-priority': this.getDefaultQueueInfo(),
        scheduled: this.getDefaultQueueInfo(),
      };
    }
  }

  /**
   * Collect worker statistics.
   * Note: BullMQ doesn't expose worker stats directly, so we estimate based on active jobs.
   */
  private async collectWorkerStats(): Promise<any> {
    try {
      // Get active jobs across all queues as proxy for worker activity
      const queues = ['high-priority', 'default', 'low-priority', 'scheduled'];
      let totalActive = 0;

      for (const queueName of queues) {
        try {
          const queue = this.queueService.getQueue(queueName);
          const activeCount = await queue.getActiveCount();
          totalActive += activeCount;
        } catch (error) {
          // Ignore errors for individual queues
        }
      }

      // Estimate workers based on active jobs (assuming concurrency of 5 per worker)
      const estimatedWorkers = Math.ceil(totalActive / 5);

      // Get job counts from last hour
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const [jobsProcessed, jobsFailed] = await Promise.all([
        this.prisma.notificationLog.count({
          where: {
            createdAt: {
              gte: oneHourAgo,
            },
            status: {
              in: ['SENT', 'DELIVERED'],
            },
          },
        }),
        this.prisma.notificationLog.count({
          where: {
            createdAt: {
              gte: oneHourAgo,
            },
            status: 'FAILED',
          },
        }),
      ]);

      return {
        totalWorkers: estimatedWorkers,
        activeWorkers: estimatedWorkers > 0 ? estimatedWorkers : 0,
        idleWorkers: 0, // Cannot determine without worker registry
        jobsProcessed,
        jobsFailed,
        averageProcessingTime: 0, // Would need to track this separately
      };
    } catch (error) {
      this.logger.warn('Failed to collect worker stats:', error);
      return this.getDefaultWorkerStats();
    }
  }

  /**
   * Collect database statistics.
   */
  private async collectDatabaseStats(): Promise<any> {
    try {
      // Prisma doesn't expose connection pool stats directly
      // We can query for slow queries or use a simple health check
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const queryTime = Date.now() - startTime;

      // Count slow queries (queries taking > 1 second) from recent logs
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Note: This is a simplified approach. In production, you'd want to
      // track query times in a separate log or use database-specific monitoring
      const slowQueries = 0; // Placeholder

      return {
        connectionPoolSize: 10, // Default Prisma pool size
        activeConnections: 0, // Cannot determine without DB-specific queries
        idleConnections: 0,
        slowQueries,
        queryTime,
      };
    } catch (error) {
      this.logger.warn('Failed to collect database stats:', error);
      return {
        connectionPoolSize: 0,
        activeConnections: 0,
        idleConnections: 0,
        slowQueries: 0,
        queryTime: 0,
      };
    }
  }

  /**
   * Collect Redis statistics.
   */
  private async collectRedisStats(): Promise<any> {
    try {
      // Try to get Redis stats from cache service
      // Note: This depends on RedisService exposing stats, which it currently doesn't
      // For now, we'll return basic stats

      // Check if Redis is connected by trying a simple operation
      const testKey = 'health:test';
      await this.cache.set(testKey, 'test', 1);
      const connected = await this.cache.exists(testKey);
      await this.cache.delete(testKey);

      return {
        connected,
        memoryUsed: 0, // Would need Redis INFO command
        memoryMax: 0,
        hitRate: 0, // Would need to track cache hits/misses
        keys: 0, // Would need Redis DBSIZE command
      };
    } catch (error) {
      this.logger.warn('Failed to collect Redis stats:', error);
      return {
        connected: false,
        memoryUsed: 0,
        memoryMax: 0,
        hitRate: 0,
        keys: 0,
      };
    }
  }

  /**
   * Collect notification statistics from last hour.
   */
  private async collectNotificationStats(): Promise<any> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const [total, sent, delivered, failed] = await Promise.all([
        this.prisma.notificationLog.count({
          where: {
            createdAt: {
              gte: oneHourAgo,
            },
          },
        }),
        this.prisma.notificationLog.count({
          where: {
            createdAt: {
              gte: oneHourAgo,
            },
            status: 'SENT',
          },
        }),
        this.prisma.notificationLog.count({
          where: {
            createdAt: {
              gte: oneHourAgo,
            },
            status: 'DELIVERED',
          },
        }),
        this.prisma.notificationLog.count({
          where: {
            createdAt: {
              gte: oneHourAgo,
            },
            status: 'FAILED',
          },
        }),
      ]);

      return {
        total,
        sent,
        delivered,
        failed,
        deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      };
    } catch (error) {
      this.logger.warn('Failed to collect notification stats:', error);
      return {
        total: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        deliveryRate: 0,
      };
    }
  }

  /**
   * Count recent errors (last hour).
   */
  private async countRecentErrors(): Promise<number> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      return this.prisma.notificationLog.count({
        where: {
          status: 'FAILED',
          createdAt: {
            gte: oneHourAgo,
          },
        },
      });
    } catch (error) {
      this.logger.warn('Failed to count recent errors:', error);
      return 0;
    }
  }

  /**
   * Get default queue info structure.
   */
  private getDefaultQueueInfo(): any {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }

  /**
   * Get default worker stats structure.
   */
  private getDefaultWorkerStats(): any {
    return {
      totalWorkers: 0,
      activeWorkers: 0,
      idleWorkers: 0,
      jobsProcessed: 0,
      jobsFailed: 0,
      averageProcessingTime: 0,
    };
  }
}
