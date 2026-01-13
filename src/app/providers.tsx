'use client'

import { OrganizationProvider } from '@/contexts/organization-context'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <OrganizationProvider>
      {children}
    </OrganizationProvider>
  )
}
