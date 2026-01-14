export interface FFmpegOptions {
    inputPath: string;
    outputPath: string;
    filters: string[];
    duration?: number;
    startTime?: number;
    audioPath?: string;
    resolution?: '480p' | '720p' | '1080p' | '4K';
    fps?: number;
    codec?: 'h264' | 'h265' | 'vp9';
    quality?: number;
}
export interface FFmpegProgress {
    frame: number;
    fps: number;
    time: number;
    speed: number;
    percent: number;
}
type ProgressCallback = (progress: FFmpegProgress) => void;
/**
 * Execute FFmpeg command with progress tracking
 */
export declare function runFFmpeg(options: FFmpegOptions, onProgress?: ProgressCallback): Promise<void>;
/**
 * Build a filter chain from effect instances
 */
export declare function buildFilterChain(effects: {
    filter: string;
    parameters: Record<string, number | boolean | string>;
}[]): string[];
/**
 * Download a file from URL to local path
 */
export declare function downloadFile(url: string, outputPath: string): Promise<void>;
/**
 * Get video metadata using ffprobe
 */
export declare function getVideoMetadata(inputPath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
}>;
/**
 * Concatenate multiple video files
 */
export declare function concatenateVideos(inputPaths: string[], outputPath: string, onProgress?: ProgressCallback): Promise<void>;
/**
 * Create a still image video from a single image
 */
export declare function imageToVideo(imagePath: string, outputPath: string, duration: number, options?: Partial<FFmpegOptions>): Promise<void>;
export {};
//# sourceMappingURL=ffmpeg.d.ts.map