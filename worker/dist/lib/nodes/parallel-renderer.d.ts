/**
 * Parallel Node Renderer - Multi-process frame rendering
 *
 * Strategy:
 * 1. Split frame range into chunks (one per CPU core)
 * 2. Spawn worker processes for each chunk
 * 3. Each worker renders its assigned frames independently
 * 4. Main process waits for all workers to complete
 * 5. Encode all frames to video
 *
 * Performance: 4-8x speedup on multi-core machines
 */
import { VisualTimeline } from './types.js';
import { DeepAudioFeatures } from '../deep-audio-analyzer.js';
export interface ParallelRenderOptions {
    timeline: VisualTimeline;
    audioFeatures: DeepAudioFeatures;
    outputDir: string;
    width: number;
    height: number;
    fps: number;
    workerCount?: number;
    onProgress?: (completed: number, total: number) => void;
}
/**
 * Render timeline using parallel workers
 */
export declare function renderTimelineParallel(options: ParallelRenderOptions): Promise<void>;
/**
 * Encode frames to video (run after parallel rendering)
 */
export declare function encodeFramesToVideo(framesDir: string, audioPath: string, outputPath: string, fps: number): Promise<void>;
//# sourceMappingURL=parallel-renderer.d.ts.map