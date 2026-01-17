/**
 * Generator Nodes - Create base visual patterns
 *
 * Each generator is a GLSL shader that creates procedural graphics
 * Parameters are controlled by the AI orchestrator and can be audio-reactive
 */
import { GeneratorNode, NodeRenderContext } from './types.js';
/**
 * Generator 1: Perlin Noise (organic flowing patterns)
 */
export declare function renderPerlinNoise(node: GeneratorNode, ctx: NodeRenderContext): void;
/**
 * Generator 2: Particle System
 */
export declare function renderParticles(node: GeneratorNode, ctx: NodeRenderContext): void;
/**
 * Generator 3: Fractal (Mandelbrot-style)
 */
export declare function renderFractal(node: GeneratorNode, ctx: NodeRenderContext): void;
/**
 * Generator 4: Voronoi (organic cells)
 */
export declare function renderVoronoi(node: GeneratorNode, ctx: NodeRenderContext): void;
/**
 * Generator 5: Flow Field (fluid-like motion)
 */
export declare function renderFlowField(node: GeneratorNode, ctx: NodeRenderContext): void;
/**
 * Generator: Geometric shapes (rotating polygons)
 */
export declare function renderGeometric(node: GeneratorNode, ctx: NodeRenderContext): void;
/**
 * Generator: Radial waves (expanding circles)
 */
export declare function renderRadialWaves(node: GeneratorNode, ctx: NodeRenderContext): void;
/**
 * Generator: Solid color (for flashes/backgrounds)
 */
export declare function renderSolidColor(node: GeneratorNode, ctx: NodeRenderContext): void;
/**
 * Render a generator node
 */
export declare function renderGenerator(node: GeneratorNode, ctx: NodeRenderContext): void;
//# sourceMappingURL=generators.d.ts.map