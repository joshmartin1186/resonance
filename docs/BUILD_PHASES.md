# Resonance - Build Phases

## Phase 1: Foundation (Days 1-3)

### GitHub Setup
- [x] Create repository: `resonance`
- [ ] Initialize GitHub Project board
- [ ] Create labels: phase-1 through phase-5, bug, enhancement
- [ ] Create Phase 1 issues

### Next.js Setup
- [ ] `npx create-next-app@latest resonance --typescript --tailwind --app`
- [ ] Install dependencies (supabase, shadcn, stripe, date-fns)

### Supabase Project
- [ ] Create new project
- [ ] Run DATABASE_SCHEMA.md migrations
- [ ] Configure auth providers
- [ ] Set up storage buckets

### Stripe Setup
- [ ] Create products for each tier
- [ ] Set up webhook endpoint
- [ ] Test checkout flow

### Deploy to Vercel
- [ ] Connect GitHub repo
- [ ] Configure environment variables
- [ ] Enable preview deployments

**Deliverable:** Basic Next.js app deployed with auth and database

---

## Phase 2: Core UI (Days 4-7)

### Pages
- [ ] Landing page (`/`)
- [ ] Login/signup (`/login`, `/signup`)
- [ ] Dashboard (`/dashboard`)
- [ ] Create project wizard (`/create`)
- [ ] Project view (`/projects/[id]`)

### Components
- [ ] Navigation (top bar, sidebar)
- [ ] Project cards
- [ ] File upload (audio, video, images)
- [ ] Settings forms
- [ ] Status badges

### Stripe Integration
- [ ] Webhook handler
- [ ] Organization creation on checkout
- [ ] Subscription status display
- [ ] Usage limit enforcement

**Deliverable:** Complete UI flow from signup to project creation

---

## Phase 3: Audio Analysis Pipeline (Days 8-14)

### Worker Server Setup
- [ ] Deploy to Railway/Render
- [ ] Install FFmpeg
- [ ] Set up Redis + BullMQ
- [ ] Create job queue system

### Audio Analysis
- [ ] Integrate Essentia.js
- [ ] Integrate Meyda
- [ ] Implement feature extraction
- [ ] Cache analysis results in database

**Deliverable:** Audio analysis working end-to-end

---

## Phase 4: Effect Library & Rendering (Days 15-21)

### Effect Library
- [ ] Create effect database schema
- [ ] Implement 100 base effects
- [ ] FFmpeg command templates
- [ ] Canvas rendering functions

### Three-Layer System
- [ ] Footage processing pipeline
- [ ] Effect application (FFmpeg)
- [ ] Generative rendering (Canvas/WebGL)
- [ ] Compositing engine

**Deliverable:** End-to-end video generation working

---

## Phase 5: AI Orchestration (Days 22-28)

- [ ] Claude API integration
- [ ] Prompt engineering for narrative creation
- [ ] Effect selection logic
- [ ] Timeline generation
- [ ] Seed system for reproducibility

**Deliverable:** AI-orchestrated generations with narrative coherence

---

## Phase 6: Polish & Beta (Days 29-35)

- [ ] UI/UX polish
- [ ] Loading states
- [ ] Error handling
- [ ] Preview system
- [ ] Beta testing (10-20 users)

**Deliverable:** Beta-quality product ready for private launch

---

## Phase 7: Launch (Day 36)

- [ ] Landing page finalized
- [ ] Demo video created
- [ ] Product Hunt submission
- [ ] Reddit posts
- [ ] Monitoring setup

**Deliverable:** Public launch, first paying customers