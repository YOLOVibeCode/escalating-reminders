/**
 * Interface for job queue operations.
 */
export interface IQueue {
  /**
   * Add a job to the queue.
   */
  add<T = unknown>(name: string, data: T, options?: QueueJobOptions): Promise<QueueJob<T>>;

  /**
   * Process jobs from the queue.
   */
  process<T = unknown>(
    name: string,
    handler: (job: QueueJob<T>) => Promise<void>,
  ): void;

  /**
   * Get job by ID.
   */
  getJob(jobId: string): Promise<QueueJob | null>;

  /**
   * Remove a job from the queue.
   */
  remove(jobId: string): Promise<void>;
}

export interface QueueJob<T = unknown> {
  id: string;
  name: string;
  data: T;
  attemptsMade: number;
  timestamp: number;
  delay?: number;
  priority?: number;
}

export interface QueueJobOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

