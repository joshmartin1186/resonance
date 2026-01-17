/**
 * RunPod Serverless Handler
 *
 * Wraps the generation job for RunPod serverless execution
 */
interface RunPodInput {
    projectId: string;
}
interface RunPodOutput {
    success: boolean;
    videoUrl?: string;
    error?: string;
    stats?: {
        duration: number;
        framesRendered: number;
        nodesGenerated: number;
    };
}
/**
 * Main handler function called by RunPod
 */
export declare function handler(input: RunPodInput): Promise<RunPodOutput>;
export default handler;
//# sourceMappingURL=runpod-handler.d.ts.map