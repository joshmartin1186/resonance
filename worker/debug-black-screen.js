/**
 * Debug why frames are black
 */

import { generateEnhancedTimeline } from './dist/lib/ai-orchestrator-enhanced.js';

// Mock audio features
const mockAudioFeatures = {
  duration: 10,
  tempo: 180,
  beats: [
    { time: 0.33, confidence: 0.8 },
    { time: 0.66, confidence: 0.8 },
    { time: 1.0, confidence: 0.8 }
  ],
  rms: Array(300).fill(0.5),
  bass: Array(300).fill(0.6),
  mid: Array(300).fill(0.4),
  high: Array(300).fill( 0.3),
  spectralCentroid: Array(300).fill(2000),
  spectralFlux: Array(300).fill(0.2)
};

console.log('Generating timeline for 10-second test...\n');
const timeline = generateEnhancedTimeline(mockAudioFeatures);

console.log(`Generated ${timeline.nodes.length} nodes\n`);

// Check nodes active at t=2s
const testTime = 2.0;
let activeAtT2 = 0;

timeline.nodes.forEach((node, i) => {
  if (node.startTime <= testTime && node.endTime > testTime) {
    activeAtT2++;
    if (i < 10) {
      console.log(`Node ${i}: ${node.type} - ${node.generator?.name || node.effect?.name || 'unknown'}`);
      console.log(`  Time: ${node.startTime.toFixed(2)}s - ${node.endTime.toFixed(2)}s`);
      console.log(`  Fade in: ${node.fadeIn || 0}s, Fade out: ${node.fadeOut || 0}s`);
      if (node.type === 'generator') {
        console.log(`  Generator params:`, Object.keys(node.generator || {}).filter(k => k !== 'name'));
      }
      console.log('');
    }
  }
});

console.log(`\nTotal nodes active at t=${testTime}s: ${activeAtT2}`);
console.log(`Background color: ${timeline.backgroundColor.value}`);
