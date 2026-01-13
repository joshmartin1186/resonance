"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Sparkles, Download, Check, ChevronRight, Play, Menu, X, Star, Quote, Twitter, Youtube, Instagram } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Singer-Songwriter",
    quote: "Finally, a tool that understands the quiet moments in my music. The visuals breathe with my songs.",
    rating: 5,
  },
  {
    name: "Marcus Williams",
    role: "Jazz Pianist",
    quote: "I've tried every visualizer out there. Resonance is the first one that doesn't make my music look like a rave.",
    rating: 5,
  },
  {
    name: "Elena Vasquez",
    role: "Classical Composer",
    quote: "The AI picked up on dynamics I didn't even consciously notice. My string quartet video went viral.",
    rating: 5,
  },
]

const faqs = [
  {
    question: "How does it work?",
    answer: "Upload your audio, describe the visual feeling you want, and our AI creates a unique narrative-driven video in about 10 minutes. The system analyzes your music's melody, harmony, dynamics, and subtle cues like breath and vibrato to create visuals that truly match your music.",
  },
  {
    question: "What kind of music works best?",
    answer: "Resonance is designed for organic, acoustic, and ambient music—singer-songwriters, folk, classical, jazz, meditation music, and similar genres. If your music features real instruments and human performance, Resonance will understand it.",
  },
  {
    question: "Can I use my own footage?",
    answer: "Yes! Upload video clips or images and Resonance will intelligently integrate them with generated effects and visuals. You control how much of your footage appears versus abstract generative elements.",
  },
  {
    question: "What if I don't like the result?",
    answer: "Regenerate with a different seed for a completely new interpretation. Each generation is unique—you can create multiple versions until you find the perfect visual story for your music.",
  },
  {
    question: "Can I use these videos commercially?",
    answer: "Free and Creator tiers are for personal use only. Pro and Studio tiers include full commercial licensing—use your videos for monetized content, client work, and commercial releases.",
  },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      {/* Navigation */}
      <nav className="border-b border-[#E2E0DB] bg-white sticky top-0 z-50">
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
              <a href="#features" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">Features</a>
              <a href="#pricing" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">Pricing</a>
              <a href="#faq" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">FAQ</a>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button>Start Free Trial</Button>
              </Link>
            </div>
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-[#5A534C] hover:text-[#2A2621]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E0DB] bg-white">
            <div className="px-4 py-4 space-y-4">
              <a href="#how-it-works" className="block text-[#5A534C] hover:text-[#2A2621] transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
              <a href="#features" className="block text-[#5A534C] hover:text-[#2A2621] transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#pricing" className="block text-[#5A534C] hover:text-[#2A2621] transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#faq" className="block text-[#5A534C] hover:text-[#2A2621] transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
              <div className="pt-4 border-t border-[#E2E0DB] space-y-3">
                <Link href="/login" className="block">
                  <Button variant="ghost" className="w-full">Log in</Button>
                </Link>
                <Link href="/signup" className="block">
                  <Button className="w-full">Start Free Trial</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-16 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="info" className="mb-6">Now in Beta</Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#2A2621] mb-6 leading-tight">
              Your Music Deserves Visuals That <span className="text-[#C45D3A]">Feel</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#5A534C] mb-8 max-w-2xl mx-auto">
              AI-powered visuals that respond to the breath, silence, and subtlety of organic music. Not another beat-synced visualizer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#demo">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </a>
            </div>
            <p className="text-sm text-[#8A827A] mt-4">
              14-day free trial &bull; No credit card required &bull; Cancel anytime
            </p>
          </div>

          {/* Hero Visual / Demo Video Placeholder */}
          <div id="demo" className="mt-12 lg:mt-16 max-w-5xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-[#2A2621] to-[#1a1815] rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden group cursor-pointer">
              {/* Animated background elements */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#C45D3A] rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#D97F5F] rounded-full blur-3xl animate-pulse delay-700" />
              </div>
              {/* Play button */}
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-all group-hover:scale-110">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" fill="white" />
                </div>
                <p className="text-white/80 font-medium">Watch how Resonance transforms music</p>
                <p className="text-white/50 text-sm mt-1">2 min demo</p>
              </div>
            </div>
          </div>

          {/* Social proof bar */}
          <div className="mt-12 text-center">
            <p className="text-[#8A827A] text-sm mb-4">Trusted by musicians worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-12 opacity-60">
              <span className="text-[#5A534C] font-medium">500+ creators</span>
              <span className="text-[#5A534C]">&bull;</span>
              <span className="text-[#5A534C] font-medium">10,000+ videos generated</span>
              <span className="text-[#5A534C]">&bull;</span>
              <span className="text-[#5A534C] font-medium">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2A2621] mb-4">
              How It Works
            </h2>
            <p className="text-base sm:text-lg text-[#5A534C] max-w-2xl mx-auto">
              Three simple steps to transform your music into stunning visuals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
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

      {/* Testimonials */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2A2621] mb-4">
              Loved by Musicians
            </h2>
            <p className="text-base sm:text-lg text-[#5A534C] max-w-2xl mx-auto">
              See what creators are saying about Resonance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-[#D97706] fill-[#D97706]" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-[#C45D3A]/20 absolute top-4 right-4" />
                </CardHeader>
                <CardContent>
                  <p className="text-[#5A534C] mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div>
                    <p className="font-semibold text-[#2A2621]">{testimonial.name}</p>
                    <p className="text-sm text-[#8A827A]">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2A2621] mb-4">
              Built for Organic Music
            </h2>
            <p className="text-base sm:text-lg text-[#5A534C] max-w-2xl mx-auto">
              Unlike EDM visualizers, Resonance understands the subtlety of acoustic instruments
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <section id="pricing" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2A2621] mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base sm:text-lg text-[#5A534C]">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
                <Link href="/signup">
                  <Button variant="secondary" className="w-full mt-6">Get Started</Button>
                </Link>
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
                <Link href="/signup">
                  <Button className="w-full mt-6">Start Free Trial</Button>
                </Link>
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
                <Link href="/signup">
                  <Button variant="secondary" className="w-full mt-6">Start Free Trial</Button>
                </Link>
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
                <Link href="/pricing">
                  <Button variant="secondary" className="w-full mt-6">Contact Sales</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2A2621] mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm sm:text-base">
                    {faq.answer}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-20 bg-[#2A2621]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Music?
          </h2>
          <p className="text-lg sm:text-xl text-white/70 mb-8">
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
      <footer className="py-12 lg:py-16 border-t border-[#E2E0DB] bg-[#F8F6F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#C45D3A] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-[#2A2621]">Resonance</span>
              </div>
              <p className="text-sm text-[#5A534C] mb-4">
                AI-powered visuals for organic music. A product by AI West.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-[#5A534C] hover:text-[#C45D3A] transition-colors" aria-label="Twitter">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#5A534C] hover:text-[#C45D3A] transition-colors" aria-label="YouTube">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#5A534C] hover:text-[#C45D3A] transition-colors" aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-[#2A2621] mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">Pricing</a></li>
                <li><a href="#faq" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">FAQ</a></li>
                <li><Link href="/login" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">Log in</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-[#2A2621] mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">Blog</a></li>
                <li><a href="#" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">Tutorials</a></li>
                <li><a href="#" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">Examples</a></li>
                <li><a href="#" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">API Docs</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-[#2A2621] mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">About AI West</a></li>
                <li><a href="#" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">Terms of Service</a></li>
                <li><a href="mailto:support@resonance.app" className="text-[#5A534C] hover:text-[#2A2621] transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#E2E0DB] text-center text-sm text-[#8A827A]">
            &copy; {new Date().getFullYear()} Resonance by AI West. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
