interface UploadResult {
    url: string;
    method: string;
    attempts: number;
}
/**
 * Bulletproof multi-layered upload system with automatic fallbacks
 */
export declare function uploadVideoWithFallbacks(outputPath: string, videoFileName: string, projectId: string): Promise<UploadResult>;
export {};
//# sourceMappingURL=upload-manager.d.ts.map