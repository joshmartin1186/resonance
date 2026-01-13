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
4. **Keep building** - Don't stop, don't wait, just build the next task
5. **Don't push** - Build locally until Josh says "push to GitHub"
6. **Note blockers** - If truly stuck, add to BLOCKERS table and move to next task

---

## Project Structure

```
src/
├── app/                    # Pages (Next.js App Router)
│   ├── globals.css         # AI West design system (DO NOT MODIFY)
│   ├── page.tsx            # Landing page
│   ├── login/              # Auth pages
│   ├── signup/
│   ├── dashboard/
│   ├── settings/
│   ├── projects/
│   └── pricing/
├── components/ui/          # Button, Card, Input, etc.
├── lib/
│   ├── supabase/           # Supabase clients
│   └── stripe.ts           # Stripe utilities
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
4. **Build locally** - Don't push until Josh says to
5. **Keep moving** - Don't wait for manual steps, build everything you can

---

## Environment

`.env.local` has Supabase credentials. Stripe keys will be added by Josh later.

---

## If Stuck

1. Check the relevant doc in `/docs`
2. Look at existing code patterns in `src/`
3. Add note to STATUS.md under BLOCKERS
4. **Move to next task immediately** - don't wait

---

## Common Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Check for build errors
git pull             # Get latest before starting
```

When Josh says "push":
```bash
git add -A && git commit -m "description" && git push
```

---

## Current State

**Supabase:** Connected and working
**Database:** All tables created with RLS
**Auth:** Built (login, signup, reset-password)
**Dashboard:** Built
**Settings:** Built with org/billing/team tabs
**Stripe:** Code built, waiting for Josh to create products in Stripe Dashboard

---

**Read STATUS.md now to see what to build.**
