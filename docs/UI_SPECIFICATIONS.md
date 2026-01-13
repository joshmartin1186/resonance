# Resonance - UI Specifications

## Page Structure

### 1. Landing Page (`/`)
Public marketing page with hero, features, pricing, FAQ

### 2. Authentication (`/login`, `/signup`)
Email/password, magic link, OAuth (future)

### 3. Dashboard (`/dashboard`)
- Recent projects (grid view)
- Quick create button
- Usage stats (generations used/limit)
- Quick links (settings, billing)

### 4. Create Project (`/create`)
Three-step wizard:
1. **Upload Audio** - Drag & drop, waveform preview
2. **Add Footage** (Optional) - Video clips, images
3. **Describe & Configure** - Prompt, settings sliders

### 5. Generation View (`/projects/[id]/generations/[generationId]`)
- Progress bar with stages while processing
- Video player when complete
- Download, regenerate, share buttons
- View AI narrative plan (expandable)

### 6. Project Library (`/projects`)
Grid/list view, sort, filter, search

### 7. Settings (`/settings`)
Tabs: Account, Preferences, Billing, Team, API

## Component Library

**Using:** shadcn/ui with AI West Design System

**Key Components:**
- Buttons (Primary, Secondary, Ghost)
- Cards
- Inputs, Textareas, Selects
- File upload (react-dropzone)
- Sliders
- Status badges
- Modals
- Toast notifications

## Responsive Design

- **Mobile (<640px):** Stack columns, hamburger nav
- **Tablet (640-1024px):** 2-column grids
- **Desktop (1024px+):** Full layout with sidebar

## Loading States

- Skeleton screens for projects, video player
- Spinners for button actions
- Progress bars for uploads and generation

## Error States

- Failed uploads → retry option
- Generation errors → view logs, retry
- Network errors → offline indicator
- Quota exceeded → upgrade prompt