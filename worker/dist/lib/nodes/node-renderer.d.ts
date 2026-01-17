/**
 * Node Renderer - Multi-pass rendering pipeline
 *
 * Renders a visual timeline by:
 * 1. Rendering all active generators to separate buffers
 * 2. Applying effects in sequence
 * 3. Compositing layers together
 * 4. Outputting final frame
 */
import { VisualTimeline } from './types.js';
import { DeepAudioFeatures } from '../deep-audio-analyzer.js';
/**
 * Render timeline to video frames
 */
export declare function renderTimelineToFrames(timeline: VisualTimeline, audioFeatures: DeepAudioFeatures, outputDir: string, options?: {
    width?: number;
    height?: number;
    fps?: number;
    onProgress?: (frame: number, total: number) => void;
}): Promise<void>;
//# sourceMappingURL=node-renderer.d.ts.map