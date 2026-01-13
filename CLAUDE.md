# Resonance - Project Context

## What Is This?

Resonance is a cinematic visual generation tool for organic/ambient music. Users upload audio + optional footage, describe the visual feeling, and get unique narrative-driven videos.

**Owner:** Josh (AI West)
**Repo:** https://github.com/joshmartin1186/resonance

---

## How We Work

**STATUS.md** = Your task queue. Claude.ai adds tasks, you execute and check them off.

**GitHub Issues** = Big picture. Track phases and milestones.

**Your job:** Execute tasks in STATUS.md, mark them done, push to GitHub.

---

## Quick Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Check for errors
git pull             # Get latest before starting
git add -A && git commit -m "msg" && git push   # Save your work
```

---

## Project Structure

```
src/
├── app/                    # Pages (Next.js App Router)
│   ├── globals.css         # AI West design system
│   └── page.tsx            # Landing page
├── components/ui/          # Button, Card, Input, etc.
├── lib/supabase/           # Supabase clients
└── middleware.ts           # Auth middleware
```

---

## Key Docs (in /docs on GitHub)

| Doc | What It's For |
|-----|---------------|
| DATABASE_SCHEMA.md | SQL for all tables - copy exactly |
| AI_WEST_DESIGN_SYSTEM.md | Colors, fonts, components - copy exactly |
| UI_SPECIFICATIONS.md | Page layouts and components |
| TECHNICAL_ARCHITECTURE.md | System design details |
| BUILD_PHASES.md | Overall build plan |

---

## Rules

1. **AI West Design System** - Never change colors/fonts. Copy from docs.
2. **Multi-tenant** - Every table has organization_id + RLS policies
3. **Update STATUS.md** - Mark tasks done when complete
4. **Push often** - Commit after each logical chunk

---

## Environment

`.env.local` has placeholders. Real values needed:
- Supabase URL + keys (after project created)
- Stripe keys (later)

---

## If Stuck

1. Check the relevant doc in /docs
2. Look at existing code patterns
3. Leave a note in STATUS.md and move to next task
