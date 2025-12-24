export interface ICache {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    increment(key: string, by?: number): Promise<number>;
    expire(key: string, seconds: number): Promise<void>;
}
//# sourceMappingURL=ICache.d.ts.map