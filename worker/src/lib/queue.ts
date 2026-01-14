import { Queue, Worker, Job } from 'bullmq'
import Redis from 'ioredis'

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is required')
}

// Create Redis connection
export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
})

// Queue names
export const QUEUE_NAMES = {
  GENERATION: 'generation',
  ANALYSIS: 'analysis',
  CLEANUP: 'cleanup'
} as const

// Job data types
export interface GenerationJobData {
  projectId: string
  userId: string
}

export interface AnalysisJobData {
  projectId: string
  audioUrl: string
}

export interface CleanupJobData {
  projectId: string
  tempFiles: string[]
}

// Create queues
export const generationQueue = new Queue<GenerationJobData>(QUEUE_NAMES.GENERATION, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: {
      age: 3600 * 24, // Keep completed jobs for 24 hours
      count: 100
    },
    removeOnFail: {
      age: 3600 * 24 * 7 // Keep failed jobs for 7 days
    }
  }
})

export const analysisQueue = new Queue<AnalysisJobData>(QUEUE_NAMES.ANALYSIS, {
  connection: redis
})

export const cleanupQueue = new Queue<CleanupJobData>(QUEUE_NAMES.CLEANUP, {
  connection: redis
})

// Helper to add a generation job
export async function queueGeneration(projectId: string, userId: string) {
  const job = await generationQueue.add(
    'generate-video',
    { projectId, userId },
    {
      jobId: `gen-${projectId}-${Date.now()}`
    }
  )

  console.log(`Queued generation job ${job.id} for project ${projectId}`)
  return job
}

// Helper to create a worker
export function createWorker<T, R = void>(
  queueName: string,
  processor: (job: Job<T>) => Promise<R>,
  concurrency = 1
) {
  const worker = new Worker<T>(queueName, processor, {
    connection: redis,
    concurrency
  })

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`)
  })

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err)
  })

  worker.on('error', (err) => {
    console.error('Worker error:', err)
  })

  return worker
}
