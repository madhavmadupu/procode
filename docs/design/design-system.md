# Design System

## Philosophy

ProCode's design language is **functional beauty** — every pixel serves a purpose, every animation communicates state, every color conveys meaning. The interface should feel invisible when working and delightful when noticed.

## Typography

### Primary Font: Inter
- UI text, labels, buttons, inputs
- Weights: 400 (Regular), 500 (Medium), 600 (Semibold)
- Excellent readability at small sizes, designed for screens

### Monospace Font: JetBrains Mono
- Code editor, terminal, inline code
- Weights: 400 (Regular), 500 (Medium)
- Ligatures enabled for operators (`=>`, `===`, `!=`)
- 14px default in editor, 13px in terminal

### Type Scale
```
display:    24px / 600  — Window titles, section headers
h1:         20px / 600  — Panel headers
h2:         16px / 600  — Subsection headers
body:       13px / 400  — Default text
small:      12px / 400  — Labels, hints, status bar
code:       14px / 400  — Editor, terminal (JetBrains Mono)
tiny:       11px / 400  — Breadcrumbs, minimap labels
```

## Color System

### Design Token Structure
```css
/* apps/desktop/src/renderer/styles/tokens.css */
:root {
  /* Neutral palette */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f8f9fa;
  --color-neutral-100: #f1f3f5;
  --color-neutral-200: #e9ecef;
  --color-neutral-300: #dee2e6;
  --color-neutral-400: #ced4da;
  --color-neutral-500: #adb5bd;
  --color-neutral-600: #868e96;
  --color-neutral-700: #495057;
  --color-neutral-800: #343a40;
  --color-neutral-900: #212529;
  --color-neutral-950: #0d1117;

  /* Brand */
  --color-brand-500: #6366f1;   /* Indigo */
  --color-brand-600: #4f46e5;

  /* Semantic */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Editor-specific */
  --color-editor-bg: var(--color-neutral-950);
  --color-editor-gutter: var(--color-neutral-900);
  --color-editor-selection: rgba(99, 102, 241, 0.2);
  --color-editor-current-line: rgba(255, 255, 255, 0.05);

  /* AI-specific */
  --color-ai-indicator: var(--color-brand-500);
  --color-ai-glow: rgba(99, 102, 241, 0.3);
}
```

### Dark Theme (Default)
```css
[data-theme="dark"] {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-tertiary: #21262d;
  --bg-elevated: #30363d;

  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-tertiary: #6e7681;

  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-strong: rgba(255, 255, 255, 0.15);
}
```

### Light Theme
```css
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f6f8fa;
  --bg-tertiary: #eff1f3;
  --bg-elevated: #ffffff;

  --text-primary: #1f2328;
  --text-secondary: #656d76;
  --text-tertiary: #8c959f;

  --border-subtle: rgba(0, 0, 0, 0.04);
  --border-default: rgba(0, 0, 0, 0.08);
  --border-strong: rgba(0, 0, 0, 0.12);
}
```

## Spacing

### 4px Base Grid
```
--space-1:  4px    — Tight spacing (icon + text gap)
--space-2:  8px    — Component padding
--space-3:  12px   — Section spacing
--space-4:  16px   — Panel padding
--space-5:  20px
--space-6:  24px   — Large section spacing
--space-8:  32px   — Layout gaps
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

## Layout

### Activity Bar
- Width: 48px
- Icons: 24x24px, centered
- Active indicator: 2px left border, brand color
- Hover: subtle background tint

### Sidebar (Primary)
- Width: 260px (resizable, 180px–500px)
- Background: bg-secondary
- Border-right: border-subtle

### Editor Area
- Flexible width
- Tab height: 36px
- Breadcrumb height: 22px
- Status bar height: 22px

### Panel (Bottom)
- Height: 200px (resizable, 100px–60% of viewport)
- Tabs: Terminal, Problems, Output, Debug Console

### AI Panel (Secondary Sidebar)
- Width: 400px (resizable, 300px–600px)
- Positioned on right side
- Background: bg-secondary

## Iconography

### System
- Use Phosphor Icons or similar consistent icon set
- 16px for inline icons, 24px for activity bar
- Stroke width: 1.5px for refined look

### File Icons
- Use vscode-icons or custom set matching ProCode aesthetic
- Language-specific colors muted to match theme

## Motion

### Principles
- **Purposeful** — every animation communicates something
- **Fast** — no animation longer than 300ms for UI interactions
- **Smooth** — ease-out for entrances, ease-in for exits

### Timing Functions
```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);   /* Entrances */
--ease-in: cubic-bezier(0.7, 0, 0.84, 0);    /* Exits */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Micro-interactions */
```

### Durations
```
--duration-fast: 100ms    — Hover states, toggles
--duration-normal: 200ms  — Panel open/close, dropdowns
--duration-slow: 300ms    — Page transitions, large movements
```

### Key Animations
- **Panel slide** — 200ms ease-out, translateX
- **Tab switch** — 100ms fade, opacity
- **AI indicator pulse** — 2s infinite, subtle glow
- **File tree expand** — 150ms ease-out, height + opacity
- **Notification toast** — 200ms ease-out slide-in from top-right

## Accessibility

- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Focus visible: 2px outline, brand color, 2px offset
- Keyboard navigation: all interactive elements reachable via Tab
- Screen reader: ARIA labels on all icon buttons, live regions for dynamic content
- Reduced motion: respect `prefers-reduced-motion`, disable non-essential animations
