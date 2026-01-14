import { mkdirSync, existsSync, unlinkSync, readdirSync, rmSync } from 'fs'
import { join } from 'path'
import { runFFmpeg, buildFilterChain, downloadFile, getVideoMetadata, concatenateVideos, imageToVideo } from './ffmpeg.js'
import type { AudioFeatures } from './audio-analyzer.js'
import { buildShaderFilter, type ShaderType } from './shader-manager.js'

// Types
export interface RenderConfig {
  projectId: string
  audioUrl: string
  audioFeatures: AudioFeatures
  footageUrls: string[]
  prompt: string
  style: string
  resolution: '480p' | '720p' | '1080p' | '4K'
  effectIntensity: number // 0-1
  footageVisibility: number // 0-1
}

export interface VisualPlan {
  segments: VisualSegment[]
  colorPalette: string[]
  mood: string
  narrative: string
}

export interface VisualSegment {
  startTime: number
  endTime: number
  effects: EffectApplication[]
  footageIndex?: number
  generativeType?: GenerativeType
  shaderType?: ShaderType  // New: use sophisticated shaders
  transitionIn?: TransitionType
  transitionOut?: TransitionType
}

export interface EffectApplication {
  effectSlug: string
  ffmpegFilter: string
  parameters: Record<string, number | boolean | string>
  audioSync?: {
    parameter: string
    feature: keyof AudioFeatures
    mapping: 'linear' | 'exponential' | 'inverse'
    min: number
    max: number
  }
}

export type GenerativeType = 'particles' | 'waves' | 'geometric' | 'noise' | 'spectrum'
export type TransitionType = 'fade' | 'dissolve' | 'wipe' | 'zoom' | 'cut'

export interface RenderProgress {
  stage: 'preparing' | 'processing_footage' | 'applying_effects' | 'compositing' | 'finalizing'
  percent: number
  message: string
}

type ProgressCallback = (progress: RenderProgress) => void

// Temp directory for rendering
const TEMP_DIR = '/tmp/resonance-render'

/**
 * Main rendering pipeline
 */
export async function renderVideo(
  config: RenderConfig,
  visualPlan: VisualPlan,
  onProgress?: ProgressCallback
): Promise<string> {
  const workDir = join(TEMP_DIR, config.projectId)

  try {
    // Setup work directory
    if (existsSync(workDir)) {
      rmSync(workDir, { recursive: true })
    }
    mkdirSync(workDir, { recursive: true })

    // Stage 1: Download and prepare assets
    onProgress?.({ stage: 'preparing', percent: 0, message: 'Downloading assets...' })

    const audioPath = join(workDir, 'audio.mp3')
    await downloadFile(config.audioUrl, audioPath)

    const footagePaths: string[] = []
    for (let i = 0; i < config.footageUrls.length; i++) {
      const ext = config.footageUrls[i].split('.').pop() || 'mp4'
      const footagePath = join(workDir, `footage_${i}.${ext}`)
      await downloadFile(config.footageUrls[i], footagePath)
      footagePaths.push(footagePath)

      onProgress?.({
        stage: 'preparing',
        percent: ((i + 1) / config.footageUrls.length) * 20,
        message: `Downloaded footage ${i + 1}/${config.footageUrls.length}`
      })
    }

    // Stage 2: Process footage segments
    onProgress?.({ stage: 'processing_footage', percent: 20, message: 'Processing footage...' })

    const segmentPaths: string[] = []

    for (let i = 0; i < visualPlan.segments.length; i++) {
      const segment = visualPlan.segments[i]
      const segmentPath = join(workDir, `segment_${i}.mp4`)

      if (segment.footageIndex !== undefined && footagePaths[segment.footageIndex]) {
        // Process footage with effects
        await processFootageSegment(
          footagePaths[segment.footageIndex],
          segmentPath,
          segment,
          config
        )
      } else if (segment.generativeType) {
        // Generate procedural content with colors
        await generateProceduralSegment(
          segmentPath,
          segment,
          config,
          visualPlan.colorPalette
        )
      } else {
        // Black/solid color segment
        await createSolidSegment(
          segmentPath,
          segment,
          visualPlan.colorPalette[0] || '#000000',
          config
        )
      }

      segmentPaths.push(segmentPath)

      onProgress?.({
        stage: 'processing_footage',
        percent: 20 + ((i + 1) / visualPlan.segments.length) * 40,
        message: `Processed segment ${i + 1}/${visualPlan.segments.length}`
      })
    }

    // Stage 3: Apply transitions and composite
    onProgress?.({ stage: 'compositing', percent: 60, message: 'Compositing segments...' })

    const compositePath = join(workDir, 'composite.mp4')
    await concatenateVideos(segmentPaths, compositePath)

    // Stage 4: Add audio and finalize
    onProgress?.({ stage: 'finalizing', percent: 80, message: 'Adding audio...' })

    const outputPath = join(workDir, 'output.mp4')
    await runFFmpeg({
      inputPath: compositePath,
      outputPath,
      filters: [],
      audioPath,
      resolution: config.resolution,
      quality: 20
    })

    onProgress?.({ stage: 'finalizing', percent: 100, message: 'Complete!' })

    return outputPath
  } catch (error) {
    // Cleanup on error
    if (existsSync(workDir)) {
      rmSync(workDir, { recursive: true })
    }
    throw error
  }
}

/**
 * Process a footage clip with effects
 */
async function processFootageSegment(
  inputPath: string,
  outputPath: string,
  segment: VisualSegment,
  config: RenderConfig
): Promise<void> {
  // Build filter chain from effects
  const filters = buildFilterChain(
    segment.effects.map(effect => ({
      filter: effect.ffmpegFilter,
      parameters: effect.parameters
    }))
  )

  // Add footage visibility (opacity) if needed
  if (config.footageVisibility < 1) {
    filters.push(`colorchannelmixer=aa=${config.footageVisibility}`)
  }

  await runFFmpeg({
    inputPath,
    outputPath,
    filters,
    duration: segment.endTime - segment.startTime,
    startTime: 0,
    resolution: config.resolution
  })
}

/**
 * Generate procedural/generative content with sophisticated shaders
 */
async function generateProceduralSegment(
  outputPath: string,
  segment: VisualSegment,
  config: RenderConfig,
  colorPalette: string[] = ['#C45D3A', '#2A2621', '#F0EDE8']
): Promise<void> {
  const duration = segment.endTime - segment.startTime
  const fps = 30

  // Use sophisticated shader system if shaderType is specified
  let filter: string

  if (segment.shaderType) {
    // NEW: Use sophisticated GLSL-approximated shaders
    filter = buildShaderFilter({
      type: segment.shaderType,
      duration,
      audioFeatures: config.audioFeatures,
      colors: {
        primary: colorPalette[0] || '#C45D3A',
        secondary: colorPalette[1] || '#2A2621',
        accent: colorPalette[2] || '#F0EDE8'
      },
      intensity: config.effectIntensity
    }, config.resolution)
  } else {
    // LEGACY: Fallback to simple patterns for backward compatibility
    const primaryColor = colorPalette[0] || '#C45D3A'
    const r = parseInt(primaryColor.slice(1, 3), 16)
    const g = parseInt(primaryColor.slice(3, 5), 16)
    const b = parseInt(primaryColor.slice(5, 7), 16)

    // Convert RGB to YUV Cb/Cr for geq filter
    const cb = Math.round(128 + (-0.169 * r - 0.331 * g + 0.500 * b))
    const cr = Math.round(128 + (0.500 * r - 0.419 * g - 0.081 * b))

    switch (segment.generativeType) {
      case 'particles':
        filter = `color=c=0x${primaryColor.slice(1)}:s=1920x1080:d=${duration}:r=${fps},noise=alls=80:allf=t,gblur=sigma=3,eq=brightness=0.1:contrast=1.5:saturation=1.5`
        break

      case 'waves':
        filter = `nullsrc=s=1920x1080:d=${duration}:r=${fps},geq=lum='128+127*sin(2*PI*(X/W)*4+T*2)':cb='${cb}+20*sin(T*3)':cr='${cr}+20*cos(T*2)',eq=saturation=2:contrast=1.3`
        break

      case 'geometric':
        filter = `nullsrc=s=1920x1080:d=${duration}:r=${fps},geq=lum='128+127*sin(X/30+T*2)*cos(Y/30+T*3)':cb='${cb}+30*sin(X/100)':cr='${cr}+30*cos(Y/100)',eq=saturation=1.8:brightness=0.05`
        break

      case 'noise':
        filter = `color=c=0x${primaryColor.slice(1)}:s=1920x1080:d=${duration}:r=${fps},noise=alls=50:allf=t+u,hue=h=t*30:s=1.5,eq=contrast=1.4`
        break

      case 'spectrum':
        filter = `nullsrc=s=1920x1080:d=${duration}:r=${fps},geq=lum='255*pow(sin(X/W*PI*8+T*4),2)*(1-Y/H)':cb='${cb}+40*sin(X/W*PI*2)':cr='${cr}+40*cos(T*2)',eq=saturation=2:contrast=1.2`
        break

      default:
        filter = `nullsrc=s=1920x1080:d=${duration}:r=${fps},geq=lum='128+50*sin((X+T*200)/200)':cb='${cb}+30*sin(X/300+T)':cr='${cr}+30*cos(Y/300+T)',eq=saturation=1.5`
    }
  }

  const args = [
    '-y',
    '-f', 'lavfi',
    '-i', filter,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    outputPath
  ]

  const { spawn } = await import('child_process')

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args)

    let stderr = ''
    ffmpeg.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Generative render failed: ${stderr}`))
      }
    })
  })
}

/**
 * Create a solid color segment
 */
async function createSolidSegment(
  outputPath: string,
  segment: VisualSegment,
  color: string,
  config: RenderConfig
): Promise<void> {
  const duration = segment.endTime - segment.startTime

  // Convert hex color to FFmpeg format
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)

  const filter = `color=c=0x${color.slice(1)}:s=1920x1080:d=${duration}:r=30`

  const { spawn } = await import('child_process')
  const args = [
    '-y',
    '-f', 'lavfi',
    '-i', filter,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    outputPath
  ]

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args)

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Solid segment failed`))
      }
    })
  })
}

/**
 * Generate a visual plan from audio features
 * This is a placeholder for AI orchestration
 */
export function generateVisualPlan(
  audioFeatures: AudioFeatures,
  prompt: string,
  style: string,
  footageCount: number
): VisualPlan {
  const duration = audioFeatures.duration
  const sections = audioFeatures.sections || []

  // Default segments if no sections detected
  const segments: VisualSegment[] = []

  if (sections.length === 0) {
    // Create segments based on energy curve
    const segmentDuration = 10 // seconds per segment
    const numSegments = Math.ceil(duration / segmentDuration)

    for (let i = 0; i < numSegments; i++) {
      const startTime = i * segmentDuration
      const endTime = Math.min((i + 1) * segmentDuration, duration)

      segments.push({
        startTime,
        endTime,
        effects: getDefaultEffects(style),
        footageIndex: footageCount > 0 ? i % footageCount : undefined,
        generativeType: footageCount === 0 ? 'geometric' : undefined,
        transitionIn: i > 0 ? 'fade' : undefined
      })
    }
  } else {
    // Use detected sections
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]

      segments.push({
        startTime: section.startTime,
        endTime: section.endTime,
        effects: getEffectsForSection(section, style),
        footageIndex: footageCount > 0 ? i % footageCount : undefined,
        generativeType: footageCount === 0 ? getGenerativeForSection(section) : undefined,
        transitionIn: i > 0 ? 'fade' : undefined
      })
    }
  }

  return {
    segments,
    colorPalette: getColorPaletteForStyle(style),
    mood: getMoodFromFeatures(audioFeatures),
    narrative: `Generated from: ${prompt}`
  }
}

function getDefaultEffects(style: string): EffectApplication[] {
  const effects: EffectApplication[] = []

  switch (style) {
    case 'cinematic':
      effects.push({
        effectSlug: 'vignette',
        ffmpegFilter: 'vignette=angle=0.4:mode=backward',
        parameters: { angle: 0.4 }
      })
      effects.push({
        effectSlug: 'brightness-contrast',
        ffmpegFilter: 'eq=brightness=0.05:contrast=1.1',
        parameters: { brightness: 0.05, contrast: 1.1 }
      })
      break

    case 'psychedelic':
      effects.push({
        effectSlug: 'hue-rotate',
        ffmpegFilter: 'hue=h=0',
        parameters: { hue: 0 },
        audioSync: {
          parameter: 'hue',
          feature: 'spectralCentroid' as keyof AudioFeatures,
          mapping: 'linear',
          min: 0,
          max: 360
        }
      })
      effects.push({
        effectSlug: 'saturation',
        ffmpegFilter: 'eq=saturation=1.5',
        parameters: { saturation: 1.5 }
      })
      break

    case 'minimal':
      effects.push({
        effectSlug: 'saturation',
        ffmpegFilter: 'eq=saturation=0.5',
        parameters: { saturation: 0.5 }
      })
      break

    default: // organic
      effects.push({
        effectSlug: 'grain',
        ffmpegFilter: 'noise=alls=5:allf=t',
        parameters: { amount: 5 }
      })
  }

  return effects
}

function getEffectsForSection(
  section: { type: string; energy: number },
  style: string
): EffectApplication[] {
  const effects = getDefaultEffects(style)

  // Add effects based on section energy
  if (section.energy > 0.7) {
    effects.push({
      effectSlug: 'brightness-contrast',
      ffmpegFilter: 'eq=brightness=0.1:contrast=1.2',
      parameters: { brightness: 0.1, contrast: 1.2 }
    })
  }

  if (section.type === 'drop' || section.type === 'climax') {
    effects.push({
      effectSlug: 'saturation',
      ffmpegFilter: 'eq=saturation=1.3',
      parameters: { saturation: 1.3 }
    })
  }

  return effects
}

function getGenerativeForSection(section: { type: string; energy: number }): GenerativeType {
  if (section.energy > 0.7) {
    return 'particles'
  }
  if (section.type === 'breakdown' || section.type === 'quiet') {
    return 'waves'
  }
  return 'geometric'
}

function getColorPaletteForStyle(style: string): string[] {
  switch (style) {
    case 'cinematic':
      return ['#1a1a2e', '#16213e', '#0f3460', '#e94560']
    case 'psychedelic':
      return ['#ff006e', '#8338ec', '#3a86ff', '#ffbe0b']
    case 'minimal':
      return ['#ffffff', '#000000', '#808080']
    default:
      return ['#2d3436', '#636e72', '#b2bec3', '#dfe6e9']
  }
}

function getMoodFromFeatures(features: AudioFeatures): string {
  const energy = features.energyCurve?.reduce((a, b) => a + b, 0) || 0
  const avgEnergy = energy / (features.energyCurve?.length || 1)

  if (avgEnergy > 0.7) return 'energetic'
  if (avgEnergy > 0.4) return 'moderate'
  return 'calm'
}

/**
 * Cleanup temporary files
 */
export function cleanupRender(projectId: string): void {
  const workDir = join(TEMP_DIR, projectId)
  if (existsSync(workDir)) {
    rmSync(workDir, { recursive: true })
  }
}
