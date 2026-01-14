import { Job } from 'bullmq'
import { GenerationJobData } from '../lib/queue.js'
import { supabase, updateProjectStatus, getProject } from '../lib/supabase.js'
import { analyzeAudio, detectSubtleCues } from '../lib/audio-analyzer.js'
import { decryptApiKey, getEncryptionSecret } from '../lib/encryption.js'
import {
  generateVisualPlan as generateAIVisualPlan,
  generateSeed,
  type OrchestrationInput,
  type VisualPlan,
  type FootageInfo
} from '../lib/orchestrator.js'

/**
 * Process a video generation job
 *
 * Pipeline:
 * 1. Fetch project data
 * 2. Analyze audio
 * 3. Generate visual plan (Claude AI orchestration)
 * 4. Render video (FFmpeg + effects)
 * 5. Upload to storage
 * 6. Update project with result
 */
export async function processGenerationJob(job: Job<GenerationJobData>) {
  const { projectId } = job.data

  console.log(`Processing generation job for project ${projectId}`)

  // Generate a seed for reproducibility
  const seed = generateSeed()

  try {
    // 1. Fetch project
    const project = await getProject(projectId)
    if (!project) {
      throw new Error(`Project ${projectId} not found`)
    }

    if (!project.audio_url) {
      throw new Error('Project has no audio file')
    }

    // Update status to analyzing
    await updateProjectStatus(projectId, 'analyzing')
    await job.updateProgress(10)

    // 2. Analyze audio
    console.log('Starting audio analysis...')
    const audioFeatures = await analyzeAudio(project.audio_url, (progress) => {
      console.log(`Analysis: ${progress.stage} (${progress.progress}%)`)
    })

    // Detect subtle cues
    const subtleCues = detectSubtleCues(audioFeatures)

    // Store analysis results
    await supabase
      .from('projects')
      .update({
        analysis_data: {
          features: audioFeatures,
          subtleCues,
          analyzedAt: new Date().toISOString()
        }
      })
      .eq('id', projectId)

    await job.updateProgress(40)

    // Update status to generating
    await updateProjectStatus(projectId, 'generating')

    // 3. Generate visual plan using Claude AI
    console.log('Generating visual plan with AI...')

    // Fetch footage info if any
    const footageInfo = await getFootageInfo(projectId)

    // Fetch the user's Anthropic API key
    const anthropicApiKey = await getUserApiKey(project.organization_id, 'anthropic')

    const orchestrationInput: OrchestrationInput = {
      audioFeatures,
      prompt: project.prompt || 'Create a visual journey',
      style: (project.style as OrchestrationInput['style']) || 'organic',
      footage: footageInfo,
      effectIntensity: project.effect_intensity ?? 0.5,
      footageVisibility: project.footage_visibility ?? 0.6,
      seed,
      anthropicApiKey
    }

    let visualPlan: VisualPlan
    try {
      visualPlan = await generateAIVisualPlan(orchestrationInput)
      console.log(anthropicApiKey ? 'AI visual plan generated successfully' : 'Fallback visual plan generated (no API key)')
    } catch (aiError) {
      console.warn('AI orchestration failed, using fallback:', aiError)
      visualPlan = generateFallbackVisualPlan(orchestrationInput)
    }

    // Store visual plan
    await supabase
      .from('projects')
      .update({
        visual_plan: visualPlan
      })
      .eq('id', projectId)

    await job.updateProgress(60)

    // 4. Render video
    console.log('Rendering video...')

    // For now, simulate rendering
    // In production with FFmpeg installed, this would call:
    // const outputPath = await renderVideo(renderConfig, visualPlan, (progress) => {...})
    await simulateRendering(job, 60, 90)

    // 5. Generate video URL (placeholder)
    // In production, this would upload to Cloudflare R2
    const videoUrl = `https://placeholder.resonance.app/videos/${projectId}/${seed}.mp4`

    await job.updateProgress(95)

    // 6. Create generation record
    const { error: genError } = await supabase
      .from('generations')
      .insert({
        project_id: projectId,
        organization_id: project.organization_id,
        user_id: project.user_id,
        seed,
        generation_number: await getNextGenerationNumber(projectId),
        audio_analysis: audioFeatures,
        visual_plan: visualPlan,
        video_url: videoUrl,
        duration: audioFeatures.duration,
        status: 'completed',
        completed_at: new Date().toISOString()
      })

    if (genError) {
      console.warn('Failed to create generation record:', genError)
    }

    // Update project with result
    await updateProjectStatus(projectId, 'completed', {
      video_url: videoUrl,
      seed,
      completed_at: new Date().toISOString()
    })

    console.log(`Generation complete for project ${projectId}`)

    return {
      success: true,
      videoUrl,
      seed,
      duration: audioFeatures.duration,
      visualPlan
    }
  } catch (error) {
    console.error(`Generation failed for project ${projectId}:`, error)

    await updateProjectStatus(projectId, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    throw error
  }
}

/**
 * Get footage information for a project
 */
async function getFootageInfo(projectId: string): Promise<FootageInfo[]> {
  const { data: footage } = await supabase
    .from('project_footage')
    .select('*')
    .eq('project_id', projectId)

  if (!footage || footage.length === 0) {
    return []
  }

  return footage.map(f => ({
    id: f.id,
    fileType: f.file_type as 'video' | 'image',
    duration: f.duration || undefined,
    dominantColors: f.dominant_colors || undefined,
    motionLevel: f.motion_level || undefined,
    brightness: f.brightness || undefined
  }))
}

/**
 * Get the next generation number for a project
 */
async function getNextGenerationNumber(projectId: string): Promise<number> {
  const { count } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  return (count || 0) + 1
}

/**
 * Generate a fallback visual plan when AI fails
 */
function generateFallbackVisualPlan(input: OrchestrationInput): VisualPlan {
  const { audioFeatures, prompt, style, footage } = input
  const duration = audioFeatures.duration
  const sections = audioFeatures.sections || []

  // Create segments from sections or time-based
  const segments = sections.length > 0
    ? sections.map((section, i) => ({
        startTime: section.start,
        endTime: section.end,
        musicalContext: section.type,
        emotionalTone: getEmotionalTone(section.energy),
        description: `${section.type} section`,
        effects: getDefaultEffects(style, section.energy),
        footageIndex: footage.length > 0 ? i % footage.length : undefined,
        generativeType: footage.length === 0 ? getGenerativeType(section.energy) : undefined,
        transition: { type: 'fade' as const, duration: 0.5 }
      }))
    : createTimeBasedSegments(duration, style, footage.length)

  return {
    narrative: {
      theme: prompt,
      moodProgression: segments.map(s => s.emotionalTone),
      keyMoments: []
    },
    colorPalette: getColorPalette(style),
    segments,
    globalEffects: style === 'cinematic'
      ? [{ effectSlug: 'grain', intensity: 0.3 }, { effectSlug: 'vignette', intensity: 0.4 }]
      : [{ effectSlug: 'grain', intensity: 0.2 }]
  }
}

function getEmotionalTone(energy: number): string {
  if (energy > 0.8) return 'intense'
  if (energy > 0.6) return 'energetic'
  if (energy > 0.4) return 'balanced'
  if (energy > 0.2) return 'contemplative'
  return 'serene'
}

function getDefaultEffects(style: string, energy: number) {
  const effects: Array<{ effectSlug: string; intensity: number; audioSync?: object }> = []

  if (energy > 0.7) {
    effects.push({ effectSlug: 'brightness-contrast', intensity: 0.8 })
  }

  if (style === 'psychedelic') {
    effects.push({
      effectSlug: 'hue-rotate',
      intensity: energy,
      audioSync: { parameter: 'hue', feature: 'energy', mapping: 'linear', sensitivity: 0.8 }
    })
  }

  if (style === 'cinematic') {
    effects.push({ effectSlug: 'vignette', intensity: 0.4 })
  }

  return effects
}

function getGenerativeType(energy: number): 'particles' | 'waves' | 'geometric' | 'noise' | 'spectrum' {
  if (energy > 0.7) return 'particles'
  if (energy > 0.5) return 'spectrum'
  if (energy > 0.3) return 'geometric'
  return 'waves'
}

function getColorPalette(style: string) {
  const palettes: Record<string, VisualPlan['colorPalette']> = {
    psychedelic: { primary: '#ff006e', secondary: '#8338ec', accent: '#3a86ff', mood: 'vibrant' },
    cinematic: { primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560', mood: 'cool' },
    minimal: { primary: '#ffffff', secondary: '#f5f5f5', accent: '#000000', mood: 'neutral' },
    organic: { primary: '#C45D3A', secondary: '#F8F6F3', accent: '#2A2621', mood: 'warm' }
  }
  return palettes[style] || palettes.organic
}

function createTimeBasedSegments(duration: number, style: string, footageCount: number) {
  const segmentDuration = 15
  const numSegments = Math.ceil(duration / segmentDuration)
  const segments = []

  for (let i = 0; i < numSegments; i++) {
    const startTime = i * segmentDuration
    const endTime = Math.min((i + 1) * segmentDuration, duration)
    const progress = i / numSegments
    const energy = progress < 0.3 ? 0.4 : progress < 0.7 ? 0.7 : 0.5

    segments.push({
      startTime,
      endTime,
      musicalContext: progress < 0.3 ? 'intro' : progress < 0.7 ? 'verse' : 'outro',
      emotionalTone: getEmotionalTone(energy),
      description: `Segment ${i + 1}`,
      effects: getDefaultEffects(style, energy),
      footageIndex: footageCount > 0 ? i % footageCount : undefined,
      generativeType: footageCount === 0 ? getGenerativeType(energy) : undefined,
      transition: { type: 'fade' as const, duration: 0.5 }
    })
  }

  return segments
}

/**
 * Simulate rendering progress (placeholder until FFmpeg is deployed)
 */
async function simulateRendering(
  job: Job,
  startProgress: number,
  endProgress: number
): Promise<void> {
  const steps = 10
  const stepSize = (endProgress - startProgress) / steps
  const stepDuration = 500 // 500ms per step

  for (let i = 0; i < steps; i++) {
    await new Promise(resolve => setTimeout(resolve, stepDuration))
    await job.updateProgress(Math.round(startProgress + stepSize * (i + 1)))
  }
}

/**
 * Get a user's decrypted API key for a specific provider
 */
async function getUserApiKey(
  organizationId: string,
  provider: 'anthropic' | 'openai' | 'replicate' | 'stability'
): Promise<string | undefined> {
  try {
    const { data: keyRecord } = await supabase
      .from('user_api_keys')
      .select('encrypted_key, is_valid')
      .eq('organization_id', organizationId)
      .eq('provider', provider)
      .single()

    if (!keyRecord || !keyRecord.is_valid) {
      console.log(`No valid ${provider} API key found for organization ${organizationId}`)
      return undefined
    }

    // Decrypt the key
    const encryptionSecret = getEncryptionSecret()
    const decryptedKey = decryptApiKey(keyRecord.encrypted_key, encryptionSecret)

    return decryptedKey
  } catch (error) {
    console.error(`Failed to fetch ${provider} API key:`, error)
    return undefined
  }
}

/**
 * Mark an API key as invalid (e.g., after auth failure)
 */
async function markApiKeyInvalid(
  organizationId: string,
  provider: string,
  error: string
): Promise<void> {
  await supabase
    .from('user_api_keys')
    .update({
      is_valid: false,
      last_error: error,
      updated_at: new Date().toISOString()
    })
    .eq('organization_id', organizationId)
    .eq('provider', provider)
}
