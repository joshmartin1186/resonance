# Resonance - Claude Code Context

**You are the IC (builder). Your tasks are in STATUS.md.**

---

## Quick Start

```bash
cd /Users/joshuamartin/Projects/resonance
git pull                    # Get latest
cat STATUS.md               # See your tasks
npm run dev                 # Start dev server
```

---

## Your Workflow

1. **Read STATUS.md** - Find your task list under "TASK QUEUE"
2. **Execute tasks** - Build what's listed, in order
3. **Mark complete** - Change `- [ ]` to `- [x]` with date
4. **Push often** - `git add -A && git commit -m "msg" && git push`
5. **Note blockers** - Add to BLOCKERS table if stuck, move to next task

---

## Project Structure

```
src/
├── app/                    # Pages (Next.js App Router)
│   ├── globals.css         # AI West design system (DO NOT MODIFY)
│   ├── page.tsx            # Landing page
│   ├── login/              # Build these
│   ├── signup/
│   └── dashboard/
├── components/ui/          # Button, Card, Input, etc.
├── lib/supabase/           # Supabase clients (already set up)
└── middleware.ts           # Auth middleware
```

---

## Key Docs (in /docs)

| Doc | Use When |
|-----|----------|
| **AI_WEST_DESIGN_SYSTEM.md** | Building ANY UI - copy styles exactly |
| **DATABASE_SCHEMA.md** | Need SQL or table structure |
| **UI_SPECIFICATIONS.md** | Building pages - layouts and components |
| **TECHNICAL_ARCHITECTURE.md** | Building backend features |

---

## The Rules

1. **AI West Design System** - Never change colors/fonts. Copy from docs.
2. **Multi-tenant** - Every query includes organization_id
3. **Update STATUS.md** - Mark tasks [x] when done
4. **Push often** - Commit after each logical chunk

---

## Environment

`.env.local` has real Supabase credentials. If you need new keys (Stripe, etc.), add to BLOCKERS.

---

## If Stuck

1. Check the relevant doc in `/docs`
2. Look at existing code patterns in `src/`
3. Add note to STATUS.md under BLOCKERS
4. Move to next unblocked task
5. Josh or Claude.ai will help

---

## Common Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Check for build errors
git pull             # Get latest before starting
git add -A && git commit -m "description" && git push   # Save work
```

---

## Current State

**Supabase:** Connected and working
**Database:** All tables created with RLS
**Auth:** Not implemented yet (your next tasks)
**Stripe:** Not connected yet

---

**Read STATUS.md now to see what to build.**
