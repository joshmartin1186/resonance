/**
 * Effect Nodes - Transform and enhance visuals
 *
 * Effects take input from generators or other effects and apply transformations
 * All effects are implemented as post-processing shaders
 */
import { EffectNode, NodeRenderContext } from './types.js';
/**
 * Effect 1: Blur
 */
export declare function renderBlur(node: EffectNode, ctx: NodeRenderContext): void;
/**
 * Effect 2: Bloom (glow effect)
 */
export declare function renderBloom(node: EffectNode, ctx: NodeRenderContext): void;
/**
 * Effect 3: Kaleidoscope
 */
export declare function renderKaleidoscope(node: EffectNode, ctx: NodeRenderContext): void;
/**
 * Effect 4: Color Grade (HSB adjustment)
 */
export declare function renderColorGrade(node: EffectNode, ctx: NodeRenderContext): void;
/**
 * Effect 5: Feedback (video feedback loop effect)
 */
export declare function renderFeedback(node: EffectNode, ctx: NodeRenderContext): void;
/**
 * Effect: Chromatic aberration (RGB channel offset)
 */
export declare function renderChromaticAberration(node: EffectNode, ctx: NodeRenderContext): void;
/**
 * Effect: Film grain
 */
export declare function renderGrain(node: EffectNode, ctx: NodeRenderContext): void;
/**
 * Render an effect node
 */
export declare function renderEffect(node: EffectNode, ctx: NodeRenderContext): void;
//# sourceMappingURL=effects.d.ts.map