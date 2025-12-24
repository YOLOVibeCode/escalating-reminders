import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import type { IQueue, QueueJob, QueueJobOptions } from '@er/interfaces';

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

  // IQueue-compatible signature
  add<T = unknown>(name: string, data: T, options?: QueueJobOptions): Promise<QueueJob<T>>;
  // Legacy signature used by worker bootstrap (queueName + jobName)
  add<T = unknown>(queueName: string, jobName: string, data: T, options?: any): Promise<string>;
  async add(...args: any[]): Promise<any> {
    const [a, b, c, d] = args;

    // Legacy: (queueName, jobName, data, options)
    if (typeof a === 'string' && typeof b === 'string') {
      const queueName = a;
      const jobName = b;
      const data = c;
      const options = d;
      const queue = this.getQueue(queueName);
      const job = await queue.add(jobName, data, {
        attempts: options?.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: options?.backoffDelay || 2000,
        },
        removeOnComplete: options?.removeOnComplete ?? true,
        removeOnFail: options?.removeOnFail ?? false,
        delay: options?.delay,
        priority: options?.priority,
      });
      return job.id!;
    }

    // IQueue: (name, data, options)
    const name = a as string;
    const data = b;
    const options = c as QueueJobOptions | undefined;
    const queue = this.getQueue('default');
    const jobOptions: any = {
      removeOnComplete: options?.removeOnComplete ?? true,
      removeOnFail: options?.removeOnFail ?? false,
    };
    if (options?.attempts !== undefined) jobOptions.attempts = options.attempts;
    if (options?.delay !== undefined) jobOptions.delay = options.delay;
    if (options?.priority !== undefined) jobOptions.priority = options.priority;
    if (options?.backoff !== undefined) jobOptions.backoff = options.backoff;

    const job = await queue.add(name, data, jobOptions);

    const queueJob: QueueJob<any> = {
      id: job.id || '',
      name: job.name,
      data: job.data,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
    };
    if (job.opts.delay !== undefined) queueJob.delay = job.opts.delay;
    if (job.opts.priority !== undefined) queueJob.priority = job.opts.priority;
    return queueJob;
  }

  // IQueue-compatible signature
  process<T = unknown>(name: string, handler: (job: QueueJob<T>) => Promise<void>): void;
  // Legacy signature: (queueName, jobName, handler(data))
  process<T = unknown>(queueName: string, jobName: string, handler: (data: T) => Promise<void>): Promise<void>;
  async process(...args: any[]): Promise<any> {
    const [a, b, c] = args;

    // Legacy
    if (typeof a === 'string' && typeof b === 'string' && typeof c === 'function') {
      const queueName = a;
      const jobName = b;
      const handler = c as (data: any) => Promise<void>;
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
            await handler(job.data);
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
      return;
    }

    // IQueue
    const name = a as string;
    const handler = b as (job: QueueJob<any>) => Promise<void>;
    // Register on default queue
    void this.process('default', name, async (data) => {
      await handler({
        id: '',
        name,
        data,
        attemptsMade: 0,
        timestamp: Date.now(),
      });
    });
  }

  async getJob(jobId: string): Promise<QueueJob | null> {
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(jobId);
      if (job) {
        const queueJob: QueueJob = {
          id: job.id || '',
          name: job.name,
          data: job.data,
          attemptsMade: job.attemptsMade,
          timestamp: job.timestamp,
        };
        if (job.opts.delay !== undefined) queueJob.delay = job.opts.delay;
        if (job.opts.priority !== undefined) queueJob.priority = job.opts.priority;
        return queueJob;
      }
    }
    return null;
  }

  async remove(jobId: string): Promise<void> {
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        return;
      }
    }
  }
}

