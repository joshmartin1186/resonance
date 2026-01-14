#!/usr/bin/env tsx

/**
 * Test script for the new shader rendering system
 * Run with: npx tsx test-shader-render.ts
 */

import { buildShaderFilter, listShaders, getShaderInfo, type ShaderType } from './src/lib/shader-manager.js'
import type { AudioFeatures } from './src/lib/audio-analyzer.js'
import { spawn } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const TEST_DIR = '/tmp/resonance-shader-test'

// Mock audio features for testing
const mockAudioFeatures: AudioFeatures = {
  duration: 10,
  tempo: 120,
  key: 'C',
  timeSignature: '4/4',
  energyCurve: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.8, 0.6, 0.4],
  spectralCentroid: [1000, 1100, 1200, 1300, 1400, 1500, 1400, 1300, 1200, 1100],
  sections: [
    { startTime: 0, endTime: 5, type: 'intro', energy: 0.4 },
    { startTime: 5, endTime: 10, type: 'verse', energy: 0.7 }
  ]
}

async function testShaderRender(shaderType: ShaderType) {
  console.log(`\n🎨 Testing shader: ${shaderType}`)

  const info = getShaderInfo(shaderType)
  console.log(`   Name: ${info.name}`)
  console.log(`   Description: ${info.description}`)
  console.log(`   Complexity: ${info.complexity}`)
  console.log(`   Audio Reactive: ${info.audioReactive}`)

  // Build filter
  const filter = buildShaderFilter({
    type: shaderType,
    duration: 5, // Short 5-second test
    audioFeatures: mockAudioFeatures,
    colors: {
      primary: '#FF006E',
      secondary: '#8338EC',
      accent: '#3A86FF'
    },
    intensity: 0.8
  }, '720p')

  console.log(`   Filter: ${filter.substring(0, 100)}...`)

  // Render to video
  const outputPath = join(TEST_DIR, `test-${shaderType}.mp4`)

  console.log(`   Rendering to: ${outputPath}`)

  const args = [
    '-y',
    '-f', 'lavfi',
    '-i', filter,
    '-c:v', 'libx264',
    '-preset', 'ultrafast', // Fast for testing
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-t', '5', // 5 seconds
    outputPath
  ]

  return new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args)

    let stderr = ''
    ffmpeg.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`   ✅ Success! Video created: ${outputPath}`)
        resolve()
      } else {
        console.error(`   ❌ Failed: ${stderr.split('\n').slice(-5).join('\n')}`)
        reject(new Error(`FFmpeg failed with code ${code}`))
      }
    })
  })
}

async function main() {
  console.log('🚀 Resonance Shader System Test')
  console.log('================================\n')

  // Setup test directory
  if (!existsSync(TEST_DIR)) {
    mkdirSync(TEST_DIR, { recursive: true })
  }

  // List all available shaders
  const shaders = listShaders()
  console.log(`Found ${shaders.length} shaders:`)
  shaders.forEach(shader => console.log(`  - ${shader}`))

  // Test each shader
  for (const shader of shaders) {
    try {
      await testShaderRender(shader)
    } catch (error) {
      console.error(`Failed to render ${shader}:`, error)
    }
  }

  console.log('\n✨ All tests complete!')
  console.log(`\nOutput videos saved to: ${TEST_DIR}`)
  console.log('Preview them with: open ' + TEST_DIR)
}

main().catch(console.error)
