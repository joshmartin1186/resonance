import 'dotenv/config';
import { createDatabaseWorker } from './lib/queue.js';
import { processGenerationJob } from './jobs/generate.js';
console.log('🎬 Resonance Worker Starting...');
// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}
// Check mode
const USE_REDIS = !!process.env.REDIS_URL;
console.log(`📡 Mode: ${USE_REDIS ? 'Redis/BullMQ' : 'Database Polling'}`);
// Get concurrency from env or default to 1
const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '1', 10);
// Create the generation worker (database polling mode)
const worker = createDatabaseWorker(processGenerationJob, concurrency);
console.log(`✅ Worker started with concurrency ${concurrency}`);
// Graceful shutdown
async function shutdown() {
    console.log('\n🛑 Shutting down worker...');
    await worker.close();
    console.log('👋 Worker stopped');
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Keep the process running
console.log('🚀 Worker ready and waiting for jobs...');
console.log('   Polling database every 5 seconds for queued projects');
//# sourceMappingURL=index.js.map