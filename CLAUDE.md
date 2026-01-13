# Resonance - Claude Code Instructions

## What Is This Project?

Resonance is a cinematic visual generation tool for organic/ambient music. Users upload audio + optional footage, describe the visual feeling they want, and the system creates unique narrative-driven videos.

**Owner:** Josh (AI West)
**Repository:** https://github.com/joshmartin1186/resonance

---

## Quick Start

```bash
npm run dev
# Opens at http://localhost:3000
```

---

## Current Status

**Phase:** 1 of 7 (Foundation)
**Last Completed:** Issue #1 - Next.js setup with AI West design system
**Current Task:** Issue #2 - Configure Supabase

See `STATUS.md` for detailed progress.

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

## Key Documentation

All detailed specs are in the GitHub repo under `/docs`:

| File | Use When |
|------|----------|
| `docs/PROJECT_INSTRUCTIONS.md` | Overall guidance, rules, workflow |
| `docs/DATABASE_SCHEMA.md` | Creating tables, writing SQL |
| `docs/AI_WEST_DESIGN_SYSTEM.md` | Any styling decisions (COPY EXACTLY) |
| `docs/UI_SPECIFICATIONS.md` | Building pages and components |
| `docs/TECHNICAL_ARCHITECTURE.md` | System design, audio analysis, rendering |
| `docs/BUILD_PHASES.md` | What to build in what order |

---

## The Rules (Important!)

### 1. AI West Design System
Never change these colors. Copy exactly from `docs/AI_WEST_DESIGN_SYSTEM.md`:
- Background: `#F8F6F3`
- Primary button: `#C45D3A` (terracotta)
- Font: IBM Plex Sans

### 2. Multi-Tenant Architecture
Every database table MUST have `organization_id`. Always use RLS policies.

### 3. Update STATUS.md
After completing work, update `STATUS.md` with what was done and what's next.

### 4. GitHub Issues Are The Task List
Check https://github.com/joshmartin1186/resonance/issues for current tasks.

---

## Phase 1 Tasks (Current)

| Issue | Task | Status |
|-------|------|--------|
| #1 | Next.js + Tailwind + AI West design | ✅ Done |
| #2 | Supabase setup + migrations | 🔨 Next |
| #3 | Auth (login, signup, magic link) | Waiting |
| #4 | Multi-tenant organization system | Waiting |
| #5 | Stripe webhook handler | Waiting |
| #6 | Deploy to Vercel | Waiting |
| #7 | Polish landing page | Waiting |

---

## How To Continue Each Task

### Issue #2: Supabase Setup
1. Create Supabase project (need Josh to confirm $10/mo cost)
2. Run SQL from `docs/DATABASE_SCHEMA.md` in order:
   - organizations table
   - users table
   - projects table
   - project_footage table
   - generations table
   - system_logs table
   - user_preferences table
   - All RLS policies
   - Helper functions
3. Create storage buckets: `audio-uploads`, `footage-uploads`
4. Add credentials to `.env.local`
5. Test connection

### Issue #3: Authentication
1. Create `src/app/(auth)/login/page.tsx`
2. Create `src/app/(auth)/signup/page.tsx`
3. Use Supabase Auth with email/password
4. Add magic link option
5. Redirect to `/dashboard` after auth
6. Style with AI West design system

### Issue #4: Multi-Tenant Orgs
1. Create org on signup (or via Stripe webhook)
2. Create `OrganizationContext` provider
3. Wrap app in provider
4. All queries filter by `organization_id`

### Issue #5: Stripe Integration
1. Create `/api/webhooks/stripe/route.ts`
2. Handle: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Create org + user on checkout complete
4. Update subscription status in database

### Issue #6: Vercel Deploy
1. Connect GitHub repo to Vercel
2. Add all env vars from `.env.local`
3. Set up Stripe webhook for production URL
4. Test deployment

### Issue #7: Landing Page Polish
1. Review against `docs/UI_SPECIFICATIONS.md`
2. Test mobile responsiveness
3. Verify all links work
4. Check accessibility

---

## Environment Variables

Create `.env.local` with:
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

## Common Commands

```bash
# Development
npm run dev

# Check for errors
npm run build

# Push to GitHub
git add -A && git commit -m "description" && git push
```

---

## When You're Done Working

1. Update `STATUS.md` with progress
2. Commit and push to GitHub
3. Comment on the relevant GitHub issue
4. If issue complete, close it

---

## Questions?

If something is unclear, check the docs in `/docs` folder or ask Josh.
