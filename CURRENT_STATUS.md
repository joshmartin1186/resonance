# Resonance Project Status

**Last Updated:** 2026-01-14 2:30 PM PST

## Project Overview

Resonance is an AI-powered music visualization platform that generates cinematic visuals from audio. Users upload music, and the system analyzes it to create synchronized video content.

## Current State: Advanced Generative System

The core pipeline is working end-to-end with sophisticated procedural graphics:
1. Audio upload and analysis
2. AI-powered visual planning (Claude)
3. **NEW: Advanced GLSL shader system for TouchDesigner-level visuals**
4. FFmpeg-based video rendering with audio-reactive parameters
5. Large file upload to Supabase Storage (TUS protocol)
6. Video playback in dashboard

## Recent Updates (2026-01-14)

### 1. FFmpeg geq Filter Error (FIXED)
**Problem:** ffmpeg 8.0 rejected `if(mod(...))` conditional expressions in geq filters.
```
[Parsed_geq_1] Missing ')' or too many args in 'if(mod(X+Y+T*100,100)<50,200,80)'
```

**Solution:** Updated `worker/src/lib/renderer.ts` to use smooth sine/cosine functions instead of conditionals:
```typescript
// OLD (broken):
geq=lum='if(mod(X+Y+T*100,100)<50,200,50)':cb=128:cr=128

// NEW (working):
geq=lum='128+127*sin(X/30+T*2)*cos(Y/30+T*3)':cb='${cb}+30*sin(X/100)':cr='${cr}+30*cos(Y/100)'
```

### 2. Supabase Storage Upload EPIPE Error (FIXED - Session 1)
**Problem:** Large video files (100MB+) failed with EPIPE error using standard fetch upload.
```
TypeError: fetch failed { [cause]: Error: write EPIPE }
```

**Solution:** Implemented TUS protocol resumable uploads in `worker/src/jobs/generate.ts`:
- Added `tus-js-client` dependency
- Files > 6MB use chunked resumable upload (6MB chunks)
- Automatic retry with exponential backoff
- Resume support for interrupted uploads

## Architecture

```
resonance/
├── src/                    # Next.js frontend (App Router)
│   ├── app/               # Pages and routes
│   ├── components/        # UI components
│   ├── lib/               # Utilities and Supabase client
│   └── contexts/          # React contexts
├── worker/                 # Background job processor
│   ├── src/
│   │   ├── jobs/          # Job handlers (generate.ts)
│   │   ├── lib/           # Core libraries
│   │   │   ├── audio-analyzer.ts
│   │   │   ├── orchestrator.ts   # Claude AI integration
│   │   │   ├── renderer.ts       # FFmpeg video generation
│   │   │   ├── ffmpeg.ts         # FFmpeg utilities
│   │   │   └── queue.ts          # Database polling
│   │   └── index.ts
│   └── dist/              # Compiled output
└── supabase/
    └── migrations/        # Database schema
```

## Running the Project

### Prerequisites
- Node.js 18+
- FFmpeg 8.0+ (`brew install ffmpeg`)
- Supabase project with storage buckets

### Start Development
```bash
# Terminal 1: Next.js frontend
cd /Users/joshuamartin/Projects/resonance
npm run dev

# Terminal 2: Worker
cd /Users/joshuamartin/Projects/resonance/worker
npm run dev
```

### Environment Variables
Both frontend and worker need `.env.local`:
```
SUPABASE_URL=https://kjytcjnyowwmcmfudxup.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...  # Optional, for AI orchestration
```

## Database Schema (Supabase)

Key tables:
- `projects` - User projects with audio/video URLs
- `generations` - Render history with visual plans
- `organizations` - Multi-tenant support
- `users` - User accounts linked to orgs
- `effects` - Effect library with FFmpeg filters
- `effect_presets` - Saved effect configurations

## Supabase Storage Buckets

- `audio-uploads` - User uploaded audio files
- `video-outputs` - Rendered video files (public)
- `project-footage` - User uploaded footage

## Key Files to Know

| File | Purpose |
|------|---------|
| `worker/src/jobs/generate.ts` | Main generation pipeline |
| `worker/src/lib/renderer.ts` | FFmpeg video rendering |
| `worker/src/lib/orchestrator.ts` | Claude AI visual planning |
| `worker/src/lib/audio-analyzer.ts` | Audio feature extraction |
| `src/app/projects/[id]/page.tsx` | Project detail/player page |
| `src/app/create/page.tsx` | New project creation |

## Current Test Project

- **Project ID:** `a76591f8-dbba-4859-a182-b8410d8229be`
- **Status:** Completed
- **Video URL:** `https://kjytcjnyowwmcmfudxup.supabase.co/storage/v1/object/public/video-outputs/a76591f8-dbba-4859-a182-b8410d8229be/m1hiknwskopkygtq.mp4`

## Known Issues / TODO

1. **Native GLSL Rendering** - Build custom FFmpeg with OpenGL filter for true GPU shader execution (currently using approximations)
2. **Shader Composition** - Layer multiple shaders for hybrid effects
3. **Real-time Audio Reactivity** - Extract actual FFT frequency bands instead of approximations
4. **Video file sizes** - Currently generating large files (400MB+ for 84s video), consider compression optimization
5. **Progress UI** - Could improve real-time progress feedback in dashboard
6. **Middleware deprecation warning** - Next.js 16 warns about middleware convention

## Tech Stack

- **Frontend:** Next.js 16, React, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Worker:** Node.js with tsx, tus-js-client
- **AI:** Anthropic Claude API
- **Video:** FFmpeg with libx264

## Useful Commands

```bash
# Rebuild worker after changes
cd worker && npm run build

# Check project status in DB
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kjytcjnyowwmcmfudxup.supabase.co', 'SERVICE_KEY');
supabase.from('projects').select('*').then(r => console.log(r.data));
"

# Re-queue a failed project
UPDATE projects SET status = 'queued', error = NULL WHERE id = 'PROJECT_ID';

# Test FFmpeg filter
ffmpeg -y -f lavfi -i "nullsrc=s=320x180:d=1:r=30,geq=lum='128+127*sin(X/30)*cos(Y/30)':cb=128:cr=128" -c:v libx264 -preset ultrafast /tmp/test.mp4
```
