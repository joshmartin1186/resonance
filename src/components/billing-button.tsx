'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface BillingButtonProps {
  plan?: string
  variant?: 'default' | 'secondary' | 'ghost' | 'link'
  children: React.ReactNode
  className?: string
}

export function CheckoutButton({ plan, variant = 'default', children, className }: BillingButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned')
        setLoading(false)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setLoading(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      onClick={handleCheckout} 
      disabled={loading}
      className={className}
    >
      {loading ? 'Loading...' : children}
    </Button>
  )
}

export function PortalButton({ variant = 'secondary', children, className }: Omit<BillingButtonProps, 'plan'>) {
  const [loading, setLoading] = useState(false)

  const handlePortal = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No portal URL returned:', data.error)
        setLoading(false)
      }
    } catch (error) {
      console.error('Portal error:', error)
      setLoading(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      onClick={handlePortal} 
      disabled={loading}
      className={className}
    >
      {loading ? 'Loading...' : children}
    </Button>
  )
}
