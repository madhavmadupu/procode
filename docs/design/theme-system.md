# Theme System

## Architecture

ProCode's theme system is built on CSS custom properties with a token-based approach. Themes are defined as sets of CSS variables that can be swapped at runtime.

## Theme Structure

```
apps/desktop/src/renderer/styles/themes/
├── dark.css          # Default dark theme
├── light.css         # Light theme
└── custom/           # User-created themes
    └── my-theme.css
```

## Token Categories

### 1. Base Tokens
Raw color values, never used directly in components.

```css
:root {
  --base-white: #ffffff;
  --base-black: #000000;
  --base-gray-50: #f8f9fa;
  --base-gray-100: #f1f3f5;
  /* ... through gray-950 */
  --base-indigo-500: #6366f1;
  --base-indigo-600: #4f46e5;
  --base-green-500: #22c55e;
  --base-red-500: #ef4444;
  --base-yellow-500: #f59e0b;
  --base-blue-500: #3b82f6;
}
```

### 2. Semantic Tokens
Mapped to base tokens, used by components.

```css
:root {
  --bg-primary: var(--base-gray-950);
  --bg-secondary: var(--base-gray-900);
  --bg-tertiary: var(--base-gray-800);
  --bg-elevated: var(--base-gray-700);

  --text-primary: var(--base-gray-50);
  --text-secondary: var(--base-gray-400);
  --text-tertiary: var(--base-gray-500);

  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-strong: rgba(255, 255, 255, 0.15);

  --accent-primary: var(--base-indigo-500);
  --accent-hover: var(--base-indigo-600);

  --success: var(--base-green-500);
  --warning: var(--base-yellow-500);
  --error: var(--base-red-500);
  --info: var(--base-blue-500);
}
```

### 3. Component Tokens
Specific to UI components, mapped to semantic tokens.

```css
:root {
  --activity-bar-bg: var(--bg-secondary);
  --activity-bar-icon: var(--text-secondary);
  --activity-bar-icon-active: var(--text-primary);
  --activity-bar-indicator: var(--accent-primary);

  --sidebar-bg: var(--bg-secondary);
  --sidebar-header: var(--text-primary);
  --sidebar-item-hover: var(--bg-tertiary);
  --sidebar-item-active: var(--bg-elevated);

  --editor-bg: var(--bg-primary);
  --editor-gutter: var(--bg-secondary);
  --editor-selection: rgba(99, 102, 241, 0.2);
  --editor-current-line: rgba(255, 255, 255, 0.05);

  --tab-bg: var(--bg-secondary);
  --tab-active-bg: var(--bg-primary);
  --tab-border: var(--border-subtle);
  --tab-text: var(--text-secondary);
  --tab-active-text: var(--text-primary);

  --status-bar-bg: var(--bg-secondary);
  --status-bar-text: var(--text-secondary);
  --status-bar-item-bg: rgba(255, 255, 255, 0.05);
}
```

## VS Code Theme Import

ProCode can auto-convert VS Code `.json` themes:

```typescript
// Converts VS Code theme JSON to CSS custom properties
function convertVSCTheme(vsTheme: VSCodeTheme): CSSTokens {
  return {
    '--bg-primary': vsTheme['editor.background'],
    '--bg-secondary': vsTheme['sideBar.background'],
    '--text-primary': vsTheme['editor.foreground'],
    '--text-secondary': vsTheme['descriptionForeground'],
    // ... mapping all VS Code color tokens
  };
}
```

## Theme Switching

```typescript
// apps/desktop/src/renderer/stores/settings.store.ts
import { create } from 'zustand';

interface SettingsState {
  theme: string;
  setTheme: (theme: string) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
}));
```

## Syntax Highlighting Themes

Editor syntax highlighting is separate from UI theming, using Monaco's theme system:

```typescript
// Monaco theme definition
monaco.editor.defineTheme('procode-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'c586c0' },
    { token: 'string', foreground: 'ce9178' },
    { token: 'number', foreground: 'b5cea8' },
    { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
    { token: 'function', foreground: 'dcdcaa' },
    { token: 'type', foreground: '4ec9b0' },
    { token: 'variable', foreground: '9cdcfe' },
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#e6edf3',
    'editor.lineHighlightBackground': '#161b22',
    'editor.selectionBackground': '#264f78',
  },
});
```

## Custom Theme Creation

Users can create custom themes via Settings UI:

1. Choose base theme (dark/light)
2. Modify individual colors with color picker
3. Preview changes in real-time
4. Export as `.json` (VS Code compatible) or `.css`
5. Share with community
