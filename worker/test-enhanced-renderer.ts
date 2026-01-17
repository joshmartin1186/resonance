/**
 * Test the enhanced renderer with 20x complexity
 */

import { renderNodeBasedVideo } from './src/lib/node-based-renderer.js';

async function testEnhancedRenderer() {
  console.log('=== Enhanced Renderer Test ===\n');

  // Use the audio file from previous generation
  const audioPath = '/tmp/resonance-render/a76591f8-dbba-4859-a182-b8410d8229be/audio.mp3';
  const outputPath = '/tmp/enhanced-test-output.mp4';

  console.log(`Audio file: ${audioPath}`);
  console.log(`Output: ${outputPath}\n`);

  try {
    await renderNodeBasedVideo({
      audioPath,
      outputPath,
      duration: 420, // 7 minutes max
      width: 1920,
      height: 1080,
      fps: 30,
      colors: {
        primary: '#C45D3A',
        secondary: '#F8F6F3',
        accent: '#2A2621'
      },
      intensity: 0.7,
      useAI: false, // Use enhanced timeline
      parallel: true
    });

    console.log('\n✅ Test complete!');
    console.log(`Video saved to: ${outputPath}`);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testEnhancedRenderer();
