import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>
              Something went wrong during authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg bg-[#FEE2E2] text-[#C2410C] text-sm">
              <p className="font-medium mb-2">Unable to verify your email</p>
              <p>
                The link may have expired or already been used. Please try signing in again or request a new confirmation email.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button asChild variant="secondary" className="flex-1">
              <Link href="/signup">Sign Up</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/login">Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
