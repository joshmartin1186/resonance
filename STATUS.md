# Resonance - Task Queue

**Last Updated:** 2025-01-13 by Claude.ai
**Current Phase:** 1 - Foundation (Issues #1-7)

---

## 📋 TASK QUEUE (Claude Code: Do These)

### Next Up
- [ ] **BLOCKED** Create Supabase project (waiting on Josh to approve $10/mo)

### Once Supabase is approved:
- [ ] Create Supabase project named "resonance" in us-west-1
- [ ] Run organizations table migration (see docs/DATABASE_SCHEMA.md)
- [ ] Run users table migration
- [ ] Run projects table migration
- [ ] Run project_footage table migration
- [ ] Run generations table migration
- [ ] Run system_logs table migration
- [ ] Run user_preferences table migration
- [ ] Run all RLS policies
- [ ] Run helper functions (increment_generation_count, reset_monthly_usage)
- [ ] Run all indexes
- [ ] Create storage bucket: audio-uploads
- [ ] Create storage bucket: footage-uploads
- [ ] Get Supabase URL and keys, update .env.local
- [ ] Test: run `npm run dev` and verify no Supabase errors
- [ ] Comment on GitHub Issue #2 that it's complete
- [ ] Close GitHub Issue #2

---

## ✅ COMPLETED

### 2025-01-13 (Claude.ai)
- [x] Initialize Next.js 14 with TypeScript + Tailwind
- [x] Install dependencies (Supabase, Stripe, lucide-react, etc.)
- [x] Configure AI West design system in globals.css
- [x] Create UI components (Button, Card, Input, Label, Badge)
- [x] Build complete landing page
- [x] Set up Supabase client/server/middleware with graceful fallback
- [x] Create CLAUDE.md and STATUS.md for handoff
- [x] Push to GitHub, close Issue #1

---

## 📝 NOTES FOR CLAUDE CODE

- When you complete a task, mark it [x] and add date/attribution
- If blocked, note why and move on to next unblocked task
- Check docs/DATABASE_SCHEMA.md for exact SQL to run
- Check docs/AI_WEST_DESIGN_SYSTEM.md for any styling (copy exactly)
- Push to GitHub after completing logical chunks of work
- If something is unclear, leave a note here and continue with other tasks

---

## 🚧 BLOCKERS

| Blocker | Waiting On | Added |
|---------|------------|-------|
| Supabase project creation | Josh to approve $10/mo | 2025-01-13 |
