#!/usr/bin/env tsx

/**
 * Direct test of shader rendering without full pipeline
 * This demonstrates the new shader system in action
 */

import { generateProceduralSegment } from './src/lib/renderer.js'
import type { VisualSegment, RenderConfig } from './src/lib/renderer.js'
import type { AudioFeatures } from './src/lib/audio-analyzer.js'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const TEST_DIR = '/tmp/resonance-full-shader-test'
const OUTPUT_DIR = join(TEST_DIR, 'outputs')

// Mock audio features
const mockAudioFeatures: AudioFeatures = {
  duration: 30,
  tempo: 120,
  key: 'C',
  timeSignature: '4/4',
  energyCurve: Array(30).fill(0).map((_, i) => 0.3 + Math.sin(i / 5) * 0.7),
  spectralCentroid: [],
  sections: [
    { startTime: 0, endTime: 10, type: 'intro', energy: 0.4 },
    { startTime: 10, endTime: 20, type: 'verse', energy: 0.7 },
    { startTime: 20, endTime: 30, type: 'chorus', energy: 0.9 }
  ]
}

const config: RenderConfig = {
  projectId: 'test-shader-demo',
  audioUrl: '',
  audioFeatures: mockAudioFeatures,
  footageUrls: [],
  prompt: 'Test shader rendering',
  style: 'psychedelic',
  resolution: '720p',
  effectIntensity: 0.8,
  footageVisibility: 1
}

const colorPalette = ['#FF006E', '#8338EC', '#3A86FF']

async function testShader(shaderType: any, duration: number) {
  console.log(`\\n🎨 Rendering ${shaderType} shader...`)

  const segment: VisualSegment = {
    startTime: 0,
    endTime: duration,
    effects: [],
    shaderType: shaderType as any, // NEW SHADER SYSTEM!
    transitionIn: 'fade'
  }

  const outputPath = join(OUTPUT_DIR, `${shaderType}.mp4`)

  try {
    // This uses the new shader system internally
    await generateProceduralSegment(outputPath, segment, config, colorPalette)
    console.log(`   ✅ Rendered: ${outputPath}`)
    return true
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Resonance NEW Shader System - Direct Render Test')
  console.log('=====================================================\\n')

  // Setup
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const shaders = [
    'perlin-noise',
    'particle-flow',
    'fractal-mandelbrot',
    'voronoi-cells',
    'reaction-diffusion'
  ]

  let successCount = 0

  for (const shader of shaders) {
    const success = await testShader(shader, 10) // 10 seconds each
    if (success) successCount++
  }

  console.log(`\\n✨ Test complete: ${successCount}/${shaders.length} shaders rendered successfully`)
  console.log(`\\nOutput directory: ${OUTPUT_DIR}`)
  console.log('Preview: open ' + OUTPUT_DIR)
}

main().catch(console.error)
