/**
 * Test the complete node system end-to-end
 *
 * This script:
 * 1. Analyzes audio file for deep features
 * 2. Generates visual timeline (test timeline, not AI for now)
 * 3. Renders frames using node system
 * 4. Encodes to video
 */

import { analyzeAudioDeep } from './src/lib/deep-audio-analyzer.js';
import { generateTestTimeline } from './src/lib/ai-orchestrator.js';
import { renderTimelineToFrames } from './src/lib/nodes/node-renderer.js';
import { spawn } from 'child_process';
import { join } from 'path';

async function testNodeSystem() {
  console.log('=== Node System Test ===\n');

  // Use a test audio file (you'll need to provide this)
  const audioPath = process.argv[2];
  if (!audioPath) {
    console.error('Usage: npx tsx test-node-system.ts <audio-file.mp3>');
    process.exit(1);
  }

  console.log(`Audio file: ${audioPath}\n`);

  // Step 1: Analyze audio
  console.log('[1/4] Analyzing audio...');
  const audioFeatures = await analyzeAudioDeep(audioPath);
  console.log(`✓ Audio analyzed: ${audioFeatures.duration.toFixed(1)}s, ${audioFeatures.tempo} BPM, ${audioFeatures.beats.length} beats\n`);

  // Step 2: Generate visual timeline
  console.log('[2/4] Generating visual timeline...');
  const timeline = generateTestTimeline(audioFeatures);
  console.log(`✓ Timeline generated: ${timeline.nodes.length} nodes\n`);

  // Log timeline structure
  console.log('Timeline structure:');
  timeline.nodes.forEach(node => {
    const nodeType = node.type;
    const nodeName = nodeType === 'generator'
      ? (node as any).generator.name
      : (node as any).effect.name;
    console.log(`  - ${node.id}: ${nodeType}/${nodeName} (${node.startTime.toFixed(1)}s - ${node.endTime.toFixed(1)}s)`);
  });
  console.log();

  // Step 3: Render frames
  console.log('[3/4] Rendering frames...');
  const framesDir = '/tmp/node-system-test-frames';
  const startTime = Date.now();

  await renderTimelineToFrames(timeline, audioFeatures, framesDir, {
    width: 1280,
    height: 720,
    fps: 30,
    onProgress: (frame, total) => {
      const percent = ((frame / total) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  Progress: ${percent}% (${frame}/${total} frames, ${elapsed}s elapsed)`);
    }
  });

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✓ Frames rendered in ${totalTime}s\n`);

  // Step 4: Encode to video
  console.log('[4/4] Encoding video...');
  const outputPath = '/tmp/node-system-test.mp4';

  await encodeFramesToVideo(framesDir, audioPath, outputPath, 30);
  console.log(`✓ Video encoded: ${outputPath}\n`);

  console.log('=== Test Complete ===');
  console.log(`Output: ${outputPath}`);
  console.log(`\nTo view: open ${outputPath}`);
}

/**
 * Encode frames to video with audio
 */
function encodeFramesToVideo(
  framesDir: string,
  audioPath: string,
  outputPath: string,
  fps: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y',
      '-framerate', String(fps),
      '-i', join(framesDir, 'frame_%06d.png'),
      '-i', audioPath,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      outputPath
    ]);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg failed: ${stderr}`));
      } else {
        resolve();
      }
    });

    ffmpeg.on('error', reject);
  });
}

// Run test
testNodeSystem().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
