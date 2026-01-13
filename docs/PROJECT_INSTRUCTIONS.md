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
| **IC (Builder)** | Claude Code | Executes tasks, writes code, marks tasks complete, asks for help when stuck |

---

## The Two Source Files

### STATUS.md (Task Queue)

**Location:** `/STATUS.md` (project root)

**Purpose:** Live checklist of what needs to be done RIGHT NOW.

**Who writes:** Claude.ai (manager)
**Who executes:** Claude Code (IC)

```markdown
## 📋 TASK QUEUE (Claude Code: Do These)

### Next Up
- [ ] Build login page at /login
- [ ] Build signup page at /signup
- [ ] Implement Supabase Auth
- [ ] Test: user can sign up and log in

## ✅ COMPLETED
- [x] Initialize Next.js project (2025-01-13, Claude.ai)
- [x] Run database migrations (2025-01-13, Claude.ai)
```

**Rules:**
- Claude Code checks off tasks as it completes them
- Claude Code adds notes if stuck
- Claude.ai reviews and adds new tasks
- Always include "Test:" tasks to verify work

### GitHub Issues (Big Picture)

**Purpose:** Track phases, milestones, and overall project progress.

**Who manages:** Claude.ai
**Who monitors:** Josh

**Structure:**
- Phase 1: Issues #1-7 (Foundation)
- Phase 2: Issues #8-13 (Core UI)
- Phase 3+: Future phases

**Rules:**
- One issue per logical milestone
- Comment on issues when work completes
- Close issues when all related tasks done
- Use labels: `phase-1`, `phase-2`, `bug`, `enhancement`

---

## The Workflow

### How Work Flows

```
┌─────────────────────────────────────────────────────────────┐
│                         JOSH                                 │
│              (Approves, decides, tests)                      │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    CLAUDE.AI                         │    │
│  │                    (Manager)                         │    │
│  │                                                      │    │
│  │  • Reads GitHub Issues for big picture              │    │
│  │  • Writes tasks to STATUS.md                        │    │
│  │  • Reviews Claude Code's completed work             │    │
│  │  • Updates GitHub Issues when milestones complete   │    │
│  │  • Removes blockers (approvals, decisions)          │    │
│  │  • Can also build directly when needed              │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│                    STATUS.md                                 │
│                    (Task Queue)                              │
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   CLAUDE CODE                        │    │
│  │                      (IC)                            │    │
│  │                                                      │    │
│  │  • Reads STATUS.md for current tasks                │    │
│  │  • Executes tasks locally                           │    │
│  │  • Marks tasks [x] when complete                    │    │
│  │  • Pushes code to GitHub                            │    │
│  │  • Adds notes if blocked or confused                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### The Build Loop

```
DISCUSS → BUILD (locally) → PUSH → DEPLOY → CHECK → REPEAT
```

1. **DISCUSS:** What are we building? Check STATUS.md or GitHub Issues.
2. **BUILD:** Create/modify code locally using file tools.
3. **PUSH:** `git add -A && git commit -m "msg" && git push`
4. **DEPLOY:** Vercel auto-deploys from GitHub.
5. **CHECK:** Verify deployment, check logs, test features.
6. **REPEAT:** Mark task done, move to next.

**Critical:** All code is built locally first, then pushed. Never create files directly on GitHub.

---

## For Claude.ai (Manager)

### Starting a Session

```
1. Pull latest: Read STATUS.md to see what Claude Code completed
2. Check GitHub Issues for overall phase progress
3. Review any blockers or notes from Claude Code
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
- [ ] Test: user sees error with invalid credentials
```

**Don't:**
```markdown
- [ ] Do the login stuff
- [ ] Make it work
```

### Closing GitHub Issues

When all STATUS.md tasks for an issue are complete:
1. Add summary comment to the GitHub Issue
2. Close the issue with `state_reason: completed`
3. Update STATUS.md to show next issue's tasks

---

## For Claude Code (IC)

### Starting a Session

```
1. git pull (get latest)
2. Read STATUS.md for your task list
3. Read CLAUDE.md for project context
4. Start working on first unchecked task
5. When done, mark [x] and add date
6. git push after each logical chunk
```

### When Stuck

Add a note to STATUS.md:
```markdown
## 🚧 BLOCKERS

| Blocker | Waiting On | Added |
|---------|------------|-------|
| Can't find Stripe keys | Need Josh to create Stripe account | 2025-01-14 |
```

Then move to next unblocked task.

### Completing Tasks

```markdown
## ✅ COMPLETED

### 2025-01-14 (Claude Code)
- [x] Build login page at /login
- [x] Build signup page at /signup
- [x] Connect to Supabase Auth
- [x] Test: login works with valid credentials
```

---

## For Josh (Product Owner)

### Daily Check-in

1. Open STATUS.md to see progress
2. Check GitHub Issues for phase completion
3. Test any newly deployed features at Vercel URL
4. Approve any pending decisions or costs
5. Nudge Claude Code if tasks stalling: "Keep working on the project"

### Removing Blockers

When you see blockers in STATUS.md:
- **Cost approval:** "Go ahead and create the Supabase project"
- **Decision needed:** "Use option A for the pricing page"
- **Access needed:** Share API keys, credentials, etc.

### Nudging Progress

To Claude Code: "Work on the project" or "Continue where you left off"
To Claude.ai: "Check on progress" or "What's next for Phase 1?"

---

## The Four Non-Negotiable Rules

### Rule 1: STATUS.md is the Task Queue

- Claude.ai writes tasks
- Claude Code executes and checks off
- Everyone can read current state
- GitHub Issues track the big picture only

### Rule 2: Build Locally, Push to GitHub

```
NEVER: Create files directly on GitHub
ALWAYS: Build locally → git push → Vercel deploys
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
│   │   ├── login/         # Auth pages
│   │   ├── signup/
│   │   └── dashboard/
│   ├── components/
│   │   └── ui/            # Reusable components
│   └── lib/
│       └── supabase/      # Supabase clients
├── docs/                  # Detailed specifications
│   ├── PROJECT_INSTRUCTIONS.md  # This file
│   ├── DATABASE_SCHEMA.md
│   ├── AI_WEST_DESIGN_SYSTEM.md
│   ├── UI_SPECIFICATIONS.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   └── ...
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
- [x] #1: Next.js project setup
- [x] #2: Supabase configuration
- [ ] #3: Authentication
- [ ] #4: Multi-tenant organization system
- [ ] #5: Stripe integration
- [ ] #6: Vercel deployment
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
# Start dev server
cd /Users/joshuamartin/Projects/resonance
npm run dev

# Push changes
git add -A && git commit -m "message" && git push

# Check for errors
npm run build
```

---

**Let's build something beautiful.**
