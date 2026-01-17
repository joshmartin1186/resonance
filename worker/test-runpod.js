/**
 * Test RunPod GPU rendering endpoint
 *
 * Usage: RUNPOD_API_KEY=your-key node test-runpod.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '../.env.local' });

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID || '2jjimdvncpd577';

if (!RUNPOD_API_KEY) {
  console.error('❌ RUNPOD_API_KEY environment variable is required');
  console.log('   Add it to .env.local or run with:');
  console.log('   RUNPOD_API_KEY=your-key node test-runpod.js');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRunPod() {
  console.log('🚀 Testing RunPod GPU Rendering Endpoint\n');

  // 1. Find a test project
  console.log('🔍 Finding test project...');
  const { data: projects, error: fetchError } = await supabase
    .from('projects')
    .select('id, status, audio_url, prompt, created_at')
    .not('audio_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchError || !projects || projects.length === 0) {
    console.error('❌ No projects found with audio:', fetchError);
    process.exit(1);
  }

  const project = projects[0];
  console.log(`✓ Found project: ${project.id}`);
  console.log(`  Status: ${project.status}`);
  console.log(`  Prompt: ${project.prompt || 'None'}`);
  console.log(`  Audio: ${project.audio_url ? 'Yes' : 'No'}\n`);

  // 2. Reset project status
  console.log('🔄 Resetting project to queued...');
  const { error: updateError } = await supabase
    .from('projects')
    .update({
      status: 'queued',
      video_url: null,
      error: null,
      completed_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', project.id);

  if (updateError) {
    console.error('❌ Error updating project:', updateError);
    process.exit(1);
  }
  console.log('✓ Project reset to queued\n');

  // 3. Trigger RunPod job
  console.log('🎬 Triggering RunPod job...');
  const response = await fetch(
    `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/run`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUNPOD_API_KEY}`
      },
      body: JSON.stringify({
        input: {
          projectId: project.id
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ RunPod API error:', response.status, errorText);
    process.exit(1);
  }

  const result = await response.json();
  console.log('✓ RunPod job started:', result.id);
  console.log(`  Status: ${result.status}\n`);

  // 4. Poll for completion
  console.log('⏳ Polling for completion (checking every 10 seconds)...\n');

  const jobId = result.id;
  let attempts = 0;
  const maxAttempts = 60; // 10 minutes max

  while (attempts < maxAttempts) {
    attempts++;

    // Wait 10 seconds between checks
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check status
    const statusResponse = await fetch(
      `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/status/${jobId}`,
      {
        headers: {
          'Authorization': `Bearer ${RUNPOD_API_KEY}`
        }
      }
    );

    const status = await statusResponse.json();

    console.log(`[${new Date().toLocaleTimeString()}] Status: ${status.status}`);

    if (status.status === 'COMPLETED') {
      console.log('\n✅ Job completed successfully!');
      console.log('Output:', JSON.stringify(status.output, null, 2));

      // Check project in database
      const { data: updatedProject } = await supabase
        .from('projects')
        .select('status, video_url, error')
        .eq('id', project.id)
        .single();

      console.log('\n📊 Final project status:');
      console.log(`  Status: ${updatedProject.status}`);
      console.log(`  Video URL: ${updatedProject.video_url || 'None'}`);
      console.log(`  Error: ${updatedProject.error || 'None'}`);

      if (updatedProject.video_url) {
        console.log('\n🎉 SUCCESS! Video generated and uploaded to Supabase Storage');
        console.log(`   View at: ${updatedProject.video_url}`);
      }

      process.exit(0);
    }

    if (status.status === 'FAILED') {
      console.log('\n❌ Job failed!');
      console.log('Error:', status.error);
      process.exit(1);
    }

    // Still running - show progress if available
    if (status.status === 'IN_PROGRESS') {
      console.log('  → Rendering in progress on GPU...');
    }
  }

  console.log('\n⏱️  Timeout: Job took longer than 10 minutes');
  console.log('Check RunPod dashboard for details');
  process.exit(1);
}

testRunPod().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
