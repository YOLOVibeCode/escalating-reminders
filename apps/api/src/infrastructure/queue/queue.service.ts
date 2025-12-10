import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import type { IQueue, JobData, JobOptions } from '@er/interfaces';

/**
 * BullMQ queue service.
 * Implements IQueue interface for job queue operations.
 */
@Injectable()
export class QueueService implements IQueue, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: Redis | null = null;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not configured, queue operations will fail');
      return;
    }

    this.connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.logger.log('Queue service initialized');
  }

  async onModuleDestroy(): Promise<void> {
    // Close all workers
    for (const worker of this.workers.values()) {
      await worker.close();
    }

    // Close all queues
    for (const queue of this.queues.values()) {
      await queue.close();
    }

    if (this.connection) {
      await this.connection.quit();
    }

    this.logger.log('Queue service closed');
  }

  getQueue(name: string): Queue {
    if (!this.connection) {
      throw new Error('Redis connection not available');
    }

    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: this.connection,
      });
      this.queues.set(name, queue);
    }

    return this.queues.get(name)!;
  }

  async add<T extends JobData>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions,
  ): Promise<string> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobName, data, {
      attempts: options?.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: options?.backoffDelay || 2000,
      },
      removeOnComplete: options?.removeOnComplete || true,
      removeOnFail: options?.removeOnFail || false,
    });

    return job.id!;
  }

  async process<T extends JobData>(
    queueName: string,
    jobName: string,
    handler: (data: T) => Promise<void>,
  ): Promise<void> {
    if (!this.connection) {
      throw new Error('Redis connection not available');
    }

    const workerKey = `${queueName}:${jobName}`;
    if (this.workers.has(workerKey)) {
      this.logger.warn(`Worker for ${workerKey} already exists`);
      return;
    }

    const worker = new Worker(
      queueName,
      async (job) => {
        if (job.name === jobName) {
          await handler(job.data as T);
        }
      },
      {
        connection: this.connection,
        concurrency: 5,
      },
    );

    worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} completed`);
    });

    worker.on('failed', (job, error) => {
      this.logger.error(`Job ${job?.id} failed:`, error);
    });

    this.workers.set(workerKey, worker);
    this.logger.log(`Worker registered for ${workerKey}`);
  }
}

