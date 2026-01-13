# AI West Design System

**CRITICAL: This file should NEVER be modified. Copy exactly as-is for every project.**

## Brand Identity

**Company:** AI West
**Tagline:** "Deal Flow + Capital Formation, Fully Automated"
**Broader positioning:** "Automate Everything. Stay Lean."

## Typography

**Primary Font:** IBM Plex Sans
- Headings: IBM Plex Sans, 600-700 weight
- Body: IBM Plex Sans, 400 weight
- Code/mono: IBM Plex Mono

## Color Palette

### Primary Colors

```css
--bg-primary: #F8F6F3;        /* Warm off-white background */
--bg-secondary: #FFFFFF;       /* Pure white for cards */
--bg-tertiary: #F0EDE8;        /* Subtle warm gray */

--text-primary: #2A2621;       /* Near black for main text */
--text-secondary: #5A534C;     /* Medium gray for secondary text */
--text-tertiary: #8A827A;      /* Light gray for hints/disabled */

--accent-primary: #C45D3A;     /* Terracotta - primary actions */
--accent-primary-hover: #A84D2E; /* Darker terracotta on hover */
--accent-secondary: #D97F5F;   /* Lighter terracotta */

--border-light: #E2E0DB;       /* Subtle borders */
--border-medium: #CDC9C2;      /* More visible borders */
--border-dark: #A8A29A;        /* Strong borders */
```

### Semantic Colors

```css
--success: #2D7D4F;            /* Green for success states */
--success-bg: #E8F5EC;         /* Light green background */

--warning: #D97706;            /* Orange for warnings */
--warning-bg: #FEF3C7;         /* Light orange background */

--error: #C2410C;              /* Red for errors */
--error-bg: #FEE2E2;           /* Light red background */

--info: #0369A1;               /* Blue for information */
--info-bg: #E0F2FE;            /* Light blue background */
```

## Buttons

**Primary Button:**
```css
background: var(--accent-primary);
color: white;
padding: 0.75rem 1.5rem;
border-radius: 0.5rem;
font-weight: 600;

hover: background: var(--accent-primary-hover);
```

**Secondary Button:**
```css
background: transparent;
color: var(--accent-primary);
border: 1px solid var(--accent-primary);
padding: 0.75rem 1.5rem;
border-radius: 0.5rem;

hover: background: var(--accent-primary), color: white;
```

## Cards

```css
background: white;
border: 1px solid var(--border-light);
border-radius: 0.75rem;
padding: 1.5rem;
box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
```

## Tailwind Configuration

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'bg-primary': '#F8F6F3',
        'bg-secondary': '#FFFFFF',
        'bg-tertiary': '#F0EDE8',
        'text-primary': '#2A2621',
        'text-secondary': '#5A534C',
        'text-tertiary': '#8A827A',
        'accent-primary': '#C45D3A',
        'accent-primary-hover': '#A84D2E',
        'accent-secondary': '#D97F5F',
        'border-light': '#E2E0DB',
        'border-medium': '#CDC9C2',
        'border-dark': '#A8A29A',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
}
```

---

**Remember:** Consistency creates trust. Use this system across all AI West projects without modification.