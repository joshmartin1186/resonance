import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get project
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, status, video_url, error, analysis_data, created_at, completed_at, user_id')
      .eq('id', projectId)
      .single()

    if (error || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Calculate progress based on status
    let progress = 0
    let stage = ''
    let eta: number | null = null

    switch (project.status) {
      case 'draft':
        progress = 0
        stage = 'Ready to start'
        break
      case 'queued':
        progress = 5
        stage = 'Waiting in queue'
        eta = 300 // 5 minutes estimate
        break
      case 'analyzing':
        progress = 30
        stage = 'Analyzing audio'
        eta = 180 // 3 minutes estimate
        break
      case 'generating':
        progress = 60
        stage = 'Generating visuals'
        eta = 120 // 2 minutes estimate
        break
      case 'completed':
        progress = 100
        stage = 'Complete'
        break
      case 'failed':
        progress = 0
        stage = 'Failed'
        break
    }

    return NextResponse.json({
      projectId: project.id,
      status: project.status,
      progress,
      stage,
      eta,
      videoUrl: project.video_url,
      error: project.error,
      hasAnalysis: !!project.analysis_data,
      createdAt: project.created_at,
      completedAt: project.completed_at
    })
  } catch (error) {
    console.error('Error getting project status:', error)
    return NextResponse.json(
      { error: 'Failed to get project status' },
      { status: 500 }
    )
  }
}
