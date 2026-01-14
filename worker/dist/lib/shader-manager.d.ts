import type { AudioFeatures } from './audio-analyzer.js';
export type ShaderType = 'perlin-noise' | 'particle-flow' | 'fractal-mandelbrot' | 'voronoi-cells' | 'reaction-diffusion';
export interface ShaderConfig {
    type: ShaderType;
    duration: number;
    audioFeatures: AudioFeatures;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
    intensity: number;
    parameters?: Record<string, number>;
}
export interface ShaderUniforms {
    iTime: number;
    iResolution: [number, number];
    iAudioEnergy: number;
    iAudioBass: number;
    iAudioMid: number;
    iAudioHigh: number;
    iAudioTransient: number;
    iColorPrimary: [number, number, number];
    iColorSecondary: [number, number, number];
    iColorAccent: [number, number, number];
    iIntensity: number;
}
/**
 * Load a GLSL shader from disk
 */
export declare function loadShader(type: ShaderType): string;
/**
 * Convert hex color to RGB array (0-1 range)
 */
export declare function hexToRGB(hex: string): [number, number, number];
/**
 * Extract audio features at a specific time
 */
export declare function getAudioFeaturesAtTime(audioFeatures: AudioFeatures, time: number): {
    energy: number;
    bass: number;
    mid: number;
    high: number;
    transient: number;
};
/**
 * Build FFmpeg filter string for shader rendering
 * Uses FFmpeg's GLSL filter (requires custom build) or approximation
 */
export declare function buildShaderFilter(config: ShaderConfig, resolution: '480p' | '720p' | '1080p' | '4K'): string;
/**
 * Get shader metadata
 */
export declare function getShaderInfo(type: ShaderType): {
    name: string;
    description: string;
    complexity: 'low' | 'medium' | 'high';
    audioReactive: boolean;
};
/**
 * List all available shaders
 */
export declare function listShaders(): ShaderType[];
//# sourceMappingURL=shader-manager.d.ts.map