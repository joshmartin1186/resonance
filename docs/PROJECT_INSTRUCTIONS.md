# Resonance - Project Instructions

**READ THIS FIRST.** This is the master guide for building Resonance.

---

## What Are We Building?

**Resonance** is a cinematic visual generation tool for organic and ambient music. It creates unique, narrative-driven visuals that respond to subtle musical cues like breath, string sustain, vibrato, and meaningful silence.

**Not a music visualizer.** A storytelling tool that understands musical nuance.

---

## The Team

| Role | Who | Responsibilities |
|------|-----|------------------|
| **Product Owner** | Josh | Approves costs, makes decisions, nudges progress, tests features |
| **Manager** | Claude.ai | Plans work, writes tasks, reviews progress, updates GitHub, removes blockers |
| **IC (Builder)** | Claude Code | Executes tasks, writes code, tests locally, pushes when clean |

---

## The Workflow

### Source of Truth

**GitHub is the source of truth.** Local is for testing. Vercel is for production.

```
GitHub (source of truth)
    ↓ git pull
Local machine (testing - instant feedback)
    ↓ npm run dev → localhost:3000
    ↓ npm run build → catches errors
    ↓ git push (only when it works)
GitHub → Vercel auto-deploys (production, not dev cycle)
```

### Why This Works

| Method | Feedback time |
|--------|---------------|
| `npm run dev` | Instant (hot reload) |
| `npm run build` | 10-30 seconds |
| Vercel deploy | 1-3 minutes |

**Never wait for Vercel during development.** Local testing catches 99% of issues instantly.

### The Build Loop

```bash
git pull                     # 1. Get latest from GitHub
# Build your code            # 2. Create/edit files
npm run dev                  # 3. Test at localhost:3000 (instant)
npm run build                # 4. Catch TypeScript errors (10-30 sec)
# Mark task [x]              # 5. Update STATUS.md
git add -A && git commit -m "msg" && git push  # 6. Push when clean
```

---

## The Two Coordination Files

### STATUS.md (Task Queue)

**Location:** `/STATUS.md` (project root)

**Purpose:** Live checklist of what needs to be done RIGHT NOW.

**Who writes:** Claude.ai (manager)  
**Who executes:** Claude Code (IC)

```markdown
## 📋 TASK QUEUE (Claude Code: Build These)

### Next Up
- [ ] Build login page at /login
- [ ] Build signup page at /signup
- [ ] Test: user can sign up and log in

## ✅ COMPLETED
- [x] Initialize Next.js project (2026-01-13)
```

### GitHub Issues (Big Picture)

**Purpose:** Track phases, milestones, and overall project progress.

**Who manages:** Claude.ai  
**Who monitors:** Josh

**Structure:**
- Phase 1: Issues #1-7 (Foundation)
- Phase 2: Issues #8-13 (Core UI)
- Phase 3+: Future phases

---

## For Claude.ai (Manager)

### Starting a Session

```
1. Read STATUS.md to see what Claude Code completed
2. Check GitHub Issues for overall phase progress
3. Review any blockers or notes
4. Add new tasks to STATUS.md if needed
5. Update GitHub Issues if milestones completed
6. Ask Josh what to focus on if unclear
```

### Writing Good Tasks

**Do:**
```markdown
- [ ] Build login page at `/login` using AI West design system
- [ ] Add email + password fields with validation
- [ ] Connect to Supabase Auth signInWithPassword
- [ ] Handle errors (show toast on failure)
- [ ] Test: user can log in with valid credentials
```

**Don't:**
```markdown
- [ ] Do the login stuff
- [ ] Make it work
```

---

## For Claude Code (IC)

### Starting a Session

```bash
cd /Users/joshuamartin/Projects/resonance
git pull                    # Get latest from GitHub
cat STATUS.md               # See your tasks
npm run dev                 # Start dev server
```

### The Work Cycle

```
1. git pull                     # Get latest
2. Read STATUS.md               # Find tasks
3. Build code                   # Create/edit files
4. npm run dev                  # Test at localhost:3000
5. npm run build                # Catch errors
6. Mark task [x] in STATUS.md   # When working
7. git push                     # When feature complete + builds clean
```

### When Stuck

Add a note to STATUS.md:
```markdown
## 🚧 BLOCKERS

| Blocker | Waiting On | Added |
|---------|------------|-------|
| Can't find Stripe keys | Josh | 2026-01-14 |
```

Then move to next unblocked task immediately.

---

## For Josh (Product Owner)

### Daily Check-in

1. Open STATUS.md to see progress
2. Check GitHub Issues for phase completion
3. Test any deployed features
4. Approve pending decisions or costs
5. Nudge: "Work on the project"

### Removing Blockers

When you see blockers in STATUS.md:
- **Cost approval:** "Go ahead and create the Supabase project"
- **Decision needed:** "Use option A"
- **Access needed:** Share API keys, credentials, etc.

---

## The Four Non-Negotiable Rules

### Rule 1: GitHub is the Source of Truth

- Always `git pull` before starting work
- Always `git push` when work is complete and builds clean
- Local is for testing, not storage

### Rule 2: Test Locally, Not on Vercel

```bash
npm run dev      # Instant feedback at localhost:3000
npm run build    # Catches errors in 10-30 seconds
```

Never wait for Vercel deploys during development.

### Rule 3: AI West Design System on Everything

Every UI element uses the AI West design system. Copy exactly, never modify.

```
Background:     #F8F6F3 (warm off-white)
Primary button: #C45D3A (terracotta)
Font:           IBM Plex Sans
Cards:          White with #E2E0DB border
```

See `docs/AI_WEST_DESIGN_SYSTEM.md` for complete reference.

### Rule 4: Multi-Tenant + Stripe from Day One

Every table has `organization_id`. Every query is scoped. No exceptions.

---

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

---

## Project Structure

```
resonance/
├── STATUS.md              # Task queue
├── CLAUDE.md              # Context for Claude Code
├── .env.local             # Environment variables
├── src/
│   ├── app/               # Next.js pages
│   │   ├── globals.css    # AI West design system
│   │   ├── page.tsx       # Landing page
│   │   ├── login/
│   │   ├── signup/
│   │   ├── dashboard/
│   │   ├── settings/
│   │   ├── projects/
│   │   └── pricing/
│   ├── components/ui/     # Reusable components
│   ├── contexts/          # React contexts
│   └── lib/               # Utilities
├── docs/                  # Detailed specifications
└── public/
```

---

## File Reference Guide

| File | When to Read |
|------|-------------|
| **STATUS.md** | Every session. Current tasks and progress. |
| **CLAUDE.md** | For Claude Code. Project context and commands. |
| **DATABASE_SCHEMA.md** | When creating tables. Copy SQL exactly. |
| **AI_WEST_DESIGN_SYSTEM.md** | When building UI. Copy styles exactly. |
| **UI_SPECIFICATIONS.md** | When building pages. Layout and component specs. |
| **TECHNICAL_ARCHITECTURE.md** | When building backend. System design details. |
| **BUILD_PHASES.md** | For planning. Overall build timeline. |

---

## Build Phases Overview

### Phase 1: Foundation (Issues #1-7)
- [x] #1: Next.js project setup ✅
- [x] #2: Supabase configuration ✅
- [x] #3: Authentication ✅
- [x] #4: Multi-tenant organization system ✅
- [x] #5: Stripe integration ✅
- [ ] #6: Vercel deployment (waiting on Stripe products)
- [ ] #7: Landing page polish

### Phase 2: Core UI (Issues #8-13)
- Dashboard with project list
- Project creation wizard
- File upload for audio/video
- Project detail view
- Settings and billing pages

### Phase 3: Audio Analysis (Issues #14-19)
- Worker server on Railway/Render
- Essentia.js + Meyda integration
- Feature extraction pipeline
- Subtle cue detection

### Phase 4: Effect Library (Issues #20-27)
- 100+ base effects
- FFmpeg pipeline
- Canvas/WebGL rendering
- Three-layer compositing

### Phase 5: AI Orchestration (Issues #28-33)
- Claude API integration
- Narrative creation
- Effect selection
- Seed system

### Phase 6: Polish & Beta (Issues #34-39)
- UI polish
- Preview system
- Beta testing
- Bug fixes

### Phase 7: Launch (Issues #40-44)
- Demo video
- Launch channels
- Monitoring

---

## Key Resources

**Repository:** https://github.com/joshmartin1186/resonance  
**Local Path:** /Users/joshuamartin/Projects/resonance  
**Supabase Project:** kjytcjnyowwmcmfudxup  
**Supabase URL:** https://kjytcjnyowwmcmfudxup.supabase.co

---

## Success Criteria

Users should feel:
- "It understood my music"
- "This looks like someone spent days editing"
- "I've never seen anything like this before"
- "The visuals tell the story I was feeling"

---

## Quick Commands

```bash
cd /Users/joshuamartin/Projects/resonance

# Daily workflow
git pull                                              # Start here
npm run dev                                           # Test at localhost:3000
npm run build                                         # Check for errors
git add -A && git commit -m "description" && git push # Push when clean
```

---

**Let's build something beautiful.**
