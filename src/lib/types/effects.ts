// Effect Library Types
// Phase 4: Effect Library & Rendering

export type EffectCategoryId = 'geometric' | 'distortion' | 'color' | 'blur' | 'pattern'

export interface EffectCategory {
  id: EffectCategoryId
  name: string
  description: string | null
  icon: string | null
  sort_order: number
  created_at: string
}

export type ParameterType = 'number' | 'boolean' | 'color' | 'string' | 'select'

export interface EffectParameter {
  name: string
  type: ParameterType
  min?: number
  max?: number
  default: number | boolean | string
  options?: string[] // For select type
  label?: string
  description?: string
}

export type AudioFeature =
  | 'energy'
  | 'rms'
  | 'pitch'
  | 'tempo'
  | 'spectral_centroid'
  | 'spectral_contrast'
  | 'transients'
  | 'key'
  | 'loudness'

export type MappingType =
  | 'linear'
  | 'exponential'
  | 'logarithmic'
  | 'inverse'
  | 'threshold'
  | 'oscillate'

export interface AudioSyncOption {
  parameter: string
  features: AudioFeature[]
  mappings: MappingType[]
}

export type LayerType = 'footage' | 'generative' | 'composite'

export interface Effect {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: EffectCategoryId

  // FFmpeg configuration
  ffmpeg_filter: string
  parameters: EffectParameter[]
  audio_sync_options: AudioSyncOption[]

  // Rendering info
  layer_types: LayerType[]
  requires_gpu: boolean
  render_complexity: 1 | 2 | 3 | 4 | 5

  // Preview
  preview_thumbnail_url: string | null
  preview_video_url: string | null

  // Metadata
  tags: string[]
  is_active: boolean
  is_premium: boolean

  created_at: string
  updated_at: string
}

export interface AudioSyncConfig {
  feature: AudioFeature
  mapping: MappingType
  min: number
  max: number
  sensitivity?: number // 0-1, how much the audio affects the parameter
  smoothing?: number // 0-1, temporal smoothing
}

export interface EffectPreset {
  id: string
  effect_id: string
  organization_id: string | null

  name: string
  description: string | null

  // Saved parameter values
  parameters: Record<string, number | boolean | string>

  // Audio sync settings per parameter
  audio_sync: Record<string, AudioSyncConfig> | null

  is_system_preset: boolean
  is_public: boolean

  created_at: string
  updated_at: string
}

// Timeline types for effect sequencing
export interface EffectInstance {
  id: string
  effect_id: string
  preset_id?: string

  // Timing (in seconds)
  start_time: number
  end_time: number

  // Parameter values (overrides preset if set)
  parameters: Record<string, number | boolean | string>

  // Audio sync (overrides preset if set)
  audio_sync: Record<string, AudioSyncConfig>

  // Blending
  opacity: number // 0-1
  blend_mode: BlendMode

  // Easing for parameter transitions
  ease_in?: number // seconds
  ease_out?: number // seconds
}

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'

// Visual plan from AI orchestration
export interface VisualPlan {
  id: string
  generation_id: string

  // Narrative arc
  narrative: {
    theme: string
    mood_progression: string[]
    key_moments: {
      time: number
      description: string
      intensity: number
    }[]
  }

  // Layer configurations
  layers: {
    footage: {
      clips: {
        footage_id: string
        start_time: number
        end_time: number
        effects: EffectInstance[]
      }[]
    }
    effects: {
      instances: EffectInstance[]
    }
    generative: {
      type: GenerativeType
      config: Record<string, unknown>
      effects: EffectInstance[]
    }[]
  }

  // Global settings
  color_palette: string[]
  dominant_mood: string

  created_at: string
}

export type GenerativeType =
  | 'particles'
  | 'waves'
  | 'geometric'
  | 'fractal'
  | 'noise'
  | 'spectrum'

// Utility functions
export function interpolateParameter(
  value: number,
  audioValue: number,
  config: AudioSyncConfig
): number {
  const { min, max, mapping, sensitivity = 1, smoothing = 0 } = config
  const range = max - min

  let mapped: number
  switch (mapping) {
    case 'linear':
      mapped = audioValue
      break
    case 'exponential':
      mapped = Math.pow(audioValue, 2)
      break
    case 'logarithmic':
      mapped = Math.log(audioValue * 9 + 1) / Math.log(10)
      break
    case 'inverse':
      mapped = 1 - audioValue
      break
    case 'threshold':
      mapped = audioValue > 0.5 ? 1 : 0
      break
    case 'oscillate':
      mapped = Math.sin(audioValue * Math.PI * 2) * 0.5 + 0.5
      break
    default:
      mapped = audioValue
  }

  // Apply sensitivity
  const affected = value + (mapped * range * sensitivity)

  // Clamp to range
  return Math.max(min, Math.min(max, affected))
}

export function buildFFmpegFilter(
  effect: Effect,
  parameters: Record<string, number | boolean | string>
): string {
  let filter = effect.ffmpeg_filter

  for (const [key, value] of Object.entries(parameters)) {
    const placeholder = `{{${key}}}`
    filter = filter.replace(new RegExp(placeholder, 'g'), String(value))
  }

  return filter
}
