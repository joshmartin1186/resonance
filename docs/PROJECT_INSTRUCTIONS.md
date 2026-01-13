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
| **IC (Builder)** | Claude Code | Executes tasks, writes code locally, marks tasks complete |

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

**Rules:**
- Claude Code checks off tasks as completed
- Claude Code adds notes if stuck
- Claude.ai reviews and adds new tasks

### GitHub Issues (Big Picture)

**Purpose:** Track phases, milestones, and overall project progress.

**Who manages:** Claude.ai
**Who monitors:** Josh

**Structure:**
- Phase 1: Issues #1-7 (Foundation)
- Phase 2: Issues #8-13 (Core UI)
- Phase 3+: Future phases

---

## The Workflow

### How Work Flows

```
              JOSH
    (approves, decides, tests)
                │
                ▼
┌───────────────────────────────────────────────────────┐
│                    CLAUDE.AI                           │
│                    (Manager)                           │
│                                                        │
│  • Writes tasks to STATUS.md                          │
│  • Reviews Claude Code's completed work               │
│  • Updates GitHub Issues when milestones complete     │
│  • Can also build directly when needed                │
└───────────────────────────────────────────────────────┘
                │
          STATUS.md
          (Task Queue)
                │
                ▼
┌───────────────────────────────────────────────────────┐
│                   CLAUDE CODE                          │
│                      (IC)                              │
│                                                        │
│  • Reads STATUS.md for current tasks                  │
│  • Builds code LOCALLY                                │
│  • Marks tasks [x] when complete                      │
│  • Does NOT push until Josh says to                   │
│  • Adds notes if blocked                              │
└───────────────────────────────────────────────────────┘
```

### The Build Loop

```
DISCUSS → BUILD (locally) → TEST → REPEAT
```

When Josh says "push to GitHub":
```
git add -A && git commit -m "msg" && git push → Vercel deploys
```

**Critical:** All code is built locally first. Push only when Josh requests.

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

### Closing GitHub Issues

When all STATUS.md tasks for an issue are complete:
1. Add summary comment to the GitHub Issue
2. Close the issue
3. Update STATUS.md to show next issue's tasks

---

## For Claude Code (IC)

### Starting a Session

```
1. git pull (get latest)
2. Read STATUS.md for your task list
3. Read CLAUDE.md for project context
4. Start working on first unchecked task
5. When done, mark [x] in STATUS.md
6. Keep building - don't stop, don't wait
7. Do NOT push until Josh says to
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
5. Nudge: "Work on the project" or "Push to GitHub"

### Removing Blockers

When you see blockers in STATUS.md:
- **Cost approval:** "Go ahead and create the Supabase project"
- **Decision needed:** "Use option A"
- **Access needed:** Share API keys, credentials, etc.

---

## The Four Non-Negotiable Rules

### Rule 1: STATUS.md is the Task Queue

- Claude.ai writes tasks
- Claude Code executes and checks off
- Everyone can read current state
- GitHub Issues track the big picture only

### Rule 2: Build Locally, Push When Told

```
ALWAYS: Build locally → test → mark done
ONLY PUSH: When Josh says "push to GitHub"
```

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
├── STATUS.md              # Task queue (Claude Code reads this)
├── CLAUDE.md              # Project context for Claude Code
├── .env.local             # Environment variables (gitignored)
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
npm run dev                # Start dev server
npm run build              # Check for errors
```

When Josh says "push":
```bash
git add -A && git commit -m "message" && git push
```

---

**Let's build something beautiful.**
