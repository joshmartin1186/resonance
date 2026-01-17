/**
 * AI Orchestrator - Generates visual timelines based on audio analysis
 *
 * This is the brain of the system:
 * 1. Analyzes deep audio features (beats, tempo, frequency, energy)
 * 2. Identifies musical structure (intro, verse, chorus, bridge, outro)
 * 3. Generates 100+ unique visual states that react to the music
 * 4. Commands the node system to create infinite complexity
 *
 * Uses Claude API to generate sophisticated visual timelines
 */
import { DeepAudioFeatures } from './deep-audio-analyzer.js';
import { VisualTimeline } from './nodes/types.js';
/**
 * Generate a visual timeline for a song
 */
export declare function generateVisualTimeline(audioFeatures: DeepAudioFeatures, songName?: string): Promise<VisualTimeline>;
/**
 * Preview: Generate a simple test timeline (for testing without API calls)
 */
export declare function generateTestTimeline(features: DeepAudioFeatures): VisualTimeline;
//# sourceMappingURL=ai-orchestrator.d.ts.map