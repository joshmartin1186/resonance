// Test upload system with a small test file
import { uploadVideoWithFallbacks } from './dist/lib/upload-manager.js'
import { writeFileSync } from 'fs'
import { join } from 'path'

async function testUpload() {
  console.log('🧪 Testing upload system...\n')

  // Create a small test MP4 file (1MB of random data)
  const testPath = '/tmp/test-upload.mp4'
  const testData = Buffer.alloc(1024 * 1024, 'test') // 1MB
  writeFileSync(testPath, testData)

  const videoFileName = `test/${Date.now()}.mp4`
  const projectId = 'test-upload-' + Date.now()

  try {
    console.log(`📤 Testing upload of ${videoFileName}...\n`)

    const result = await uploadVideoWithFallbacks(testPath, videoFileName, projectId)

    console.log(`\n✅ Upload test PASSED!`)
    console.log(`   Method: ${result.method}`)
    console.log(`   URL: ${result.url}`)
    console.log(`   Attempts: ${result.attempts}`)

    // Cleanup test file from storage
    const { supabase } = await import('./dist/lib/supabase.js')
    await supabase.storage.from('video-outputs').remove([videoFileName])
    console.log(`\n🧹 Cleaned up test file`)

    process.exit(0)
  } catch (error) {
    console.error(`\n❌ Upload test FAILED:`, error.message)
    console.error(`\nCheck /tmp/resonance-debug-videos for saved test file`)
    process.exit(1)
  }
}

testUpload()
