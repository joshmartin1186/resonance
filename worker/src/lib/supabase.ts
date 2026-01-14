import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is required')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

export type ProjectStatus = 'draft' | 'queued' | 'analyzing' | 'generating' | 'completed' | 'failed'

export interface Project {
  id: string
  name: string
  prompt: string
  audio_url: string
  footage_urls: string[]
  style: string
  status: ProjectStatus
  video_url: string | null
  error: string | null
  seed: string | null
  analysis_data: Record<string, unknown> | null
  created_at: string
  completed_at: string | null
  user_id: string
  organization_id: string | null
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  extra?: Partial<Project>
) {
  const { error } = await supabase
    .from('projects')
    .update({
      status,
      ...extra,
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
    })
    .eq('id', projectId)

  if (error) {
    console.error('Failed to update project status:', error)
    throw error
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) {
    console.error('Failed to get project:', error)
    return null
  }

  return data
}
