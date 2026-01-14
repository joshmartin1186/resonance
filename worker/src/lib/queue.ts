/**
 * Queue system with two modes:
 * 1. Local/Dev: Database polling (no Redis required)
 * 2. Production: BullMQ with Redis (optional, for scale)
 */

import { supabase } from './supabase.js'

// Check if Redis is configured
const USE_REDIS = !!process.env.REDIS_URL

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

// Mock Job interface for compatibility
export interface Job<T = unknown> {
  id: string
  data: T
  updateProgress: (progress: number) => Promise<void>
}

// Queue names
export const QUEUE_NAMES = {
  GENERATION: 'generation',
  ANALYSIS: 'analysis',
  CLEANUP: 'cleanup'
} as const

/**
 * Database polling worker (no Redis needed)
 * Polls Supabase for queued projects and processes them
 */
export class DatabasePoller {
  private isRunning = false
  private pollInterval: NodeJS.Timeout | null = null
  private processor: ((job: Job<GenerationJobData>) => Promise<unknown>) | null = null
  private concurrency: number

  constructor(concurrency = 1) {
    this.concurrency = concurrency
  }

  /**
   * Start polling for jobs
   */
  start(processor: (job: Job<GenerationJobData>) => Promise<unknown>) {
    this.processor = processor
    this.isRunning = true
    this.poll()

    // Poll every 5 seconds
    this.pollInterval = setInterval(() => this.poll(), 5000)

    console.log('📡 Database poller started')
  }

  /**
   * Stop polling
   */
  async close() {
    this.isRunning = false
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    console.log('Database poller stopped')
  }

  /**
   * Poll for queued jobs
   */
  private async poll() {
    if (!this.isRunning || !this.processor) return

    try {
      // Find queued projects
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, user_id')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(this.concurrency)

      if (error) {
        console.error('Failed to poll for jobs:', error)
        return
      }

      if (!projects || projects.length === 0) {
        return // No jobs to process
      }

      // Process each project
      for (const project of projects) {
        // Mark as processing immediately to prevent double-processing
        const { error: updateError } = await supabase
          .from('projects')
          .update({ status: 'analyzing' })
          .eq('id', project.id)
          .eq('status', 'queued') // Only update if still queued

        if (updateError) {
          console.error(`Failed to claim project ${project.id}:`, updateError)
          continue
        }

        console.log(`🎬 Processing project ${project.id}`)

        // Create a mock job object
        const job: Job<GenerationJobData> = {
          id: `db-${project.id}-${Date.now()}`,
          data: {
            projectId: project.id,
            userId: project.user_id
          },
          updateProgress: async (progress: number) => {
            // Update progress in database (optional)
            await supabase
              .from('projects')
              .update({
                analysis_data: {
                  progress,
                  updatedAt: new Date().toISOString()
                }
              })
              .eq('id', project.id)
          }
        }

        // Process the job
        try {
          await this.processor(job)
          console.log(`✅ Project ${project.id} completed`)
        } catch (err) {
          console.error(`❌ Project ${project.id} failed:`, err)
          // Status is already updated by the processor on failure
        }
      }
    } catch (err) {
      console.error('Poll error:', err)
    }
  }
}

// Redis/BullMQ exports (only used if REDIS_URL is set)
let redis: unknown = null
let generationQueue: unknown = null

if (USE_REDIS) {
  // Dynamic import for Redis (only when needed)
  const loadRedis = async () => {
    const Redis = (await import('ioredis')).default
    const { Queue, Worker } = await import('bullmq')

    redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null
    })

    generationQueue = new Queue<GenerationJobData>(QUEUE_NAMES.GENERATION, {
      connection: redis as never,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    })

    return { redis, generationQueue, Worker }
  }

  loadRedis().catch(console.error)
}

export { redis, generationQueue }

// Helper to create a worker (database polling mode)
export function createDatabaseWorker(
  processor: (job: Job<GenerationJobData>) => Promise<unknown>,
  concurrency = 1
): DatabasePoller {
  const poller = new DatabasePoller(concurrency)
  poller.start(processor)
  return poller
}
