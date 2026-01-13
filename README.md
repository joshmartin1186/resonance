# Resonance

Cinematic visual generation tool for organic and ambient music.

## 🤖 For Claude Code / AI Assistants

**START HERE:** Read `STATUS.md` for current project state and next steps.

**Task Tracking:** GitHub Issues at https://github.com/joshmartin1186/resonance/issues

**Documentation:** All specs are in the GitHub repo under `/docs`

## Quick Start

```bash
cd /Users/joshuamartin/Projects/resonance
npm run dev
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + AI West Design System |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Stripe |
| Hosting | Vercel |

## Key Files

- `STATUS.md` - **Current state, what to do next**
- `src/app/globals.css` - AI West design system colors
- `src/components/ui/` - Reusable UI components
- `src/lib/supabase/` - Supabase client configuration

## Design System (Do Not Modify)

- Background: `#F8F6F3`
- Primary accent: `#C45D3A` (terracotta)
- Font: IBM Plex Sans
- See full spec in GitHub `/docs/AI_WEST_DESIGN_SYSTEM.md`
