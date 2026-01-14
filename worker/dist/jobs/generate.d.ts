import { Job, GenerationJobData } from '../lib/queue.js';
import { type VisualPlan } from '../lib/orchestrator.js';
/**
 * Process a video generation job
 *
 * Pipeline:
 * 1. Fetch project data
 * 2. Analyze audio
 * 3. Generate visual plan (Claude AI orchestration)
 * 4. Render video (FFmpeg + effects)
 * 5. Upload to storage
 * 6. Update project with result
 */
export declare function processGenerationJob(job: Job<GenerationJobData>): Promise<{
    success: boolean;
    videoUrl: string;
    seed: string;
    duration: number;
    visualPlan: VisualPlan;
}>;
//# sourceMappingURL=generate.d.ts.map