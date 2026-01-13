'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const router = useRouter()
  const supabase = createClient()

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage('Check your email for the magic link!')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-[#2A2621]">Resonance</h1>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Mode Tabs */}
            <div className="flex mb-6 border-b border-[#E2E0DB]">
              <button
                type="button"
                onClick={() => setMode('password')}
                className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                  mode === 'password'
                    ? 'text-[#C45D3A] border-b-2 border-[#C45D3A]'
                    : 'text-[#5A534C] hover:text-[#2A2621]'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setMode('magic')}
                className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                  mode === 'magic'
                    ? 'text-[#C45D3A] border-b-2 border-[#C45D3A]'
                    : 'text-[#5A534C] hover:text-[#2A2621]'
                }`}
              >
                Magic Link
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-[#FEE2E2] text-[#C2410C] text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 rounded-lg bg-[#E8F5EC] text-[#2D7D4F] text-sm">
                {message}
              </div>
            )}

            <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {mode === 'password' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/reset-password"
                        className="text-sm text-[#C45D3A] hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? 'Loading...'
                    : mode === 'password'
                    ? 'Sign In'
                    : 'Send Magic Link'}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-sm text-[#5A534C]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#C45D3A] hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
