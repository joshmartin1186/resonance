import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Sparkles, Download, Check, ChevronRight, Play } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      {/* Navigation */}
      <nav className="border-b border-[#E2E0DB] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#C45D3A] rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-[#2A2621]">Resonance</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">How it Works</a>
              <a href="#pricing" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">Pricing</a>
              <a href="#faq" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button>Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="info" className="mb-6">Now in Beta</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2A2621] mb-6 leading-tight">
              Create Cinematic Visuals for Your Music in Minutes
            </h1>
            <p className="text-xl text-[#5A534C] mb-8 max-w-2xl mx-auto">
              Beautiful, unique visuals that respond to the subtle nuances of organic music. No video editing required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>
            <p className="text-sm text-[#8A827A] mt-4">
              14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
          
          {/* Hero Visual Placeholder */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="aspect-video bg-[#2A2621] rounded-2xl flex items-center justify-center shadow-2xl">
              <div className="text-center">
                <Play className="w-16 h-16 text-white/80 mx-auto mb-4" />
                <p className="text-white/60">Demo video coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2A2621] mb-4">
              How It Works
            </h2>
            <p className="text-lg text-[#5A534C] max-w-2xl mx-auto">
              Three simple steps to transform your music into stunning visuals
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#C45D3A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Music className="w-8 h-8 text-[#C45D3A]" />
              </div>
              <div className="text-sm font-medium text-[#C45D3A] mb-2">Step 1</div>
              <h3 className="text-xl font-semibold text-[#2A2621] mb-3">Upload & Describe</h3>
              <p className="text-[#5A534C]">
                Add your audio file and optionally upload footage or images. Describe the visual feeling you want.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#C45D3A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-[#C45D3A]" />
              </div>
              <div className="text-sm font-medium text-[#C45D3A] mb-2">Step 2</div>
              <h3 className="text-xl font-semibold text-[#2A2621] mb-3">AI Creates Your Story</h3>
              <p className="text-[#5A534C]">
                Our AI analyzes melody, harmony, dynamics, breath, vibrato, and silence to create a visual narrative.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#C45D3A]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Download className="w-8 h-8 text-[#C45D3A]" />
              </div>
              <div className="text-sm font-medium text-[#C45D3A] mb-2">Step 3</div>
              <h3 className="text-xl font-semibold text-[#2A2621] mb-3">Download & Share</h3>
              <p className="text-[#5A534C]">
                Get your unique cinematic video in 10 minutes. Ready for YouTube, social media, and streaming.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2A2621] mb-4">
              Built for Organic Music
            </h2>
            <p className="text-lg text-[#5A534C] max-w-2xl mx-auto">
              Unlike EDM visualizers, Resonance understands the subtlety of acoustic instruments
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Deep Audio Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Detects pitch, harmony, dynamics, timbre, expression, and emotional arc—not just beats and volume.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Subtle Cue Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Notices breath, string sustain, vibrato, and meaningful silence that other tools miss completely.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Three-Layer Compositing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Combines your footage, code-driven effects, and generative visuals into a cohesive cinematic story.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Generative Uniqueness</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Every output is one-of-a-kind. Never the same twice, never looks like a template.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>AI Storytelling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Claude AI creates a visual narrative that follows your music&apos;s emotional journey from start to finish.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Professional Output</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  HD and 4K video ready for YouTube, Spotify Canvas, social media, and live performances.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2A2621] mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-[#5A534C]">
              Start free, upgrade when you need more
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free */}
            <Card className="relative">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#2A2621]">$0</span>
                  <span className="text-[#5A534C]">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">3 generations/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">Up to 2 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">720p quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">Watermark</span>
                  </li>
                </ul>
                <Button variant="secondary" className="w-full mt-6">Get Started</Button>
              </CardContent>
            </Card>

            {/* Creator */}
            <Card className="relative border-2 border-[#C45D3A]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle>Creator</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#2A2621]">$29</span>
                  <span className="text-[#5A534C]">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">20 generations/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">Up to 5 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">1080p quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">No watermark</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">Save favorite seeds</span>
                  </li>
                </ul>
                <Button className="w-full mt-6">Start Free Trial</Button>
              </CardContent>
            </Card>
            
            {/* Pro */}
            <Card className="relative">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#2A2621]">$79</span>
                  <span className="text-[#5A534C]">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">Unlimited generations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">Up to 10 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">4K quality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">Commercial license</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">Priority processing</span>
                  </li>
                </ul>
                <Button variant="secondary" className="w-full mt-6">Start Free Trial</Button>
              </CardContent>
            </Card>

            {/* Studio */}
            <Card className="relative">
              <CardHeader>
                <CardTitle>Studio</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#2A2621]">$199</span>
                  <span className="text-[#5A534C]">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">Everything in Pro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">Up to 30 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">Batch processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">API access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#2D7D4F] mt-0.5 shrink-0" />
                    <span className="text-[#5A534C]">White-label option</span>
                  </li>
                </ul>
                <Button variant="secondary" className="w-full mt-6">Contact Sales</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2A2621] mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does it work?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Upload your audio, describe the visual feeling you want, and our AI creates a unique narrative-driven video in about 10 minutes. The system analyzes your music&apos;s melody, harmony, dynamics, and subtle cues like breath and vibrato to create visuals that truly match your music.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What kind of music works best?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Resonance is designed for organic, acoustic, and ambient music—singer-songwriters, folk, classical, jazz, meditation music, and similar genres. If your music features real instruments and human performance, Resonance will understand it.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I use my own footage?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Yes! Upload video clips or images and Resonance will intelligently integrate them with generated effects and visuals. You control how much of your footage appears versus abstract generative elements.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What if I don&apos;t like the result?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Regenerate with a different seed for a completely new interpretation. Each generation is unique—you can create multiple versions until you find the perfect visual story for your music.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I use these videos commercially?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Free and Creator tiers are for personal use only. Pro and Studio tiers include full commercial licensing—use your videos for monetized content, client work, and commercial releases.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-[#2A2621]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Music?
          </h2>
          <p className="text-xl text-white/70 mb-8">
            Join musicians creating stunning visuals in minutes, not hours.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-[#2A2621] hover:bg-white/90">
              Start Your Free Trial
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#E2E0DB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#C45D3A] rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-[#2A2621]">Resonance</span>
              <span className="text-[#8A827A] ml-2">by AI West</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#5A534C]">
              <a href="#" className="hover:text-[#2A2621] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#2A2621] transition-colors">Terms of Service</a>
              <a href="mailto:support@resonance.app" className="hover:text-[#2A2621] transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-[#8A827A]">
            © 2025 Resonance by AI West. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
