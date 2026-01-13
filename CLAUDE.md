# Resonance - Claude Code Instructions

## ⚠️ CRITICAL: Staying In Sync

**GitHub Issues are the single source of truth.**

Before starting ANY work:
1. Check GitHub issues: https://github.com/joshmartin1186/resonance/issues
2. Find the issue labeled `in-progress` or the lowest numbered open issue
3. Comment on the issue that you're starting work

After completing ANY work:
1. Comment on the GitHub issue with what was done
2. Close the issue if complete
3. Update `STATUS.md` with current state
4. Commit and push to GitHub

This ensures all Claude instances (Claude.ai and Claude Code) stay synchronized.

---

## What Is This Project?

Resonance is a cinematic visual generation tool for organic/ambient music. Users upload audio + optional footage, describe the visual feeling they want, and the system creates unique narrative-driven videos.

**Owner:** Josh (AI West)
**Repository:** https://github.com/joshmartin1186/resonance
**GitHub Issues:** https://github.com/joshmartin1186/resonance/issues

---

## Quick Start

```bash
npm run dev
# Opens at http://localhost:3000
```

---

## Before You Start Working

1. `git pull` to get latest changes
2. Check GitHub issues for current task
3. Read `STATUS.md` for context
4. If unclear, check `docs/` folder for specs

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css         # AI West design system (DO NOT MODIFY COLORS)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page (complete)
├── components/ui/          # Reusable UI components
├── lib/
│   ├── utils.ts            # cn() helper for Tailwind
│   └── supabase/           # Supabase client configuration
└── middleware.ts           # Auth middleware
```

---

## Key Documentation (in /docs on GitHub)

| File | Use When |
|------|----------|
| `PROJECT_INSTRUCTIONS.md` | Overall guidance, rules, workflow |
| `DATABASE_SCHEMA.md` | Creating tables, writing SQL |
| `AI_WEST_DESIGN_SYSTEM.md` | Any styling decisions (COPY EXACTLY) |
| `UI_SPECIFICATIONS.md` | Building pages and components |
| `TECHNICAL_ARCHITECTURE.md` | System design, audio analysis, rendering |
| `BUILD_PHASES.md` | What to build in what order |

To read these, either:
- Check GitHub: https://github.com/joshmartin1186/resonance/tree/main/docs
- Or clone them locally

---

## The Rules (Important!)

### 1. AI West Design System - NEVER CHANGE
- Background: `#F8F6F3`
- Primary button: `#C45D3A` (terracotta)
- Font: IBM Plex Sans
- See `docs/AI_WEST_DESIGN_SYSTEM.md` for full spec

### 2. Multi-Tenant Architecture
Every database table MUST have `organization_id`. Always use RLS policies.

### 3. GitHub Issues = Task List
Always check and update GitHub issues. This is how multiple Claude instances stay in sync.

### 4. Commit Frequently
Push to GitHub after completing each logical unit of work.

---

## Current Phase: 1 (Foundation)

Check GitHub issues for latest status. Phase 1 issues are #1-#7.

---

## Implementation Guides Per Issue

### Issue #2: Supabase Setup
```
1. Need Josh to confirm $10/mo cost for new project
2. Create project via Supabase MCP or dashboard
3. Run SQL migrations from docs/DATABASE_SCHEMA.md:
   - organizations, users, projects, project_footage
   - generations, system_logs, user_preferences
   - All RLS policies and helper functions
4. Create storage buckets: audio-uploads, footage-uploads
5. Update .env.local with real credentials
6. Test: npm run dev should load without Supabase errors
```

### Issue #3: Authentication
```
1. Create src/app/(auth)/login/page.tsx
2. Create src/app/(auth)/signup/page.tsx  
3. Use Supabase Auth (email/password + magic link)
4. Create src/app/(auth)/callback/route.ts for OAuth callback
5. Redirect to /dashboard after successful auth
6. Style with AI West design system (see docs/)
```

### Issue #4: Multi-Tenant Organizations
```
1. On signup: create org, link user as owner
2. Create src/contexts/OrganizationContext.tsx
3. Wrap app in provider (layout.tsx)
4. All database queries must filter by organization_id
5. Test: two different signups should have isolated data
```

### Issue #5: Stripe Webhooks
```
1. Create src/app/api/webhooks/stripe/route.ts
2. Handle events:
   - checkout.session.completed → create org + user
   - customer.subscription.updated → update status
   - customer.subscription.deleted → mark canceled
3. Verify webhook signature
4. Test with Stripe CLI: stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Issue #6: Deploy to Vercel
```
1. Connect GitHub repo to Vercel
2. Add env vars (copy from .env.local)
3. Configure Stripe webhook for production URL
4. Test deployment works
5. Update NEXT_PUBLIC_APP_URL
```

### Issue #7: Landing Page Polish
```
1. Review against docs/UI_SPECIFICATIONS.md
2. Test mobile responsiveness (320px, 768px, 1024px+)
3. Verify all links work
4. Check accessibility (keyboard nav, contrast)
5. Add any missing sections from spec
```

---

## Environment Variables

`.env.local` has placeholders. Replace with real values:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Workflow Summary

```
START SESSION:
  git pull
  Check GitHub issues
  Read STATUS.md
  
DO WORK:
  Build the feature
  Test it works
  
END SESSION:
  git add -A && git commit -m "description" && git push
  Comment on GitHub issue with what was done
  Close issue if complete
  Update STATUS.md
```

---

## If You're Stuck

1. Check `docs/` folder for detailed specs
2. Look at existing code patterns in `src/`
3. Ask Josh for clarification
