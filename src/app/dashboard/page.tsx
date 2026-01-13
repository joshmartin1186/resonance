import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's organization and details
  const { data: userData } = await supabase
    .from('users')
    .select(`
      *,
      organizations (
        id,
        name,
        plan,
        generation_limit,
        generations_used
      )
    `)
    .eq('id', user.id)
    .single()

  const organization = userData?.organizations

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
                <Link href="/dashboard" className="text-sm font-medium text-[#C45D3A]">
                  Dashboard
                </Link>
                <Link href="/projects" className="text-sm font-medium text-[#5A534C] hover:text-[#2A2621]">
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2A2621]">
            Welcome back{userData?.full_name ? `, ${userData.full_name}` : ''}!
          </h1>
          <p className="text-[#5A534C] mt-1">
            {organization?.name || 'Your Organization'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Plan</CardDescription>
              <CardTitle className="capitalize">{organization?.plan || 'Free'}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Generations Used</CardDescription>
              <CardTitle>
                {organization?.generations_used || 0} / {organization?.generation_limit || 3}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Projects</CardDescription>
              <CardTitle>0</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#2A2621] mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <Link href="/create">
              <Button>Create New Project</Button>
            </Link>
            <Link href="/projects">
              <Button variant="secondary">View All Projects</Button>
            </Link>
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <h2 className="text-lg font-semibold text-[#2A2621] mb-4">Recent Projects</h2>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-[#5A534C] mb-4">No projects yet</p>
              <Link href="/create">
                <Button>Create Your First Project</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
