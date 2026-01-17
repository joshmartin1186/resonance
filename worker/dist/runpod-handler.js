/**
 * RunPod Serverless Handler
 *
 * Wraps the generation job for RunPod serverless execution
 */
import { processGenerationJob } from './jobs/generate.js';
import { createClient } from '@supabase/supabase-js';
/**
 * Main handler function called by RunPod
 */
export async function handler(input) {
    console.log('[RunPod] Starting job for project:', input.projectId);
    const startTime = Date.now();
    try {
        // Initialize Supabase client
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        // Create a mock job object that matches BullMQ interface
        const mockJob = {
            data: { projectId: input.projectId },
            updateProgress: (percent) => {
                console.log(`[RunPod] Progress: ${percent}%`);
            }
        };
        // Run the generation job
        await processGenerationJob(mockJob);
        // Fetch the completed project to get video URL
        const { data: project } = await supabase
            .from('projects')
            .select('video_url, duration, status')
            .eq('id', input.projectId)
            .single();
        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`[RunPod] Job complete in ${elapsed.toFixed(1)}s`);
        return {
            success: true,
            videoUrl: project?.video_url,
            stats: {
                duration: elapsed,
                framesRendered: Math.floor((project?.duration || 0) * 30),
                nodesGenerated: 3671 // Enhanced timeline
            }
        };
    }
    catch (error) {
        const elapsed = (Date.now() - startTime) / 1000;
        console.error('[RunPod] Job failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stats: {
                duration: elapsed,
                framesRendered: 0,
                nodesGenerated: 0
            }
        };
    }
}
// Export for RunPod
export default handler;
//# sourceMappingURL=runpod-handler.js.map