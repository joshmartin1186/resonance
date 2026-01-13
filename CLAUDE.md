# Resonance - Claude Code Context

**You are the IC (builder). Your tasks are in STATUS.md.**

---

## Quick Start

```bash
cd /Users/joshuamartin/Projects/resonance
git pull                    # Get latest from GitHub (source of truth)
cat STATUS.md               # See your tasks
npm run dev                 # Start dev server at localhost:3000
```

---

## The Workflow

**GitHub is the source of truth. Test locally. Push when it works.**

```
1. git pull                     # Get latest
2. Read STATUS.md               # Find your tasks
3. Build code                   # Create/edit files
4. npm run dev                  # Test at localhost:3000 (instant feedback)
5. npm run build                # Catch TypeScript errors (10-30 sec)
6. Mark task [x] in STATUS.md   # When working
7. git push                     # When feature complete + builds clean
```

**Key point:** Never wait for Vercel. Local testing catches errors in seconds. Vercel is for production, not development.

---

## Testing Checklist

Before pushing any feature:

```bash
npm run dev          # Does it work at localhost:3000?
npm run build        # Does it compile without errors?
```

If both pass → push. If either fails → fix first.

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
├── contexts/               # React contexts (organization, etc.)
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── stripe.ts           # Stripe utilities
│   └── rbac.ts             # Role-based access control
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

1. **GitHub is truth** - Always `git pull` before starting
2. **Test locally** - Use `npm run dev`, not Vercel deploys
3. **Build before push** - Run `npm run build` to catch errors
4. **AI West Design System** - Never change colors/fonts
5. **Multi-tenant** - Every query includes organization_id
6. **Update STATUS.md** - Mark tasks [x] when done

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

## Commands Reference

```bash
# Daily workflow
git pull                                              # Start here
npm run dev                                           # Test at localhost:3000
npm run build                                         # Check for errors
git add -A && git commit -m "description" && git push # Save when clean

# Debugging
npm run lint                 # Check code style
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
