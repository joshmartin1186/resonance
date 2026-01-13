import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PLANS } from '@/lib/stripe'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E0DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-[#2A2621]">
              Resonance
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2A2621] mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-[#5A534C] max-w-2xl mx-auto">
            Choose the plan that fits your creative needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle>{PLANS.free.name}</CardTitle>
              <CardDescription>For trying it out</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-[#2A2621]">$0</span>
                <span className="text-[#5A534C]">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLANS.free.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#5A534C]">
                    <svg className="w-5 h-5 text-[#2D7D4F] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="w-full" asChild>
                <Link href="/signup">Get Started Free</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Creator Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle>{PLANS.creator.name}</CardTitle>
              <CardDescription>For independent artists</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-[#2A2621]">${PLANS.creator.price}</span>
                <span className="text-[#5A534C]">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLANS.creator.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#5A534C]">
                    <svg className="w-5 h-5 text-[#2D7D4F] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <PricingButton plan="creator" />
            </CardFooter>
          </Card>

          {/* Pro Plan - Most Popular */}
          <Card className="relative border-[#C45D3A] border-2">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
              Most Popular
            </Badge>
            <CardHeader>
              <CardTitle>{PLANS.pro.name}</CardTitle>
              <CardDescription>For serious creators</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-[#2A2621]">${PLANS.pro.price}</span>
                <span className="text-[#5A534C]">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLANS.pro.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#5A534C]">
                    <svg className="w-5 h-5 text-[#2D7D4F] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <PricingButton plan="pro" />
            </CardFooter>
          </Card>

          {/* Studio Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle>{PLANS.studio.name}</CardTitle>
              <CardDescription>For teams & agencies</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-[#2A2621]">${PLANS.studio.price}</span>
                <span className="text-[#5A534C]">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {PLANS.studio.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#5A534C]">
                    <svg className="w-5 h-5 text-[#2D7D4F] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <PricingButton plan="studio" />
            </CardFooter>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-[#2A2621] text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h3 className="font-semibold text-[#2A2621] mb-2">What counts as a generation?</h3>
              <p className="text-[#5A534C]">Each time you create a new video from your audio, that&apos;s one generation. Regenerating the same project with a different seed also counts as a generation.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#2A2621] mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-[#5A534C]">Yes! You can change your plan at any time. When upgrading, you&apos;ll be charged the prorated difference. When downgrading, you&apos;ll keep your current plan until the end of your billing cycle.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#2A2621] mb-2">What&apos;s included in the commercial license?</h3>
              <p className="text-[#5A534C]">Pro and Studio plans include a commercial license that allows you to use generated videos for monetized content, client work, and commercial projects.</p>
            </div>
            <div>
              <h3 className="font-semibold text-[#2A2621] mb-2">Do unused generations roll over?</h3>
              <p className="text-[#5A534C]">No, generation limits reset at the start of each billing cycle. Pro and Studio plans have unlimited generations, so this doesn&apos;t apply.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E0DB] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-[#5A534C]">
          <p>&copy; {new Date().getFullYear()} Resonance. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

// Client component for pricing buttons
function PricingButton({ plan }: { plan: string }) {
  return (
    <form action={`/api/stripe/checkout`} method="POST" className="w-full">
      <input type="hidden" name="plan" value={plan} />
      <Button type="submit" className="w-full">
        Subscribe
      </Button>
    </form>
  )
}
