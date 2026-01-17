/**
 * Trigger a new generation by finding the latest project and re-queuing it
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function triggerGeneration() {
  console.log('🔍 Finding most recent completed project...\n');

  // Get most recent completed/failed project
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, status, audio_url, prompt, created_at')
    .in('status', ['completed', 'failed'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ Error fetching projects:', error);
    process.exit(1);
  }

  if (!projects || projects.length === 0) {
    console.log('❌ No completed/failed projects found');
    process.exit(1);
  }

  const project = projects[0];
  console.log(`✓ Found project: ${project.id}`);
  console.log(`  Status: ${project.status}`);
  console.log(`  Prompt: ${project.prompt || 'None'}`);
  console.log(`  Audio: ${project.audio_url ? 'Yes' : 'No'}\n`);

  // Reset project to queued status
  console.log('🔄 Re-queuing project for generation with NEW enhanced renderer...\n');

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

  console.log('✅ Project queued successfully!');
  console.log(`   Project ID: ${project.id}`);
  console.log(`   Watch logs: tail -f /tmp/worker-jan16-new.log\n`);
  console.log('⏳ Worker will pick it up within 5 seconds...\n');
}

triggerGeneration();
