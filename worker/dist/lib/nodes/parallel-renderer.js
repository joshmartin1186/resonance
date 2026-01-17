/**
 * Parallel Node Renderer - Multi-process frame rendering
 *
 * Strategy:
 * 1. Split frame range into chunks (one per CPU core)
 * 2. Spawn worker processes for each chunk
 * 3. Each worker renders its assigned frames independently
 * 4. Main process waits for all workers to complete
 * 5. Encode all frames to video
 *
 * Performance: 4-8x speedup on multi-core machines
 */
import { spawn, fork } from 'child_process';
import { join, dirname } from 'path';
import { mkdirSync } from 'fs';
import { cpus } from 'os';
import { fileURLToPath } from 'url';
// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Render timeline using parallel workers
 */
export async function renderTimelineParallel(options) {
    const { timeline, audioFeatures, outputDir, width, height, fps, onProgress } = options;
    const totalFrames = Math.floor(timeline.duration * fps);
    const workerCount = options.workerCount || Math.max(1, cpus().length - 1);
    console.log(`[Parallel Renderer] Using ${workerCount} workers for ${totalFrames} frames`);
    // Create output directory
    mkdirSync(outputDir, { recursive: true });
    // Split frames into chunks
    const framesPerWorker = Math.ceil(totalFrames / workerCount);
    const chunks = [];
    for (let i = 0; i < workerCount; i++) {
        const start = i * framesPerWorker;
        const end = Math.min(start + framesPerWorker, totalFrames);
        if (start < totalFrames) {
            chunks.push({ start, end, workerId: i });
        }
    }
    console.log(`[Parallel Renderer] Split into ${chunks.length} chunks:`);
    chunks.forEach(c => {
        console.log(`  Worker ${c.workerId}: frames ${c.start}-${c.end - 1} (${c.end - c.start} frames)`);
    });
    // Track progress across all workers
    const progress = new Array(chunks.length).fill(0);
    const updateProgress = () => {
        const completed = progress.reduce((a, b) => a + b, 0);
        if (onProgress) {
            onProgress(completed, totalFrames);
        }
    };
    // Spawn workers
    const workers = chunks.map(chunk => renderChunk(chunk, timeline, audioFeatures, outputDir, width, height, fps, (framesDone) => {
        progress[chunk.workerId] = framesDone;
        updateProgress();
    }));
    // Wait for all workers to complete
    await Promise.all(workers);
    console.log(`[Parallel Renderer] All workers complete! Rendered ${totalFrames} frames`);
}
/**
 * Render a chunk of frames in a separate process
 */
function renderChunk(chunk, timeline, audioFeatures, outputDir, width, height, fps, onProgress) {
    return new Promise((resolve, reject) => {
        // Spawn worker process
        const worker = fork(join(__dirname, 'render-worker.js'), [], {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc']
        });
        // Send work to worker
        worker.send({
            type: 'render',
            chunk,
            timeline,
            audioFeatures,
            outputDir,
            width,
            height,
            fps
        });
        // Handle progress updates
        worker.on('message', (msg) => {
            if (msg.type === 'progress') {
                onProgress(msg.framesDone);
            }
            else if (msg.type === 'complete') {
                worker.kill();
                resolve();
            }
            else if (msg.type === 'error') {
                worker.kill();
                reject(new Error(msg.error));
            }
        });
        // Handle errors
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                reject(new Error(`Worker ${chunk.workerId} exited with code ${code}`));
            }
        });
    });
}
/**
 * Encode frames to video (run after parallel rendering)
 */
export function encodeFramesToVideo(framesDir, audioPath, outputPath, fps) {
    return new Promise((resolve, reject) => {
        // CRITICAL FIX: Use -r flag AFTER input to set output framerate explicitly
        // This prevents FFmpeg from misinterpreting frame timing
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-framerate', String(fps),
            '-i', join(framesDir, 'frame_%06d.png'),
            '-i', audioPath,
            '-map', '0:v', // Map video from first input (frames)
            '-map', '1:a', // Map audio from second input (audio file)
            '-r', String(fps), // CRITICAL: Force output framerate
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '20',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-shortest', // Stop at shortest stream (audio)
            outputPath
        ]);
        let stderr = '';
        ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        ffmpeg.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`FFmpeg encoding failed: ${stderr}`));
            }
            else {
                resolve();
            }
        });
        ffmpeg.on('error', reject);
    });
}
//# sourceMappingURL=parallel-renderer.js.map