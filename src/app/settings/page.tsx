import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckoutButton, PortalButton } from '@/components/billing-button'
import { ApiKeysSettings } from '@/components/settings/ApiKeysSettings'

export default async function SettingsPage() {
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
      organizations (*)
    `)
    .eq('id', user.id)
    .single()

  const organization = userData?.organizations
  const userRole = userData?.role || 'viewer'

  // Get team members
  const { data: teamMembers } = await supabase
    .from('users')
    .select('id, email, full_name, role, created_at')
    .eq('organization_id', userData?.organization_id)
    .order('created_at', { ascending: true })

  const isOwner = userRole === 'owner'
  const isAdmin = userRole === 'owner' || userRole === 'admin'
  const hasStripeSubscription = !!organization?.stripe_customer_id

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
                <Link href="/projects" className="text-sm font-medium text-[#5A534C] hover:text-[#2A2621]">
                  Projects
                </Link>
                <Link href="/settings" className="text-sm font-medium text-[#C45D3A]">
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#2A2621]">Settings</h1>
          <p className="text-[#5A534C] mt-1">Manage your account and organization</p>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your personal account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-[#5A534C]">Email</p>
                  <p className="text-[#2A2621]">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#5A534C]">Name</p>
                  <p className="text-[#2A2621]">{userData?.full_name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#5A534C]">Role</p>
                  <Badge variant="info" className="capitalize">{userRole}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#5A534C]">Member since</p>
                  <p className="text-[#2A2621]">
                    {userData?.created_at 
                      ? new Date(userData.created_at).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization Section */}
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Your organization details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-[#5A534C]">Organization Name</p>
                  <p className="text-[#2A2621]">{organization?.name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#5A534C]">Plan</p>
                  <Badge className="capitalize">
                    {organization?.subscription_plan || 'Free'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#5A534C]">Status</p>
                  <Badge
                    variant={organization?.subscription_status === 'active' ? 'success' : 'warning'}
                    className="capitalize"
                  >
                    {organization?.subscription_status || 'trialing'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#5A534C]">Generations This Month</p>
                  <p className="text-[#2A2621]">
                    {organization?.generations_this_month || 0} / {organization?.generations_limit === -1 ? '∞' : organization?.generations_limit || 3}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Section - Owner Only */}
          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#5A534C]">
                      {organization?.subscription_plan === 'free' 
                        ? 'You are on the free plan with limited generations.'
                        : `You are subscribed to the ${organization?.subscription_plan} plan.`}
                    </p>
                    {organization?.subscription_status === 'past_due' && (
                      <p className="text-sm text-[#C2410C] mt-1">
                        Your payment is past due. Please update your payment method.
                      </p>
                    )}
                  </div>
                  {hasStripeSubscription ? (
                    <PortalButton>Manage Billing</PortalButton>
                  ) : (
                    <CheckoutButton plan="pro">Upgrade to Pro</CheckoutButton>
                  )}
                </div>
                
                {/* Upgrade Options for Free Users */}
                {organization?.subscription_plan === 'free' && (
                  <div className="mt-6 pt-6 border-t border-[#E2E0DB]">
                    <h4 className="font-medium text-[#2A2621] mb-4">Upgrade your plan</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border border-[#E2E0DB] rounded-lg">
                        <p className="font-medium text-[#2A2621]">Creator</p>
                        <p className="text-2xl font-bold text-[#2A2621]">$29<span className="text-sm font-normal text-[#5A534C]">/mo</span></p>
                        <p className="text-xs text-[#5A534C] mb-3">20 generations/month</p>
                        <CheckoutButton plan="creator" variant="secondary" className="w-full">
                          Select
                        </CheckoutButton>
                      </div>
                      <div className="p-4 border-2 border-[#C45D3A] rounded-lg">
                        <p className="font-medium text-[#2A2621]">Pro</p>
                        <p className="text-2xl font-bold text-[#2A2621]">$79<span className="text-sm font-normal text-[#5A534C]">/mo</span></p>
                        <p className="text-xs text-[#5A534C] mb-3">Unlimited generations</p>
                        <CheckoutButton plan="pro" className="w-full">
                          Select
                        </CheckoutButton>
                      </div>
                      <div className="p-4 border border-[#E2E0DB] rounded-lg">
                        <p className="font-medium text-[#2A2621]">Studio</p>
                        <p className="text-2xl font-bold text-[#2A2621]">$199<span className="text-sm font-normal text-[#5A534C]">/mo</span></p>
                        <p className="text-xs text-[#5A534C] mb-3">Teams + API access</p>
                        <CheckoutButton plan="studio" variant="secondary" className="w-full">
                          Select
                        </CheckoutButton>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Team Section - Admin and Owner Only */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Team</CardTitle>
                    <CardDescription>Manage team members and access</CardDescription>
                  </div>
                  <Button size="sm">Invite Member</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-3 border-b border-[#E2E0DB] last:border-0"
                    >
                      <div>
                        <p className="font-medium text-[#2A2621]">
                          {member.full_name || member.email}
                        </p>
                        <p className="text-sm text-[#5A534C]">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="info" className="capitalize">
                          {member.role}
                        </Badge>
                        {member.id !== user.id && isOwner && (
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Keys Section - Admin and Owner Only */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Connect your AI provider accounts for video generation</CardDescription>
              </CardHeader>
              <CardContent>
                <ApiKeysSettings />
              </CardContent>
            </Card>
          )}

          {/* Danger Zone - Owner Only */}
          {isOwner && (
            <Card className="border-[#C2410C]">
              <CardHeader>
                <CardTitle className="text-[#C2410C]">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#2A2621]">Delete Organization</p>
                    <p className="text-sm text-[#5A534C]">
                      This will permanently delete your organization and all data.
                    </p>
                  </div>
                  <Button variant="secondary" className="border-[#C2410C] text-[#C2410C] hover:bg-[#C2410C] hover:text-white">
                    Delete Organization
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
