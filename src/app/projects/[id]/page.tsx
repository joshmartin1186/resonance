import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProjectActions, ProjectHeaderActions } from '@/components/project-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info'; description: string }> = {
  draft: {
    label: 'Draft',
    variant: 'default',
    description: 'Project created, waiting to start generation'
  },
  queued: {
    label: 'Queued',
    variant: 'info',
    description: 'Your project is in the queue and will start processing soon'
  },
  analyzing: {
    label: 'Analyzing Audio',
    variant: 'info',
    description: 'Our AI is analyzing your music to understand its structure and emotion'
  },
  generating: {
    label: 'Generating',
    variant: 'warning',
    description: 'Creating your unique visual narrative based on the audio analysis'
  },
  completed: {
    label: 'Completed',
    variant: 'success',
    description: 'Your video is ready to view and download'
  },
  failed: {
    label: 'Failed',
    variant: 'default',
    description: 'Something went wrong during generation'
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get project
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !project) {
    notFound()
  }

  const status = statusConfig[project.status] || statusConfig.draft

  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E0DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-[#2A2621]">
                Resonance
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="text-sm font-medium text-[#5A534C] hover:text-[#2A2621]">
                  Dashboard
                </Link>
                <Link href="/projects" className="text-sm font-medium text-[#C45D3A]">
                  Projects
                </Link>
                <Link href="/settings" className="text-sm font-medium text-[#5A534C] hover:text-[#2A2621]">
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#5A534C]">{user.email}</span>
              <form action="/auth/signout" method="post">
                <Button variant="ghost" size="sm" type="submit">
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/projects" className="text-sm text-[#5A534C] hover:text-[#2A2621] flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Link>
        </div>

        {/* Project Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#2A2621]">{project.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-[#5A534C] mt-1">
              Created {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          <ProjectHeaderActions
            projectId={project.id}
            status={project.status}
            videoUrl={project.video_url}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video/Preview Area */}
            <Card>
              <CardContent className="pt-6">
                {project.status === 'completed' && project.video_url ? (
                  <video
                    src={project.video_url}
                    controls
                    className="w-full aspect-video rounded-lg bg-black"
                  />
                ) : (
                  <div className="aspect-video bg-[#F0EDE8] rounded-lg flex flex-col items-center justify-center">
                    {project.status === 'draft' && (
                      <>
                        <svg className="w-16 h-16 text-[#8A827A] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[#5A534C] font-medium">Ready to Generate</p>
                        <p className="text-sm text-[#8A827A] mt-1">Click &quot;Start Generation&quot; to create your video</p>
                      </>
                    )}
                    {(project.status === 'queued' || project.status === 'analyzing' || project.status === 'generating') && (
                      <>
                        <div className="w-16 h-16 rounded-full border-4 border-[#E2E0DB] border-t-[#C45D3A] animate-spin mb-4" />
                        <p className="text-[#5A534C] font-medium">{status.label}</p>
                        <p className="text-sm text-[#8A827A] mt-1 text-center max-w-sm">{status.description}</p>
                      </>
                    )}
                    {project.status === 'failed' && (
                      <>
                        <svg className="w-16 h-16 text-[#C2410C] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[#C2410C] font-medium">Generation Failed</p>
                        <p className="text-sm text-[#8A827A] mt-1">{project.error || 'An unexpected error occurred'}</p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audio Player */}
            {project.audio_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Audio Track</CardTitle>
                </CardHeader>
                <CardContent>
                  <audio
                    src={project.audio_url}
                    controls
                    className="w-full"
                  />
                </CardContent>
              </Card>
            )}

            {/* Prompt/Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visual Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#5A534C] whitespace-pre-wrap">{project.prompt || 'No description provided'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-[#8A827A]">Status</p>
                  <p className="font-medium text-[#2A2621]">{status.label}</p>
                </div>
                <div>
                  <p className="text-sm text-[#8A827A]">Style</p>
                  <p className="font-medium text-[#2A2621] capitalize">{project.style || 'Cinematic'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#8A827A]">Created</p>
                  <p className="font-medium text-[#2A2621]">
                    {new Date(project.created_at).toLocaleString()}
                  </p>
                </div>
                {project.completed_at && (
                  <div>
                    <p className="text-sm text-[#8A827A]">Completed</p>
                    <p className="font-medium text-[#2A2621]">
                      {new Date(project.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {project.footage_urls && project.footage_urls.length > 0 && (
                  <div>
                    <p className="text-sm text-[#8A827A]">Footage</p>
                    <p className="font-medium text-[#2A2621]">
                      {project.footage_urls.length} file(s) uploaded
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectActions
                  projectId={project.id}
                  status={project.status}
                  videoUrl={project.video_url}
                />
              </CardContent>
            </Card>

            {/* Generation Info */}
            {(project.status === 'queued' || project.status === 'analyzing' || project.status === 'generating') && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generation Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${project.status === 'queued' ? 'bg-[#C45D3A] text-white' : 'bg-[#2D7D4F] text-white'}`}>
                        {project.status === 'queued' ? (
                          <span className="text-xs">1</span>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-[#2A2621]">Queued</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${project.status === 'analyzing' ? 'bg-[#C45D3A] text-white' : project.status === 'generating' || project.status === 'completed' ? 'bg-[#2D7D4F] text-white' : 'bg-[#E2E0DB] text-[#8A827A]'}`}>
                        {project.status === 'analyzing' ? (
                          <span className="text-xs">2</span>
                        ) : project.status === 'generating' || project.status === 'completed' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-xs">2</span>
                        )}
                      </div>
                      <span className="text-sm text-[#2A2621]">Analyzing Audio</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${project.status === 'generating' ? 'bg-[#C45D3A] text-white' : project.status === 'completed' ? 'bg-[#2D7D4F] text-white' : 'bg-[#E2E0DB] text-[#8A827A]'}`}>
                        {project.status === 'generating' ? (
                          <span className="text-xs">3</span>
                        ) : project.status === 'completed' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-xs">3</span>
                        )}
                      </div>
                      <span className="text-sm text-[#2A2621]">Generating Video</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#8A827A] mt-4">
                    This page will automatically update when generation is complete.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
