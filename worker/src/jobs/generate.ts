import { Job, GenerationJobData } from '../lib/queue.js'
import { supabase, updateProjectStatus, getProject } from '../lib/supabase.js'
import { analyzeAudio, detectSubtleCues } from '../lib/audio-analyzer.js'
import { decryptApiKey, getEncryptionSecret } from '../lib/encryption.js'
import {
  generateVisualPlan as generateAIVisualPlan,
  generateSeed,
  type OrchestrationInput,
  type VisualPlan,
  type FootageInfo,
  type EffectAssignment
} from '../lib/orchestrator.js'
import { renderVideo, cleanupRender, type RenderConfig } from '../lib/renderer.js'
import { createReadStream, statSync, readFileSync } from 'fs'
import * as tus from 'tus-js-client'

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

    // Fetch the user's Anthropic API key, fall back to environment variable
    let anthropicApiKey = await getUserApiKey(project.organization_id, 'anthropic')
    if (!anthropicApiKey && process.env.ANTHROPIC_API_KEY) {
      console.log('Using environment ANTHROPIC_API_KEY for AI orchestration')
      anthropicApiKey = process.env.ANTHROPIC_API_KEY
    }

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

    // Build render config
    const renderConfig: RenderConfig = {
      projectId,
      audioUrl: project.audio_url!,
      audioFeatures,
      footageUrls: project.footage_urls || [],
      prompt: project.prompt || '',
      style: project.style || 'organic',
      resolution: (project.resolution as '480p' | '720p' | '1080p' | '4K') || '1080p',
      effectIntensity: project.effect_intensity ?? 0.5,
      footageVisibility: project.footage_visibility ?? 0.6
    }

    // Convert orchestrator visual plan to renderer visual plan format
    const rendererVisualPlan = {
      segments: visualPlan.segments.map(seg => ({
        startTime: seg.startTime,
        endTime: seg.endTime,
        effects: (seg.effects || []).map(eff => ({
          effectSlug: eff.effectSlug,
          ffmpegFilter: getFFmpegFilterForEffect(eff.effectSlug, eff.intensity),
          parameters: { intensity: eff.intensity }
        })),
        footageIndex: seg.footageIndex,
        generativeType: seg.generativeType as 'particles' | 'waves' | 'geometric' | 'noise' | 'spectrum' | undefined,
        shaderType: seg.shaderType as 'perlin-noise' | 'particle-flow' | 'fractal-mandelbrot' | 'voronoi-cells' | 'reaction-diffusion' | undefined,
        transitionIn: seg.transition?.type as 'fade' | 'dissolve' | 'wipe' | 'zoom' | 'cut' | undefined
      })),
      colorPalette: [visualPlan.colorPalette.primary, visualPlan.colorPalette.secondary, visualPlan.colorPalette.accent],
      mood: visualPlan.colorPalette.mood,
      narrative: visualPlan.narrative.theme
    }

    let outputPath: string
    try {
      outputPath = await renderVideo(renderConfig, rendererVisualPlan, (progress) => {
        const percent = 60 + (progress.percent * 0.3) // 60-90%
        console.log(`Render: ${progress.stage} (${Math.round(percent)}%)`)
        job.updateProgress(Math.round(percent))
      })
      console.log(`Video rendered to: ${outputPath}`)
    } catch (renderError) {
      console.error('Render failed:', renderError)
      throw new Error(`Video rendering failed: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`)
    }

    // 5. Upload to Supabase Storage
    console.log('Uploading video to storage...')
    const videoFileName = `${projectId}/${seed}.mp4`

    let videoUrl: string
    try {
      // Get file stats for content-length
      const stats = statSync(outputPath)
      const fileSizeMB = stats.size / 1024 / 1024
      console.log(`Video file size: ${fileSizeMB.toFixed(2)} MB`)

      const supabaseUrl = process.env.SUPABASE_URL!
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

      // Extract project ref from URL (e.g., https://kjytcjnyowwmcmfudxup.supabase.co -> kjytcjnyowwmcmfudxup)
      const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
      if (!projectRef) {
        throw new Error('Could not extract project ref from SUPABASE_URL')
      }

      // Use resumable upload for files > 6MB (Supabase recommendation)
      if (fileSizeMB > 6) {
        console.log('Using resumable upload (TUS protocol) for large file...')

        // Read file as buffer for tus upload
        const videoBuffer = readFileSync(outputPath)

        // Direct storage hostname for better performance
        const tusEndpoint = `https://${projectRef}.supabase.co/storage/v1/upload/resumable`

        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(videoBuffer, {
            endpoint: tusEndpoint,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            chunkSize: 6 * 1024 * 1024, // 6MB chunks as required by Supabase
            headers: {
              'Authorization': `Bearer ${serviceKey}`,
              'x-upsert': 'true'
            },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            metadata: {
              bucketName: 'video-outputs',
              objectName: videoFileName,
              contentType: 'video/mp4',
              cacheControl: '3600'
            },
            onError: (error) => {
              console.error('TUS upload error:', error.message)
              reject(error)
            },
            onProgress: (bytesUploaded, bytesTotal) => {
              const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(1)
              console.log(`Upload progress: ${percentage}% (${(bytesUploaded / 1024 / 1024).toFixed(1)}MB / ${(bytesTotal / 1024 / 1024).toFixed(1)}MB)`)
            },
            onSuccess: () => {
              console.log('TUS upload completed successfully')
              resolve()
            }
          })

          // Check for previous uploads and resume if possible
          upload.findPreviousUploads().then((previousUploads) => {
            if (previousUploads.length > 0) {
              console.log('Found previous incomplete upload, resuming...')
              upload.resumeFromPreviousUpload(previousUploads[0])
            }
            upload.start()
          })
        })
      } else {
        // Use standard upload for small files
        console.log('Using standard upload for small file...')
        const videoBuffer = readFileSync(outputPath)
        const uploadUrl = `${supabaseUrl}/storage/v1/object/video-outputs/${videoFileName}`

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'video/mp4',
            'x-upsert': 'true'
          },
          body: videoBuffer
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Upload failed with status ${response.status}: ${errorText}`)
        }
        console.log('Standard upload completed successfully')
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('video-outputs')
        .getPublicUrl(videoFileName)

      videoUrl = urlData.publicUrl
      console.log(`Video uploaded: ${videoUrl}`)

      // Cleanup temp files
      cleanupRender(projectId)
    } catch (uploadError) {
      console.error('Upload failed:', uploadError)
      cleanupRender(projectId)
      throw new Error(`Video upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`)
    }

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
        startTime: section.startTime,
        endTime: section.endTime,
        musicalContext: section.type as 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'instrumental',
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

function getDefaultEffects(style: string, energy: number): EffectAssignment[] {
  const effects: EffectAssignment[] = []

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
 * Convert effect slug to FFmpeg filter string
 */
function getFFmpegFilterForEffect(effectSlug: string, intensity: number): string {
  const filterMap: Record<string, (i: number) => string> = {
    'brightness-contrast': (i) => `eq=brightness=${0.1 * i}:contrast=${1 + 0.2 * i}`,
    'hue-rotate': (i) => `hue=h=${360 * i}`,
    'saturation': (i) => `eq=saturation=${1 + i}`,
    'vignette': (i) => `vignette=angle=${0.5 * i}`,
    'grain': (i) => `noise=alls=${Math.round(10 * i)}:allf=t`,
    'blur': (i) => `gblur=sigma=${5 * i}`,
    'sharpen': (i) => `unsharp=5:5:${i}`,
    'glow': (i) => `gblur=sigma=${3 * i},blend=all_mode=screen:all_opacity=${0.3 * i}`,
    'chromatic-aberration': (i) => `rgbashift=rh=${Math.round(5 * i)}:bh=${Math.round(-5 * i)}`,
  }

  return filterMap[effectSlug]?.(intensity) || ''
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
