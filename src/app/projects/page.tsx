import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ProjectsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#2A2621]">Projects</h1>
            <p className="text-[#5A534C] mt-1">Manage your visual generation projects</p>
          </div>
          <Button asChild>
            <Link href="/create">Create New Project</Link>
          </Button>
        </div>

        {/* Projects Grid */}
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-[#C45D3A] transition-colors cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="aspect-video bg-[#F0EDE8] rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-[#8A827A]">No thumbnail</span>
                    </div>
                    <h3 className="font-semibold text-[#2A2621] mb-1">{project.name}</h3>
                    <p className="text-sm text-[#5A534C] mb-3 line-clamp-2">
                      {project.description || project.prompt}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={project.status === 'completed' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {project.status}
                      </Badge>
                      <span className="text-xs text-[#8A827A]">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-[#5A534C] mb-4">No projects yet</p>
              <Button asChild>
                <Link href="/create">Create Your First Project</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
