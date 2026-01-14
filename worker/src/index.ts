import 'dotenv/config'
import { createWorker, QUEUE_NAMES, redis } from './lib/queue.js'
import { processGenerationJob } from './jobs/generate.js'

console.log('🎬 Resonance Worker Starting...')

// Validate required environment variables
const requiredEnvVars = ['REDIS_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

// Get concurrency from env or default to 2
const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '2', 10)

// Create the generation worker
const generationWorker = createWorker(
  QUEUE_NAMES.GENERATION,
  processGenerationJob,
  concurrency
)

console.log(`✅ Generation worker started with concurrency ${concurrency}`)
console.log(`📡 Connected to Redis`)

// Graceful shutdown
async function shutdown() {
  console.log('\n🛑 Shutting down worker...')

  await generationWorker.close()
  await redis.quit()

  console.log('👋 Worker stopped')
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Keep the process running
console.log('🚀 Worker ready and waiting for jobs...')

// Health check - log queue stats every 30 seconds
setInterval(async () => {
  try {
    const waitingCount = await redis.llen(`bull:${QUEUE_NAMES.GENERATION}:wait`)
    const activeCount = await redis.llen(`bull:${QUEUE_NAMES.GENERATION}:active`)

    if (waitingCount > 0 || activeCount > 0) {
      console.log(`📊 Queue status: ${waitingCount} waiting, ${activeCount} active`)
    }
  } catch {
    // Ignore errors in health check
  }
}, 30000)
