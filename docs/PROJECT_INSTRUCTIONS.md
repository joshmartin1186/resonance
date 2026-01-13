# Resonance - Project Instructions

**READ THIS FIRST.** This is the main guide for building Resonance.

## What Are We Building?

**Resonance** is a cinematic visual generation tool for organic and ambient music. It creates unique, narrative-driven visuals that respond to subtle musical cues like breath, string sustain, vibrato, and meaningful silence.

**Not a music visualizer.** A storytelling tool that understands musical nuance.

## The Four Non-Negotiable Rules

### Rule 1: GitHub Project Tracker IS Memory

Claude has no memory between sessions. The GitHub Project board is the only memory.

**Every session:**
```
START: Check GitHub Project board → Review "In Progress" issues
WORK: Update issues as work progresses → Move cards, add comments
END: Update tracker with progress, blockers, next priorities
```

### Rule 2: The Build Feedback Loop

```
DISCUSS → BUILD → DEPLOY → CHECK LOGS → TROUBLESHOOT → REPEAT
```

### Rule 3: AI West Design System on Everything

Every UI element uses the AI West design system. Copy exactly, never modify.

**Quick reference:**
- Background: `#F8F6F3` (warm off-white)
- Primary button: `#C45D3A` (terracotta)
- Font: IBM Plex Sans
- Cards: White with `#E2E0DB` border

### Rule 4: Multi-Tenant + Stripe from Day One

Every project must have:
- `organizations` table with Stripe fields
- `organization_id` on ALL data tables
- RLS policies scoped to organization
- Stripe webhook handler
- Self-serve signup flow

## Standard Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| Auth | Supabase Auth |
| Payments | Stripe |
| Audio Analysis | Essentia.js + Meyda + Web Audio API |
| Video Rendering | FFmpeg + Canvas + WebGL/Three.js |
| AI Orchestration | Claude (Sonnet 4) |
| Worker | Railway or Render |
| Storage | Cloudflare R2 |

## Build Phases Overview

### Phase 1: Foundation (Days 1-3)
- Next.js + Supabase + Vercel
- Authentication + multi-tenant
- Stripe integration
- Basic UI (landing, dashboard, auth)

### Phase 2: Core UI (Days 4-7)
- All pages and components
- File upload flow
- Project management
- Settings and billing

### Phase 3: Audio Analysis (Days 8-14)
- Worker server setup
- Essentia.js integration
- Deep feature extraction
- Subtle cue detection

### Phase 4: Effect Library & Rendering (Days 15-21)
- Create 100+ base effects
- FFmpeg pipeline
- Canvas/WebGL rendering
- Three-layer compositing

### Phase 5: AI Orchestration (Days 22-28)
- Claude API integration
- Narrative creation prompts
- Effect selection logic
- Timeline generation

### Phase 6: Polish & Beta (Days 29-35)
- UI/UX polish
- Preview system
- Beta testing
- Bug fixes

### Phase 7: Launch (Day 36)
- Landing page finalized
- Submit to launch channels
- Monitor and iterate

## Success Criteria

Users should feel:
- "It understood my music"
- "This looks like someone spent days editing"
- "I've never seen anything like this before"
- "The visuals tell the story I was feeling"

**Let's build something beautiful.**