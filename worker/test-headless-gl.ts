/**
 * Test script for headless-gl renderer
 */

import { renderShaderVideo } from './src/lib/headless-gl-renderer';

async function test() {
  console.log('Testing headless-gl renderer...');

  try {
    await renderShaderVideo({
      shaderType: 'perlin-noise',
      duration: 2, // 2 seconds = 60 frames at 30fps
      width: 1920,
      height: 1080,
      fps: 30,
      colors: {
        primary: '#C45D3A',
        secondary: '#2A2621',
        accent: '#F0EDE8'
      },
      intensity: 0.8
    }, '/tmp/test-headless-gl.mp4');

    console.log('✅ Test successful! Video saved to /tmp/test-headless-gl.mp4');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();
