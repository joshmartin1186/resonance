'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer'

export interface Organization {
  id: string
  name: string
  slug: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
  subscription_plan: string
  trial_ends_at: string | null
  generations_this_month: number
  generations_limit: number
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  organization_id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

interface OrganizationContextType {
  user: User | null
  userProfile: UserProfile | null
  organization: Organization | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  hasPermission: (requiredRole: UserRole) => boolean
  canManageTeam: () => boolean
  canManageBilling: () => boolean
  canCreateProjects: () => boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

// Role hierarchy: owner > admin > developer > viewer
const roleHierarchy: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  developer: 2,
  viewer: 1,
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError) throw userError
      if (!currentUser) {
        setUser(null)
        setUserProfile(null)
        setOrganization(null)
        return
      }

      setUser(currentUser)

      // Get user profile with organization
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`
          *,
          organizations (*)
        `)
        .eq('id', currentUser.id)
        .single()

      if (profileError) {
        // User might not have a profile yet (first login)
        if (profileError.code === 'PGRST116') {
          console.log('No user profile found, may need to complete signup')
          return
        }
        throw profileError
      }

      if (profile) {
        const { organizations, ...userProfileData } = profile
        setUserProfile(userProfileData as UserProfile)
        setOrganization(organizations as Organization)
      }
    } catch (err) {
      console.error('Error fetching organization data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load organization data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchData()
      } else {
        setUser(null)
        setUserProfile(null)
        setOrganization(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!userProfile) return false
    return roleHierarchy[userProfile.role] >= roleHierarchy[requiredRole]
  }

  const canManageTeam = (): boolean => hasPermission('admin')
  const canManageBilling = (): boolean => hasPermission('owner')
  const canCreateProjects = (): boolean => hasPermission('developer')

  const value: OrganizationContextType = {
    user,
    userProfile,
    organization,
    loading,
    error,
    refetch: fetchData,
    hasPermission,
    canManageTeam,
    canManageBilling,
    canCreateProjects,
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}
