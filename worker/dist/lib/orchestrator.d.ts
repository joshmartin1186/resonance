import type { AudioFeatures } from './audio-analyzer.js';
export interface FootageInfo {
    id: string;
    fileType: 'video' | 'image';
    duration?: number;
    dominantColors?: string[];
    motionLevel?: 'static' | 'low' | 'medium' | 'high';
    brightness?: 'dark' | 'medium' | 'bright';
}
export interface OrchestrationInput {
    audioFeatures: AudioFeatures;
    prompt: string;
    style: 'cinematic' | 'psychedelic' | 'minimal' | 'organic' | 'abstract';
    footage: FootageInfo[];
    effectIntensity: number;
    footageVisibility: number;
    seed?: string;
    anthropicApiKey?: string;
}
export interface VisualSegment {
    startTime: number;
    endTime: number;
    musicalContext: string;
    emotionalTone: string;
    description: string;
    effects: EffectAssignment[];
    footageIndex?: number;
    generativeType?: 'particles' | 'waves' | 'geometric' | 'noise' | 'spectrum';
    shaderType?: 'perlin-noise' | 'particle-flow' | 'fractal-mandelbrot' | 'voronoi-cells' | 'reaction-diffusion';
    transition: {
        type: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'zoom';
        duration: number;
    };
}
export interface EffectAssignment {
    effectSlug: string;
    intensity: number;
    audioSync?: {
        parameter: string;
        feature: keyof AudioFeatures | 'energy' | 'transients';
        mapping: 'linear' | 'exponential' | 'inverse' | 'threshold';
        sensitivity: number;
    };
}
export interface VisualPlan {
    narrative: {
        theme: string;
        moodProgression: string[];
        keyMoments: string[];
    };
    colorPalette: {
        primary: string;
        secondary: string;
        accent: string;
        mood: 'warm' | 'cool' | 'neutral' | 'vibrant';
    };
    segments: VisualSegment[];
    globalEffects: EffectAssignment[];
}
/**
 * Generate a visual plan using Claude
 */
export declare function generateVisualPlan(input: OrchestrationInput): Promise<VisualPlan>;
/**
 * Generate a deterministic seed
 */
export declare function generateSeed(): string;
/**
 * Create a seeded random number generator
 */
export declare function createSeededRandom(seed: string): () => number;
//# sourceMappingURL=orchestrator.d.ts.map