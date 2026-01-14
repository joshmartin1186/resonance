import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import type { AudioFeatures } from './audio-analyzer.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const SHADERS_DIR = join(__dirname, '../shaders')

// Shader types available
export type ShaderType =
  | 'perlin-noise'
  | 'particle-flow'
  | 'fractal-mandelbrot'
  | 'voronoi-cells'
  | 'reaction-diffusion'

export interface ShaderConfig {
  type: ShaderType
  duration: number
  audioFeatures: AudioFeatures
  colors: {
    primary: string    // hex color
    secondary: string
    accent: string
  }
  intensity: number    // 0-1
  parameters?: Record<string, number>
}

export interface ShaderUniforms {
  iTime: number
  iResolution: [number, number]
  iAudioEnergy: number
  iAudioBass: number
  iAudioMid: number
  iAudioHigh: number
  iAudioTransient: number
  iColorPrimary: [number, number, number]
  iColorSecondary: [number, number, number]
  iColorAccent: [number, number, number]
  iIntensity: number
}

/**
 * Load a GLSL shader from disk
 */
export function loadShader(type: ShaderType): string {
  const shaderPath = join(SHADERS_DIR, `${type}.glsl`)
  return readFileSync(shaderPath, 'utf-8')
}

/**
 * Convert hex color to RGB array (0-1 range)
 */
export function hexToRGB(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

/**
 * Extract audio features at a specific time
 */
export function getAudioFeaturesAtTime(
  audioFeatures: AudioFeatures,
  time: number
): {
  energy: number
  bass: number
  mid: number
  high: number
  transient: number
} {
  const duration = audioFeatures.duration
  const normalizedTime = Math.max(0, Math.min(1, time / duration))

  // Sample from curves
  const energyCurve = audioFeatures.energyCurve || []
  const energy = sampleCurve(energyCurve, normalizedTime)

  // Extract frequency bands (simplified - would use actual FFT data in production)
  // For now, use energy as proxy with some variation
  const bass = energy * (0.8 + Math.sin(time * 2) * 0.2)
  const mid = energy * (0.7 + Math.cos(time * 3) * 0.3)
  const high = energy * (0.6 + Math.sin(time * 5) * 0.4)

  // Detect transients (sudden energy spikes)
  const transient = detectTransient(energyCurve, normalizedTime)

  return {
    energy: clamp(energy, 0, 1),
    bass: clamp(bass, 0, 1),
    mid: clamp(mid, 0, 1),
    high: clamp(high, 0, 1),
    transient: clamp(transient, 0, 1)
  }
}

/**
 * Sample a value from a curve at normalized time (0-1)
 */
function sampleCurve(curve: number[], normalizedTime: number): number {
  if (curve.length === 0) return 0.5

  const index = Math.floor(normalizedTime * (curve.length - 1))
  const nextIndex = Math.min(index + 1, curve.length - 1)

  // Linear interpolation
  const t = (normalizedTime * (curve.length - 1)) - index
  return curve[index] * (1 - t) + curve[nextIndex] * t
}

/**
 * Detect transient (sudden spike) at normalized time
 */
function detectTransient(curve: number[], normalizedTime: number): number {
  if (curve.length < 3) return 0

  const index = Math.floor(normalizedTime * (curve.length - 1))
  if (index < 1 || index >= curve.length - 1) return 0

  const prev = curve[index - 1]
  const curr = curve[index]
  const next = curve[index + 1]

  // Detect spike: current much higher than neighbors
  const spike = curr - Math.max(prev, next)
  return Math.max(0, spike * 5) // Amplify
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Build FFmpeg filter string for shader rendering
 * Uses FFmpeg's GLSL filter (requires custom build) or approximation
 */
export function buildShaderFilter(
  config: ShaderConfig,
  resolution: '480p' | '720p' | '1080p' | '4K'
): string {
  const { type, duration, audioFeatures, colors, intensity } = config

  // Resolution mapping
  const resolutions = {
    '480p': [854, 480],
    '720p': [1280, 720],
    '1080p': [1920, 1080],
    '4K': [3840, 2160]
  }
  const [width, height] = resolutions[resolution]

  // For now, we'll use FFmpeg's built-in filters to approximate shaders
  // In production, you'd compile a custom FFmpeg with GLSL filter support
  // or use an external GPU rendering pipeline

  return buildApproximateFilter(type, duration, audioFeatures, colors, intensity, width, height)
}

/**
 * Build approximate shader effect using FFmpeg's native filters
 * This is a fallback until we have GLSL filter support
 */
function buildApproximateFilter(
  type: ShaderType,
  duration: number,
  audioFeatures: AudioFeatures,
  colors: { primary: string; secondary: string; accent: string },
  intensity: number,
  width: number,
  height: number
): string {
  const primaryRGB = hexToRGB(colors.primary)
  const secondaryRGB = hexToRGB(colors.secondary)
  const accentRGB = hexToRGB(colors.accent)

  switch (type) {
    case 'perlin-noise':
      // Approximate with noise + color modulation
      return `nullsrc=s=${width}x${height}:d=${duration}:r=30,` +
        `noise=alls=20:allf=t+u,` +
        `hue=h='t*30*${intensity}':s='1+${intensity}',` +
        `curves=all='0/0 0.5/${intensity} 1/1',` +
        `eq=saturation=${1 + intensity}`

    case 'particle-flow':
      // Approximate with noise + displacement
      const blurAmount = 3 + intensity * 5
      return `nullsrc=s=${width}x${height}:d=${duration}:r=30,` +
        `noise=alls=80:allf=t,` +
        `gblur=sigma=${blurAmount},` +
        `eq=brightness=0.1:contrast=${1 + intensity * 0.5}:saturation=${1.5 + intensity}`

    case 'fractal-mandelbrot':
      // Fast psychedelic pattern (complex geq expressions are too slow)
      const scale = 30 + intensity * 20
      return `nullsrc=s=${width}x${height}:d=${duration}:r=30,` +
        `geq=lum='128+127*sin(X/${scale}+T*2)*cos(Y/${scale}+T*3)':` +
        `cb='128+${Math.floor(primaryRGB[2] * 100)}*sin(X/${scale*2})':` +
        `cr='128+${Math.floor(accentRGB[0] * 100)}*cos(Y/${scale*2})',` +
        `eq=saturation=${1.5 + intensity}:brightness=${intensity * 0.1}`

    case 'voronoi-cells':
      // Approximate with cellular patterns using geq
      const cellScale = 20 + intensity * 40
      return `nullsrc=s=${width}x${height}:d=${duration}:r=30,` +
        `geq=lum='128+127*sin((X+T*${cellScale})/${cellScale})*cos((Y+T*${cellScale})/${cellScale})':` +
        `cb='128+${Math.floor(primaryRGB[2] * 127)}*sin(X/${cellScale*2})':` +
        `cr='128+${Math.floor(accentRGB[0] * 127)}*cos(Y/${cellScale*2})',` +
        `eq=saturation=${1 + intensity * 0.8}`

    case 'reaction-diffusion':
      // Organic patterns with layered sine waves
      return `nullsrc=s=${width}x${height}:d=${duration}:r=30,` +
        `geq=lum='128+127*sin(X/20+T)*cos(Y/20+T)*sin((X+Y)/30+T*2)':` +
        `cb='128+50*sin(X/40+T*0.5)':` +
        `cr='128+50*cos(Y/40+T*0.5)',` +
        `eq=saturation=${1.5 + intensity}:contrast=${1 + intensity * 0.5}`

    default:
      return `color=c=${colors.primary}:s=${width}x${height}:d=${duration}:r=30`
  }
}

/**
 * Get shader metadata
 */
export function getShaderInfo(type: ShaderType): {
  name: string
  description: string
  complexity: 'low' | 'medium' | 'high'
  audioReactive: boolean
} {
  const shaderInfo = {
    'perlin-noise': {
      name: 'Perlin Noise Flow',
      description: 'Organic flowing patterns with fractal noise layers',
      complexity: 'medium' as const,
      audioReactive: true
    },
    'particle-flow': {
      name: 'Particle Flow Field',
      description: 'GPU particle system guided by Perlin noise flow fields',
      complexity: 'high' as const,
      audioReactive: true
    },
    'fractal-mandelbrot': {
      name: 'Mandelbrot Fractal',
      description: 'Dynamic fractal zoom with audio-reactive exploration',
      complexity: 'high' as const,
      audioReactive: true
    },
    'voronoi-cells': {
      name: 'Voronoi Cells',
      description: 'Organic cellular patterns with animated boundaries',
      complexity: 'medium' as const,
      audioReactive: true
    },
    'reaction-diffusion': {
      name: 'Reaction-Diffusion',
      description: 'Biological pattern formation like coral and tiger stripes',
      complexity: 'medium' as const,
      audioReactive: true
    }
  }

  return shaderInfo[type]
}

/**
 * List all available shaders
 */
export function listShaders(): ShaderType[] {
  return [
    'perlin-noise',
    'particle-flow',
    'fractal-mandelbrot',
    'voronoi-cells',
    'reaction-diffusion'
  ]
}
