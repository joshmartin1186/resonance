/**
 * Queue system with two modes:
 * 1. Local/Dev: Database polling (no Redis required)
 * 2. Production: BullMQ with Redis (optional, for scale)
 */
export interface GenerationJobData {
    projectId: string;
    userId: string;
}
export interface AnalysisJobData {
    projectId: string;
    audioUrl: string;
}
export interface CleanupJobData {
    projectId: string;
    tempFiles: string[];
}
export interface Job<T = unknown> {
    id: string;
    data: T;
    updateProgress: (progress: number) => Promise<void>;
}
export declare const QUEUE_NAMES: {
    readonly GENERATION: "generation";
    readonly ANALYSIS: "analysis";
    readonly CLEANUP: "cleanup";
};
/**
 * Database polling worker (no Redis needed)
 * Polls Supabase for queued projects and processes them
 */
export declare class DatabasePoller {
    private isRunning;
    private pollInterval;
    private processor;
    private concurrency;
    constructor(concurrency?: number);
    /**
     * Start polling for jobs
     */
    start(processor: (job: Job<GenerationJobData>) => Promise<unknown>): void;
    /**
     * Stop polling
     */
    close(): Promise<void>;
    /**
     * Poll for queued jobs
     */
    private poll;
}
declare let redis: unknown;
declare let generationQueue: unknown;
export { redis, generationQueue };
export declare function createDatabaseWorker(processor: (job: Job<GenerationJobData>) => Promise<unknown>, concurrency?: number): DatabasePoller;
//# sourceMappingURL=queue.d.ts.map