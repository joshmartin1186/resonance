import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the user to check if we need to create an organization
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user already has an organization membership
        const { data: existingMembership } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        
        // If no organization, create one for this user
        if (!existingMembership?.organization_id) {
          const orgName = user.user_metadata?.full_name 
            ? `${user.user_metadata.full_name}'s Organization`
            : `${user.email?.split('@')[0]}'s Organization`
          
          // Create organization
          const { data: newOrg } = await supabase
            .from('organizations')
            .insert({
              name: orgName,
              plan: 'free',
              generation_limit: 3,
            })
            .select('id')
            .single()
          
          if (newOrg) {
            // Create or update user record with organization
            await supabase
              .from('users')
              .upsert({
                id: user.id,
                organization_id: newOrg.id,
                email: user.email!,
                full_name: user.user_metadata?.full_name || null,
                role: 'owner',
              })
          }
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-error`)
}
