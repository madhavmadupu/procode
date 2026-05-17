# UI Layout

## Five-Zone Layout

ProCode mirrors VS Code's proven 5-zone layout with enhancements for AI features.

```
┌──────────────────────────────────────────────────────────────────────┐
│                          TITLE BAR                                    │
│  [☰] ProCode — my-project  [File Edit View Go Run Terminal Help]  [— □ ×] │
├──┬───────────────────────────────────────────────────────────────────┤
│  │  [src/index.ts]  [utils/helpers.ts]  [README.md]  [+]            │
│A │  ─────────────────────────────────────────────────────────────── │
│C │  > 1  │ import { createApp } from './app';                       │
│T │  > 2  │                                                          │
│I │  > 3  │ const app = createApp({                                   │
│V │  > 4  │   name: 'ProCode',                                       │
│  │  > 5  │   version: '1.0.0',                                      │
│  ├──────────────────────────────────────────────────────────────────│
│  │  TERMINAL  │  PROBLEMS  │  OUTPUT  │  DEBUG CONSOLE              │
│  │  $ npm run dev                                                    │
│  │  > VITE v5.0.0  ready in 234ms                                    │
│  ├──────────────────────────────────────────────────────────────────│
│  │  TypeScript  UTF-8  LF  Ln 4, Col 12  main  ✓ LSP  ● Agent      │
│  └──────────────────────────────────────────────────────────────────┘
│B │  [🔍 Explorer]  [🔎 Search]  [⎇ Source Control]  [▶ Debug]
│A │  [🧩 Extensions]  [🤖 AI Chat]  [🕸 Graph]  [⚙ Settings]
│R └──────────────────────────────────────────────────────────────────┘
```

## Zone Specifications

### Title Bar
- Height: 30px
- Left: Window controls (macOS: traffic lights, Win/Linux: hamburger menu)
- Center: Project name, current file
- Right: Menu bar (File, Edit, View, Go, Run, Terminal, Help)
- Far right: Window controls (minimize, maximize, close)

### Activity Bar
- Width: 48px
- Position: Left edge
- Icons (top to bottom):
  1. Explorer (File tree)
  2. Search (Find in files)
  3. Source Control (Git)
  4. Run & Debug
  5. Extensions
  6. **AI Chat** (ProCode exclusive)
  7. **Knowledge Graph** (ProCode exclusive)
  8. Settings (bottom-aligned)
- Active indicator: 2px left border, brand color
- Notification badges: red dot with count

### Primary Sidebar
- Width: 260px (resizable)
- Content changes based on active activity bar icon
- Sections:
  - **Explorer:** File tree, outline, timeline
  - **Search:** Find/replace in files
  - **Source Control:** Changes, staged changes, commit input
  - **Debug:** Variables, watch, call stack, breakpoints
  - **Extensions:** Installed, recommended, marketplace search
  - **AI Chat:** Chat interface (when AI panel is primary sidebar)
  - **Knowledge Graph:** Graph controls, search, filters

### Editor Area
- Flexible width and height
- Tab bar at top (36px per tab)
- Breadcrumb bar below tabs (22px)
- Monaco editor fills remaining space
- Split panes via drag to edge or `Ctrl+\`
- Tab features: close button, dirty indicator, pin icon, preview mode (italic)

### Bottom Panel
- Height: 200px (resizable)
- Tabs:
  - **Terminal:** PTY terminal with xterm.js
  - **Problems:** Diagnostics from all LSP servers
  - **Output:** Multi-channel log viewer
  - **Debug Console:** REPL during debug sessions
- Show/hide with `` Ctrl+` ``

### Status Bar
- Height: 22px
- Left section: Language mode, encoding, line ending, line/column
- Right section: Git branch, LSP status, Ollama status, AI agent indicator
- Color coding:
  - Green: All systems operational
  - Yellow: Warning (LSP starting, indexing in progress)
  - Red: Error (LSP failed, Ollama not running)

### AI Panel (Secondary Sidebar)
- Width: 400px (resizable)
- Position: Right side (can be moved to left)
- Content:
  - **AI Chat:** Conversation with codebase context
  - **Agent Tasks:** Live agent status, thoughts, results
  - **Knowledge Graph Explorer:** Visual graph view
- Can be shown/hidden independently of primary sidebar

## Responsive Behavior

### Minimum Window Size
- Width: 600px
- Height: 400px
- Below minimum: show warning, disable resizing

### Panel Collapse
- On small screens (< 1200px width), secondary sidebar collapses to overlay
- Bottom panel can be toggled full-width
- Activity bar icons can show labels on wide screens (> 1600px)

## Keyboard Navigation

### Focus Order
1. Activity bar (Arrow Up/Down to navigate)
2. Primary sidebar content (Tab to navigate)
3. Editor area (Enter to focus editor)
4. Bottom panel (when visible)
5. Status bar (clickable items only)

### Quick Open
- `Ctrl+P` — Quick file open
- `Ctrl+Shift+P` — Command palette
- `Ctrl+K` — Inline chat (in editor)
- `Ctrl+L` — AI chat panel
- `` Ctrl+` `` — Toggle terminal
- `Ctrl+B` — Toggle primary sidebar
- `Ctrl+J` — Toggle bottom panel
