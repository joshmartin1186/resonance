# RunPod Deployment Guide

Deploy the Resonance video renderer to RunPod for GPU-accelerated rendering at ~$0.20/hour.

## Prerequisites

1. **RunPod Account**: Sign up at https://www.runpod.io
2. **Docker Hub Account**: For hosting the container image
3. **Environment Variables**: Supabase and Anthropic API keys

## Step 1: Build and Push Docker Image

```bash
cd worker

# Build for linux/amd64 (RunPod uses x86_64)
docker buildx build --platform linux/amd64 -t your-dockerhub-username/resonance-worker:latest .

# Push to Docker Hub
docker login
docker push your-dockerhub-username/resonance-worker:latest
```

## Step 2: Create RunPod Serverless Endpoint

1. Go to https://www.runpod.io/console/serverless
2. Click **"New Endpoint"**
3. Configure:
   - **Name**: `resonance-worker`
   - **Container Image**: `your-dockerhub-username/resonance-worker:latest`
   - **GPU Type**: RTX 3090 (cheapest at ~$0.20/hr)
   - **Workers**: Min: 0, Max: 10
   - **Container Disk**: 20 GB
   - **Active Timeout**: 600 seconds (10 minutes)

## Step 3: Set Environment Variables

In the RunPod dashboard, add these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
NODE_ENV=production
```

## Step 4: Update Next.js App to Use RunPod

In your Next.js API route, call RunPod instead of local worker:

```typescript
// app/api/projects/[id]/generate/route.ts

const response = await fetch('https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/run', {
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
});

const { id: jobId } = await response.json();

// Poll for completion
const statusUrl = `https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/status/${jobId}`;
```

## Step 5: Test Deployment

```bash
# Test the endpoint
curl -X POST https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"input": {"projectId": "test-project-id"}}'
```

## Pricing

- **RTX 3090**: ~$0.20/hour
- **7-minute video** (25 min render): ~$0.08 per video
- **100 videos/month**: ~$8/month

## Monitoring

- View logs in RunPod dashboard: https://www.runpod.io/console/serverless
- Monitor GPU usage and costs
- Set up alerts for failed jobs

## Troubleshooting

### Black Screen Issues
If videos are still black:
1. Check GPU is available: Run `nvidia-smi` in container
2. Verify OpenGL: Run `glxinfo | grep "OpenGL version"`
3. Check logs for shader compilation errors

### Out of Memory
- Reduce parallel workers (currently 13)
- Use RTX 4090 (24GB VRAM) instead of 3090
- Add memory limits in Dockerfile

### Slow Rendering
- Increase GPU type (RTX 4090 vs 3090)
- Optimize node count (reduce from 3,671 if needed)
- Use smaller resolution for testing (720p vs 1080p)

## Next Steps

1. Build and push Docker image
2. Create RunPod endpoint
3. Update Next.js to call RunPod API
4. Test with a sample project
5. Monitor costs and performance
