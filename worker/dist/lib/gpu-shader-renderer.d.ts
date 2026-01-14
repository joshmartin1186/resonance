/**
 * GPU-accelerated shader renderer using headless Chrome + WebGL
 *
 * This renderer creates actual GPU-rendered shader videos instead of
 * using slow CPU-based FFmpeg geq filters.
 */
export interface ShaderRenderConfig {
    shaderType: 'perlin-noise' | 'particle-flow' | 'fractal-mandelbrot' | 'voronoi-cells' | 'reaction-diffusion';
    duration: number;
    width: number;
    height: number;
    fps: number;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
    intensity: number;
    audioFeatures?: {
        energyCurve: number[];
        bassCurve: number[];
        midCurve: number[];
        highCurve: number[];
    };
}
/**
 * Render a shader to a video file using WebGL
 */
export declare function renderShaderVideo(config: ShaderRenderConfig, outputPath: string): Promise<void>;
//# sourceMappingURL=gpu-shader-renderer.d.ts.map