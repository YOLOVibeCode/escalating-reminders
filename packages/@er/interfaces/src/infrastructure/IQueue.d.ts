export interface IQueue {
    add<T = unknown>(name: string, data: T, options?: QueueJobOptions): Promise<QueueJob<T>>;
    process<T = unknown>(name: string, handler: (job: QueueJob<T>) => Promise<void>): void;
    getJob(jobId: string): Promise<QueueJob | null>;
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
//# sourceMappingURL=IQueue.d.ts.map