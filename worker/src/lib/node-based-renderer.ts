/**
 * Node-Based Renderer Integration
 *
 * Replaces simple shader rendering with full node system
 */

import { analyzeAudioDeep } from './deep-audio-analyzer.js';
import { generateVisualTimeline, generateTestTimeline } from './ai-orchestrator.js';
import { generateEnhancedTimeline } from './ai-orchestrator-enhanced.js';
import { renderTimelineToFrames } from './nodes/node-renderer.js';
import { renderTimelineParallel, encodeFramesToVideo as encodeParallel } from './nodes/parallel-renderer.js';
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { cpus } from 'os';

export interface NodeRenderOptions {
  audioPath: string;
  outputPath: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  intensity?: number;
  useAI?: boolean; // If true, use AI orchestrator; if false, use test timeline
  parallel?: boolean; // If true, use parallel rendering (4-8x faster)
}

/**
 * Render video using the node system
 */
export async function renderNodeBasedVideo(options: NodeRenderOptions): Promise<void> {
  console.log('[Node Renderer] Starting node-based rendering...');

  const {
    audioPath,
    outputPath,
    duration,
    width,
    height,
    fps,
    useAI = false
  } = options;

  // Step 1: Analyze audio
  console.log('[Node Renderer] Analyzing audio...');
  const audioFeatures = await analyzeAudioDeep(audioPath);
  console.log(`[Node Renderer] Audio analyzed: ${audioFeatures.duration.toFixed(1)}s, ${audioFeatures.tempo} BPM, ${audioFeatures.beats.length} beats`);

  // Step 2: Generate visual timeline
  console.log('[Node Renderer] Generating visual timeline...');
  const timeline = useAI
    ? await generateVisualTimeline(audioFeatures)
    : generateEnhancedTimeline(audioFeatures); // Use enhanced timeline for 20x complexity

  console.log(`[Node Renderer] Timeline generated: ${timeline.nodes.length} nodes`);

  // Step 3: Render frames (parallel or sequential)
  const framesDir = join('/tmp', `node-frames-${Date.now()}`);
  mkdirSync(framesDir, { recursive: true });

  const startTime = Date.now();
  let lastProgress = 0;

  const parallel = options.parallel ?? true; // Default to parallel rendering

  if (parallel) {
    console.log(`[Node Renderer] Rendering frames (PARALLEL - ${cpus().length - 1} workers)...`);
    await renderTimelineParallel({
      timeline,
      audioFeatures,
      outputDir: framesDir,
      width,
      height,
      fps,
      onProgress: (completed, total) => {
        const percent = Math.floor((completed / total) * 100);
        if (percent >= lastProgress + 10) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const fps_rate = (completed / ((Date.now() - startTime) / 1000)).toFixed(1);
          console.log(`[Node Renderer] Progress: ${percent}% (${completed}/${total} frames, ${elapsed}s elapsed, ${fps_rate} FPS)`);
          lastProgress = percent;
        }
      }
    });
  } else {
    console.log('[Node Renderer] Rendering frames (SEQUENTIAL)...');
    await renderTimelineToFrames(timeline, audioFeatures, framesDir, {
      width,
      height,
      fps,
      onProgress: (frame, total) => {
        const percent = Math.floor((frame / total) * 100);
        if (percent >= lastProgress + 10) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`[Node Renderer] Progress: ${percent}% (${frame}/${total} frames, ${elapsed}s elapsed)`);
          lastProgress = percent;
        }
      }
    });
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalFrames = Math.floor(timeline.duration * fps);
  const avgFPS = (totalFrames / (Date.now() - startTime) * 1000).toFixed(1);
  console.log(`[Node Renderer] Frames rendered in ${totalTime}s (average ${avgFPS} FPS)`);

  // Step 4: Encode to video
  console.log('[Node Renderer] Encoding video...');
  if (parallel) {
    await encodeParallel(framesDir, audioPath, outputPath, fps);
  } else {
    await encodeFramesToVideo(framesDir, audioPath, outputPath, fps);
  }
  console.log(`[Node Renderer] Video complete: ${outputPath}`);
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
      '-map', '0:v',
      '-map', '1:a',
      '-r', String(fps),  // Force output framerate
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
