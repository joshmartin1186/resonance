/**
 * GPU Shader Video Renderer using headless-gl (Native WebGL)
 *
 * This replaces the Puppeteer-based renderer with native WebGL rendering
 * for better stability and performance.
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
}
/**
 * Main render function - renders shader video using headless WebGL
 */
export declare function renderShaderVideo(config: ShaderRenderConfig, outputPath: string): Promise<void>;
//# sourceMappingURL=headless-gl-renderer.d.ts.map