import { spawn } from 'child_process'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { pipeline } from 'stream/promises'

// Types
export interface FFmpegOptions {
  inputPath: string
  outputPath: string
  filters: string[]
  duration?: number
  startTime?: number
  audioPath?: string
  resolution?: '480p' | '720p' | '1080p' | '4K'
  fps?: number
  codec?: 'h264' | 'h265' | 'vp9'
  quality?: number // CRF value, lower = better (18-28 typical)
}

export interface FFmpegProgress {
  frame: number
  fps: number
  time: number
  speed: number
  percent: number
}

type ProgressCallback = (progress: FFmpegProgress) => void

// Resolution presets
const RESOLUTIONS: Record<string, { width: number; height: number }> = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4K': { width: 3840, height: 2160 }
}

// Codec presets
const CODECS: Record<string, { codec: string; preset: string }> = {
  h264: { codec: 'libx264', preset: 'medium' },
  h265: { codec: 'libx265', preset: 'medium' },
  vp9: { codec: 'libvpx-vp9', preset: '' }
}

/**
 * Execute FFmpeg command with progress tracking
 */
export async function runFFmpeg(
  options: FFmpegOptions,
  onProgress?: ProgressCallback
): Promise<void> {
  const {
    inputPath,
    outputPath,
    filters,
    duration,
    startTime,
    audioPath,
    resolution = '1080p',
    fps = 30,
    codec = 'h264',
    quality = 23
  } = options

  const res = RESOLUTIONS[resolution]
  const codecConfig = CODECS[codec]

  // Build FFmpeg arguments
  const args: string[] = [
    '-y', // Overwrite output
    '-hide_banner',
    '-loglevel', 'info',
    '-progress', 'pipe:1' // Output progress to stdout
  ]

  // Input options
  if (startTime !== undefined) {
    args.push('-ss', String(startTime))
  }

  args.push('-i', inputPath)

  // Add audio if provided
  if (audioPath) {
    args.push('-i', audioPath)
  }

  // Duration
  if (duration !== undefined) {
    args.push('-t', String(duration))
  }

  // Build filter complex
  const allFilters: string[] = [
    ...filters,
    `scale=${res.width}:${res.height}:force_original_aspect_ratio=decrease`,
    `pad=${res.width}:${res.height}:(ow-iw)/2:(oh-ih)/2`,
    `fps=${fps}`
  ]

  args.push('-vf', allFilters.join(','))

  // Video codec settings
  args.push('-c:v', codecConfig.codec)
  if (codecConfig.preset) {
    args.push('-preset', codecConfig.preset)
  }
  args.push('-crf', String(quality))

  // Audio settings
  if (audioPath) {
    args.push('-c:a', 'aac', '-b:a', '192k')
    args.push('-map', '0:v:0', '-map', '1:a:0')
  } else {
    args.push('-an') // No audio
  }

  // Output
  args.push('-movflags', '+faststart') // Web-friendly MP4
  args.push(outputPath)

  console.log('FFmpeg command:', 'ffmpeg', args.join(' '))

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args)

    let stderr = ''
    let totalDuration = duration || 0

    ffmpeg.stdout.on('data', (data: Buffer) => {
      const output = data.toString()

      // Parse progress
      if (onProgress && totalDuration > 0) {
        const progress = parseProgress(output, totalDuration)
        if (progress) {
          onProgress(progress)
        }
      }
    })

    ffmpeg.stderr.on('data', (data: Buffer) => {
      const output = data.toString()
      stderr += output

      // Extract duration from input file analysis
      const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
      if (durationMatch && !duration) {
        const [, h, m, s] = durationMatch
        totalDuration = parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s)
      }
    })

    ffmpeg.on('error', (err) => {
      reject(new Error(`FFmpeg spawn error: ${err.message}`))
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`))
      }
    })
  })
}

/**
 * Parse FFmpeg progress output
 */
function parseProgress(output: string, totalDuration: number): FFmpegProgress | null {
  const lines = output.split('\n')

  let frame = 0
  let fps = 0
  let time = 0
  let speed = 0

  for (const line of lines) {
    if (line.startsWith('frame=')) {
      frame = parseInt(line.split('=')[1]) || 0
    } else if (line.startsWith('fps=')) {
      fps = parseFloat(line.split('=')[1]) || 0
    } else if (line.startsWith('out_time_ms=')) {
      time = parseInt(line.split('=')[1]) / 1000000 || 0
    } else if (line.startsWith('speed=')) {
      const speedStr = line.split('=')[1]?.replace('x', '')
      speed = parseFloat(speedStr) || 0
    }
  }

  if (frame > 0) {
    return {
      frame,
      fps,
      time,
      speed,
      percent: totalDuration > 0 ? (time / totalDuration) * 100 : 0
    }
  }

  return null
}

/**
 * Build a filter chain from effect instances
 */
export function buildFilterChain(
  effects: {
    filter: string
    parameters: Record<string, number | boolean | string>
  }[]
): string[] {
  return effects.map(({ filter, parameters }) => {
    let result = filter

    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = `{{${key}}}`
      result = result.replace(new RegExp(placeholder, 'g'), String(value))
    }

    return result
  })
}

/**
 * Download a file from URL to local path
 */
export async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`)
  }

  if (!response.body) {
    throw new Error('No response body')
  }

  // Ensure directory exists
  const dir = join(outputPath, '..')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const fileStream = createWriteStream(outputPath)

  // @ts-expect-error - Node.js stream compatibility
  await pipeline(response.body, fileStream)
}

/**
 * Get video metadata using ffprobe
 */
export async function getVideoMetadata(inputPath: string): Promise<{
  duration: number
  width: number
  height: number
  fps: number
  codec: string
}> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      inputPath
    ]

    const ffprobe = spawn('ffprobe', args)

    let stdout = ''
    let stderr = ''

    ffprobe.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    ffprobe.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}: ${stderr}`))
        return
      }

      try {
        const data = JSON.parse(stdout)
        const videoStream = data.streams?.find((s: { codec_type: string }) => s.codec_type === 'video')

        if (!videoStream) {
          reject(new Error('No video stream found'))
          return
        }

        // Parse frame rate (e.g., "30/1" or "29.97")
        let fps = 30
        if (videoStream.r_frame_rate) {
          const [num, den] = videoStream.r_frame_rate.split('/')
          fps = den ? parseInt(num) / parseInt(den) : parseFloat(num)
        }

        resolve({
          duration: parseFloat(data.format?.duration || '0'),
          width: videoStream.width || 1920,
          height: videoStream.height || 1080,
          fps,
          codec: videoStream.codec_name || 'unknown'
        })
      } catch (err) {
        reject(new Error(`Failed to parse ffprobe output: ${err}`))
      }
    })
  })
}

/**
 * Concatenate multiple video files
 */
export async function concatenateVideos(
  inputPaths: string[],
  outputPath: string,
  onProgress?: ProgressCallback
): Promise<void> {
  // Create concat file
  const concatFilePath = outputPath.replace('.mp4', '_concat.txt')
  const concatContent = inputPaths.map(p => `file '${p}'`).join('\n')

  const { writeFileSync } = await import('fs')
  writeFileSync(concatFilePath, concatContent)

  const args = [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFilePath,
    '-c', 'copy',
    outputPath
  ]

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args)

    ffmpeg.on('error', (err) => {
      reject(new Error(`FFmpeg concat error: ${err.message}`))
    })

    ffmpeg.on('close', (code) => {
      // Clean up concat file
      try {
        const { unlinkSync } = require('fs')
        unlinkSync(concatFilePath)
      } catch {
        // Ignore cleanup errors
      }

      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`FFmpeg concat exited with code ${code}`))
      }
    })
  })
}

/**
 * Create a still image video from a single image
 */
export async function imageToVideo(
  imagePath: string,
  outputPath: string,
  duration: number,
  options: Partial<FFmpegOptions> = {}
): Promise<void> {
  const args = [
    '-y',
    '-loop', '1',
    '-i', imagePath,
    '-t', String(duration),
    '-vf', `scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30`,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    outputPath
  ]

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
        reject(new Error(`FFmpeg image to video failed: ${stderr}`))
      }
    })
  })
}
