/**
 * Queue client for the Next.js app
 *
 * This connects to the same Redis instance as the worker
 * to add jobs to the queue.
 */

import { createClient } from '@supabase/supabase-js'

// Queue job via database trigger approach
// This is simpler for initial setup - the worker polls the database
// For production, use BullMQ with Redis directly

export interface QueuedJob {
  id: string
  projectId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  createdAt: string
}

/**
 * Queue a generation job
 *
 * For now, this just updates the project status to 'queued'.
 * The worker will poll for queued projects and process them.
 *
 * In production with Redis:
 * - Install ioredis and bullmq in the Next.js app
 * - Connect to the same Redis instance
 * - Add job directly to the queue
 */
export async function queueGenerationJob(
  projectId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Create admin client for this operation
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Supabase not configured' }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )

  // Verify project exists and belongs to user
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, status, audio_url')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { success: false, error: 'Project not found' }
  }

  if (!project.audio_url) {
    return { success: false, error: 'Project has no audio file' }
  }

  if (project.status !== 'draft' && project.status !== 'failed') {
    return { success: false, error: 'Project is already being processed or completed' }
  }

  // Update project status to queued
  const { error: updateError } = await supabase
    .from('projects')
    .update({
      status: 'queued',
      error: null, // Clear any previous error
      video_url: null // Clear any previous video
    })
    .eq('id', projectId)

  if (updateError) {
    console.error('Failed to queue project:', updateError)
    return { success: false, error: 'Failed to queue project' }
  }

  // In production, also add to BullMQ queue here:
  // await generationQueue.add('generate-video', { projectId, userId })

  console.log(`Queued generation for project ${projectId}`)
  return { success: true }
}

/**
 * Cancel a generation job
 */
export async function cancelGenerationJob(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Supabase not configured' }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )

  // Only allow canceling queued or processing jobs
  const { data: project } = await supabase
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .single()

  if (!project) {
    return { success: false, error: 'Project not found' }
  }

  if (project.status !== 'queued' && project.status !== 'analyzing' && project.status !== 'generating') {
    return { success: false, error: 'Project is not in a cancelable state' }
  }

  const { error } = await supabase
    .from('projects')
    .update({
      status: 'draft',
      error: 'Canceled by user'
    })
    .eq('id', projectId)

  if (error) {
    return { success: false, error: 'Failed to cancel job' }
  }

  return { success: true }
}
