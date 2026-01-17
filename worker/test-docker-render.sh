#!/bin/bash
# Test node-based renderer inside Docker container

echo "=== Docker Renderer Test ==="
echo ""

# Check if audio file exists (we'll mount it)
if [ ! -f "/tmp/test-audio.mp3" ]; then
  echo "Error: /tmp/test-audio.mp3 not found"
  exit 1
fi

echo "Audio file found: /tmp/test-audio.mp3"
echo ""

# Run the node-based renderer test
node -e "
import { renderNodeBasedVideo } from './dist/lib/node-based-renderer.js';

(async () => {
  try {
    console.log('Starting render test...');

    await renderNodeBasedVideo({
      audioPath: '/tmp/test-audio.mp3',
      outputPath: '/tmp/docker-test-output.mp4',
      duration: 30, // Just 30 seconds for quick test
      width: 1280,
      height: 720,
      fps: 30,
      colors: {
        primary: '#C45D3A',
        secondary: '#F8F6F3',
        accent: '#2A2621'
      },
      intensity: 0.7,
      useAI: false,
      parallel: true
    });

    console.log('✅ Render complete!');
    console.log('Output: /tmp/docker-test-output.mp4');
  } catch (error) {
    console.error('❌ Render failed:', error);
    process.exit(1);
  }
})();
"
