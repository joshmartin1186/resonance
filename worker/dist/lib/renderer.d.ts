import type { AudioFeatures } from './audio-analyzer.js';
import { type ShaderType } from './shader-manager.js';
export interface RenderConfig {
    projectId: string;
    audioUrl: string;
    audioFeatures: AudioFeatures;
    footageUrls: string[];
    prompt: string;
    style: string;
    resolution: '480p' | '720p' | '1080p' | '4K';
    effectIntensity: number;
    footageVisibility: number;
}
export interface VisualPlan {
    segments: VisualSegment[];
    colorPalette: string[];
    mood: string;
    narrative: string;
}
export interface VisualSegment {
    startTime: number;
    endTime: number;
    effects: EffectApplication[];
    footageIndex?: number;
    generativeType?: GenerativeType;
    shaderType?: ShaderType;
    transitionIn?: TransitionType;
    transitionOut?: TransitionType;
}
export interface EffectApplication {
    effectSlug: string;
    ffmpegFilter: string;
    parameters: Record<string, number | boolean | string>;
    audioSync?: {
        parameter: string;
        feature: keyof AudioFeatures;
        mapping: 'linear' | 'exponential' | 'inverse';
        min: number;
        max: number;
    };
}
export type GenerativeType = 'particles' | 'waves' | 'geometric' | 'noise' | 'spectrum';
export type TransitionType = 'fade' | 'dissolve' | 'wipe' | 'zoom' | 'cut';
export interface RenderProgress {
    stage: 'preparing' | 'processing_footage' | 'applying_effects' | 'compositing' | 'finalizing';
    percent: number;
    message: string;
}
type ProgressCallback = (progress: RenderProgress) => void;
/**
 * Main rendering pipeline
 */
export declare function renderVideo(config: RenderConfig, visualPlan: VisualPlan, onProgress?: ProgressCallback): Promise<string>;
/**
 * Generate a visual plan from audio features
 * This is a placeholder for AI orchestration
 */
export declare function generateVisualPlan(audioFeatures: AudioFeatures, prompt: string, style: string, footageCount: number): VisualPlan;
/**
 * Cleanup temporary files
 */
export declare function cleanupRender(projectId: string): void;
export {};
//# sourceMappingURL=renderer.d.ts.map