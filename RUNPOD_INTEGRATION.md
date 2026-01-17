# RunPod Integration Guide

How to integrate RunPod GPU rendering into your Next.js app.

## Environment Variables

Add to `.env.local`:

```bash
RUNPOD_API_KEY=your-runpod-api-key
RUNPOD_ENDPOINT_ID=your-endpoint-id
```

## API Route Example

Update `src/app/api/projects/[id]/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  try {
    // 1. Update project status to 'processing'
    await supabase
      .from('projects')
      .update({ status: 'processing' })
      .eq('id', projectId);

    // 2. Trigger RunPod job
    const response = await fetch(
      `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/run`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`
        },
        body: JSON.stringify({
          input: {
            projectId: projectId
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to start RunPod job');
    }

    const { id: jobId } = await response.json();

    // 3. Store job ID for tracking
    await supabase
      .from('projects')
      .update({
        status: 'rendering',
        metadata: { runpod_job_id: jobId }
      })
      .eq('id', projectId);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Generation started on RunPod GPU'
    });

  } catch (error) {
    console.error('Error starting generation:', error);

    await supabase
      .from('projects')
      .update({ status: 'failed' })
      .eq('id', projectId);

    return NextResponse.json(
      { error: 'Failed to start generation' },
      { status: 500 }
    );
  }
}
```

## Polling for Completion

Create `src/app/api/projects/[id]/status/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  try {
    // 1. Get project and RunPod job ID
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project?.metadata?.runpod_job_id) {
      return NextResponse.json({
        status: project.status,
        progress: 0
      });
    }

    // 2. Check RunPod job status
    const response = await fetch(
      `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/status/${project.metadata.runpod_job_id}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`
        }
      }
    );

    const runpodStatus = await response.json();

    // 3. Map RunPod status to our status
    let status = project.status;
    let progress = 0;

    switch (runpodStatus.status) {
      case 'IN_QUEUE':
        status = 'queued';
        progress = 0;
        break;
      case 'IN_PROGRESS':
        status = 'rendering';
        progress = 50; // Could parse from logs for more accuracy
        break;
      case 'COMPLETED':
        status = 'completed';
        progress = 100;
        break;
      case 'FAILED':
        status = 'failed';
        progress = 0;
        break;
    }

    // 4. Update project if status changed
    if (status !== project.status) {
      await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId);
    }

    return NextResponse.json({
      status,
      progress,
      videoUrl: project.video_url,
      error: runpodStatus.error
    });

  } catch (error) {
    console.error('Error checking status:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
```

## Frontend Polling

In your React component:

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function ProjectStatus({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState('queued');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const pollStatus = async () => {
      const res = await fetch(`/api/projects/${projectId}/status`);
      const data = await res.json();

      setStatus(data.status);
      setProgress(data.progress);

      // Stop polling when complete or failed
      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(interval);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(pollStatus, 5000);
    pollStatus(); // Initial check

    return () => clearInterval(interval);
  }, [projectId]);

  return (
    <div>
      <p>Status: {status}</p>
      <progress value={progress} max={100} />
      <p>{progress}%</p>
    </div>
  );
}
```

## Cost Tracking

Track rendering costs:

```typescript
// After job completes
const renderTime = jobData.stats.duration; // seconds
const hourlyRate = 0.20; // RTX 3090
const cost = (renderTime / 3600) * hourlyRate;

await supabase
  .from('projects')
  .update({
    render_cost: cost,
    render_time: renderTime
  })
  .eq('id', projectId);
```

## Testing

```bash
# 1. Start a job
curl -X POST http://localhost:3000/api/projects/YOUR_PROJECT_ID/generate

# 2. Check status
curl http://localhost:3000/api/projects/YOUR_PROJECT_ID/status
```

## Production Checklist

- [ ] Set RUNPOD_API_KEY in Vercel
- [ ] Set RUNPOD_ENDPOINT_ID in Vercel
- [ ] Test with sample project
- [ ] Monitor RunPod dashboard for costs
- [ ] Set up error alerting (Sentry, etc.)
- [ ] Add retry logic for failed jobs
- [ ] Implement job timeout handling
