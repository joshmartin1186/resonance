'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileUpload } from '@/components/file-upload'
import { createClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3

interface ProjectData {
  name: string
  audioUrl: string
  prompt: string
  footageUrls: string[]
  style: string
}

export default function CreateProjectPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    audioUrl: '',
    prompt: '',
    footageUrls: [],
    style: 'cinematic'
  })

  const steps = [
    { number: 1, title: 'Upload Audio', description: 'Add your music track' },
    { number: 2, title: 'Describe Vision', description: 'Tell us what you want' },
    { number: 3, title: 'Review & Create', description: 'Confirm and generate' }
  ]

  const styleOptions = [
    { value: 'cinematic', label: 'Cinematic', description: 'Film-like visuals with dramatic lighting' },
    { value: 'abstract', label: 'Abstract', description: 'Flowing shapes and organic patterns' },
    { value: 'nature', label: 'Nature', description: 'Natural landscapes and elements' },
    { value: 'minimal', label: 'Minimal', description: 'Clean, simple compositions' }
  ]

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return projectData.audioUrl !== '' && projectData.name !== ''
      case 2:
        return projectData.prompt !== ''
      case 3:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < 3 && canProceed()) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          prompt: projectData.prompt,
          audio_url: projectData.audioUrl,
          footage_urls: projectData.footageUrls,
          style: projectData.style,
          status: 'draft',
          user_id: user.id
        })
        .select('id')
        .single()

      if (projectError) {
        throw new Error(projectError.message)
      }

      // Redirect to project page
      router.push(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      {/* Header */}
      <header className="bg-white border-b border-[#E2E0DB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-xl font-bold text-[#2A2621]">
              Resonance
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Cancel</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-[#E2E0DB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-medium
                      ${currentStep >= step.number
                        ? 'bg-[#C45D3A] text-white'
                        : 'bg-[#E2E0DB] text-[#8A827A]'
                      }
                    `}
                  >
                    {currentStep > step.number ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${currentStep >= step.number ? 'text-[#2A2621]' : 'text-[#8A827A]'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-[#8A827A] hidden sm:block">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`
                      w-24 sm:w-32 h-1 mx-4 rounded
                      ${currentStep > step.number ? 'bg-[#C45D3A]' : 'bg-[#E2E0DB]'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-[#FEE2E2] text-[#C2410C] rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Upload Audio */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Audio</CardTitle>
              <CardDescription>
                Add the music track you want to create visuals for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="My Music Video"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Audio File</Label>
                <FileUpload
                  bucket="audio-uploads"
                  accept=".mp3,.wav,.flac,.m4a,audio/*"
                  maxSize={50}
                  onUpload={(urls) => setProjectData({ ...projectData, audioUrl: urls[0] || '' })}
                  onError={setError}
                  label="Drop your audio file here"
                  description="Supports MP3, WAV, FLAC, M4A (max 50MB)"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Describe Vision */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Describe Your Vision</CardTitle>
                <CardDescription>
                  Tell us what kind of visuals you want for your music
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Visual Description</Label>
                  <textarea
                    id="prompt"
                    className="w-full min-h-[120px] px-3 py-2 border border-[#E2E0DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C45D3A] focus:border-transparent resize-none"
                    placeholder="Describe the mood, colors, and imagery you envision. For example: 'Gentle morning light filtering through forest trees, soft golden tones, peaceful and meditative atmosphere with subtle particle effects'"
                    value={projectData.prompt}
                    onChange={(e) => setProjectData({ ...projectData, prompt: e.target.value })}
                  />
                  <p className="text-xs text-[#8A827A]">
                    Be descriptive about colors, mood, and visual elements you want
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Visual Style</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {styleOptions.map((style) => (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() => setProjectData({ ...projectData, style: style.value })}
                        className={`
                          p-4 rounded-lg border-2 text-left transition-colors
                          ${projectData.style === style.value
                            ? 'border-[#C45D3A] bg-[#C45D3A]/5'
                            : 'border-[#E2E0DB] hover:border-[#CDC9C2]'
                          }
                        `}
                      >
                        <p className="font-medium text-[#2A2621]">{style.label}</p>
                        <p className="text-sm text-[#8A827A] mt-1">{style.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Footage (Optional)</CardTitle>
                <CardDescription>
                  Upload your own video clips to incorporate into the visuals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  bucket="footage-uploads"
                  accept=".mp4,.mov,.webm,video/*"
                  maxSize={500}
                  multiple
                  onUpload={(urls) => setProjectData({ ...projectData, footageUrls: urls })}
                  onError={setError}
                  label="Drop footage files here"
                  description="Supports MP4, MOV, WebM (max 500MB each)"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Review & Create */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Project</CardTitle>
              <CardDescription>
                Confirm your settings before generating visuals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start py-3 border-b border-[#E2E0DB]">
                  <div>
                    <p className="text-sm text-[#8A827A]">Project Name</p>
                    <p className="font-medium text-[#2A2621]">{projectData.name}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>Edit</Button>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-[#E2E0DB]">
                  <div>
                    <p className="text-sm text-[#8A827A]">Audio File</p>
                    <p className="font-medium text-[#2A2621]">
                      {projectData.audioUrl ? 'Uploaded' : 'Not uploaded'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>Edit</Button>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-[#E2E0DB]">
                  <div className="max-w-md">
                    <p className="text-sm text-[#8A827A]">Visual Description</p>
                    <p className="font-medium text-[#2A2621] line-clamp-3">{projectData.prompt}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>Edit</Button>
                </div>

                <div className="flex justify-between items-start py-3 border-b border-[#E2E0DB]">
                  <div>
                    <p className="text-sm text-[#8A827A]">Visual Style</p>
                    <p className="font-medium text-[#2A2621] capitalize">{projectData.style}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>Edit</Button>
                </div>

                <div className="flex justify-between items-start py-3">
                  <div>
                    <p className="text-sm text-[#8A827A]">Footage</p>
                    <p className="font-medium text-[#2A2621]">
                      {projectData.footageUrls.length > 0
                        ? `${projectData.footageUrls.length} file(s) uploaded`
                        : 'None (AI will generate all visuals)'
                      }
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>Edit</Button>
                </div>
              </div>

              <div className="p-4 bg-[#F0EDE8] rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#C45D3A] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-[#2A2621]">What happens next?</p>
                    <p className="text-sm text-[#5A534C] mt-1">
                      After you create the project, our AI will analyze your audio and generate a unique visual narrative.
                      This typically takes 5-10 minutes depending on the length of your track.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Back
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
