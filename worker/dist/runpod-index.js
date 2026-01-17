/**
 * RunPod Serverless Entry Point
 *
 * This file is the entry point for RunPod serverless execution.
 * It wraps the generation job handler for RunPod's execution model.
 */
import { handler } from './runpod-handler.js';
// RunPod calls this function with the input and expects output
export { handler };
// Also make it the default export for RunPod
export default handler;
// If run directly, start a simple HTTP server for RunPod
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('[RunPod] Worker initialized and ready for requests');
    console.log('[RunPod] Environment:', {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
        anthropicKey: process.env.ANTHROPIC_API_KEY ? 'Set' : 'Missing',
        nodeEnv: process.env.NODE_ENV
    });
}
//# sourceMappingURL=runpod-index.js.map