# Resonance - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js)                         │
│  • Upload Interface                                         │
│  • Preview & Playback                                       │
│  • User Settings                                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTPS/WebSocket
                   │
┌──────────────────▼──────────────────────────────────────────┐
│               VERCEL (API Routes)                           │
│  • Authentication                                           │
│  • File Upload Handling                                     │
│  • Project CRUD                                             │
│  • Job Queue Management                                     │
└──────────────────┬──────────────────────────────────────────┘
                   │
         ┌─────────┴──────────┬───────────────┐
         │                    │               │
         ▼                    ▼               ▼
┌────────────────┐  ┌─────────────────┐  ┌──────────────┐
│   SUPABASE     │  │  CLOUDFLARE R2  │  │    STRIPE    │
│   • Database   │  │  • Video Storage│  │  • Payments  │
│   • Auth       │  │  • Asset Storage│  │  • Subs      │
│   • Storage    │  │                 │  │              │
└────────────────┘  └─────────────────┘  └──────────────┘
                   
                   ┌────────────────────┐
                   │  PROCESSING WORKER │
                   │  (Railway/Render)  │
                   │                    │
                   │  • Audio Analysis  │
                   │  • AI Orchestration│
                   │  • FFmpeg Rendering│
                   │  • Compositing     │
                   └────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|--------|
| Frontend | Next.js 14 + TypeScript | User interface, upload, preview |
| Styling | Tailwind + shadcn/ui | AI West design system |
| Database | Supabase (PostgreSQL) | User projects, settings, video metadata |
| Hosting | Vercel | Frontend hosting, API routes |
| Payments | Stripe | Subscription management |
| Audio Analysis | Web Audio API + Essentia.js + Meyda | Deep music analysis |
| Visual Rendering | Canvas 2D + WebGL (Three.js) + FFmpeg | Effect execution, compositing |
| AI Orchestration | Claude/Gemini | Narrative creation, effect selection |
| Storage | Cloudflare R2 / S3 | Video assets and outputs |
| Processing | Railway/Render | FFmpeg rendering (long-running jobs) |

## Audio Analysis Pipeline

**Features Extracted:**
- Pitch, melody, harmony
- Tempo, beats, rhythm
- Dynamics, loudness
- Timbre, spectral features
- Structure (intro, verse, chorus, outro)
- Emotional arc (valence, arousal, tension)

**Subtle Cue Detection:**
- Breath markers (vocals)
- String sustain/decay
- Vibrato detection
- Meaningful silence/pauses

## Three-Layer Compositing

**Layer 1: Footage** - User-provided video/images
**Layer 2: Effects** - Code-driven transformations (FFmpeg)
**Layer 3: Generative** - Algorithmic visuals (Canvas/WebGL)

Final output: Intelligent blend based on musical moment.

## Why Code-Driven (Not AI Video Gen)

- Lightning fast vs. minutes per second
- Cost-effective vs. $0.50-$2/second
- Deterministic and controllable
- Infinite variations through parameters