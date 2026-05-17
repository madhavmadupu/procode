# Feature Requirements

## Priority Legend
- **P0** — Must have for MVP
- **P1** — Should have for Phase 2
- **P2** — Nice to have for Phase 3
- **P3** — Future consideration

---

## Core IDE (Phase 1)

### Editor
| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| ED-01 | Monaco Editor integration | P0 | Full code editing with syntax highlighting for 100+ languages |
| ED-02 | Multi-pane layout | P0 | Split editors, draggable panels, customizable workspaces |
| ED-03 | File buffer management | P0 | Open, save, auto-save, dirty tracking |
| ED-04 | Multi-cursor editing | P0 | Column selection, multiple cursors |
| ED-05 | Code folding | P0 | Fold/unfold code blocks, fold all, unfold all |
| ED-06 | Bracket matching | P0 | Highlight matching brackets, auto-close |
| ED-07 | Minimap | P1 | Code overview with current viewport indicator |
| ED-08 | Breadcrumbs | P1 | Symbol-level navigation within files |
| ED-09 | Diff editor | P0 | Side-by-side and inline diff for any two revisions |
| ED-10 | Virtual documents | P2 | Git show output, agent-generated previews |

### File Management
| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| FM-01 | File Explorer | P0 | Hierarchical tree, drag-and-drop |
| FM-02 | Multi-root workspaces | P0 | Open multiple folders in single workspace |
| FM-03 | File search | P0 | Fuzzy search over all files (`Ctrl+P`) |
| FM-04 | Recent files | P1 | Quick access to recently opened files |
| FM-05 | File icons | P1 | Language-specific file icons |

### Command System
| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| CS-01 | Command Palette | P0 | Fuzzy search over all commands, files, symbols |
| CS-02 | Keyboard shortcuts | P0 | Full rebinding support, VS Code compatible defaults |
| CS-03 | Snippets | P1 | Language-aware user and built-in snippets |

### Terminal
| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| TM-01 | PTY terminal | P0 | Full PTY with xterm.js rendering |
| TM-02 | Multiple sessions | P0 | Multiple terminal sessions (tabs) |
| TM-03 | Shell profiles | P1 | Shell detection (bash, zsh, fish, PowerShell) |
| TM-04 | Split terminals | P2 | Horizontal/vertical split |
| TM-05 | Terminal links | P2 | Clickable URLs, file paths |

### Settings
| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| ST-01 | Settings UI | P0 | Visual settings editor |
| ST-02 | Settings JSON | P0 | Direct JSON editing |
| ST-03 | Theme system | P0 | Dark/light/custom themes, VS Code theme import |
| ST-04 | Workspace settings | P1 | Per-workspace settings override |

---

## Git Integration (Phase 1)

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| GT-01 | Source Control Panel | P0 | Staged/unstaged changes, inline diff viewer |
| GT-02 | Stage/Unstage | P0 | Stage, unstage, discard changes |
| GT-03 | Commit | P0 | Commit with message, amend, sign-off |
| GT-04 | Branch management | P0 | Create, checkout, delete branches |
| GT-05 | Push/Pull/Fetch | P0 | Remote operations with credential management |
| GT-06 | Git Blame | P1 | Inline authorship with commit metadata |
| GT-07 | Timeline View | P1 | Per-file commit history with diff preview |
| GT-08 | Merge Conflict Editor | P1 | 3-way merge view with accept/reject |
| GT-09 | Stash Management | P2 | Stash, pop, apply, drop |
| GT-10 | Interactive Rebase UI | P2 | Visual commit reordering |
| GT-11 | Git Graph View | P2 | Visual DAG of commit history |
| GT-12 | GitLens-style decorators | P2 | Current line blame, heatmap overlays |

---

## Language Intelligence (Phase 1)

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| LS-01 | LSP host | P0 | Full LSP client with auto-install |
| LS-02 | Go to Definition | P0 | Navigate to symbol definition |
| LS-03 | Find All References | P0 | Find all symbol references |
| LS-04 | Hover documentation | P0 | Hover with rendered Markdown docs |
| LS-05 | IntelliSense | P0 | Completions (LSP + AI hybrid) |
| LS-06 | Signature help | P0 | Parameter hints on function calls |
| LS-07 | Rename symbol | P0 | Cross-file rename |
| LS-08 | Code actions | P0 | Quick fixes and refactoring actions |
| LS-09 | Format on save | P1 | Prettier, language-specific formatters |
| LS-10 | Diagnostics | P0 | Errors, warnings, hints in Problems panel |
| LS-11 | Inlay hints | P1 | Type annotations, parameter names |
| LS-12 | Semantic tokens | P1 | Syntax highlighting from LSP |
| LS-13 | Document symbols | P1 | Outline view of file symbols |
| LS-14 | Workspace symbols | P1 | Search symbols across workspace |

---

## Debugging (Phase 4)

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| DB-01 | DAP host | P1 | Full Debug Adapter Protocol client |
| DB-02 | Breakpoints | P1 | Line, conditional, logpoints, hit-count |
| DB-03 | Call stack | P1 | Stack frame navigation |
| DB-04 | Variable inspection | P1 | Variables panel, watch expressions |
| DB-05 | Debug console REPL | P1 | Interactive REPL in debug console |
| DB-06 | Remote debugging | P2 | Attach to remote processes |

---

## AI Features (Phase 2-3)

### Inline AI
| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| AI-01 | Smart Autocomplete | P1 | RAG-augmented completions using codebase context |
| AI-02 | Inline Chat | P1 | Chat bubble in-editor (`Ctrl+K`) for inline edits |
| AI-03 | Doc Generation | P2 | Generate JSDoc/docstrings for any function |
| AI-04 | Explain Code | P1 | Select code, get plain-English explanation |
| AI-05 | Refactor Suggestions | P2 | AI-detected smell patterns with one-click refactors |

### AI Chat
| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| AI-06 | Persistent chat | P1 | Conversation with full codebase context |
| AI-07 | `@file` mentions | P1 | Reference specific files in chat |
| AI-08 | `@symbol` mentions | P1 | Reference specific symbols in chat |
| AI-09 | `@git-commit` mentions | P2 | Reference specific commits in chat |
| AI-10 | `@branch` mentions | P2 | Reference branches in chat |
| AI-11 | Streaming responses | P1 | Real-time streaming with syntax-highlighted code |
| AI-12 | Accept/reject changes | P1 | Apply code changes directly from chat |
| AI-13 | Conversation history | P2 | Searchable conversation history |

### Knowledge Graph
| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| KG-01 | Indexing pipeline | P1 | Auto-index workspace on file changes |
| KG-02 | Graph persistence | P1 | SurrealDB persistence across sessions |
| KG-03 | Graph Explorer UI | P2 | Visual force-directed graph with D3 |
| KG-04 | Filter by type | P2 | Filter nodes/edges by type |
| KG-05 | Time-travel | P3 | View graph state at any git commit |
| KG-06 | Focus mode | P2 | Show subgraph around selected node |

### Multi-Agent
| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| AG-01 | Agent orchestration | P2 | LangGraph-style state machine |
| AG-02 | CoderAgent | P2 | Code generation and editing |
| AG-03 | ReviewerAgent | P2 | Code review and critique |
| AG-04 | DebuggerAgent | P2 | Error diagnosis and fixing |
| AG-05 | ArchitectAgent | P3 | System design and refactoring plans |
| AG-06 | TestAgent | P3 | Test generation and validation |
| AG-07 | DocAgent | P3 | Documentation generation |
| AG-08 | HITL approval | P2 | Approve/reject agent file writes |
| AG-09 | Agent Panel UI | P2 | Live agent thoughts, tool calls, results |
| AG-10 | Agent memory | P2 | Short-term and long-term memory |

---

## Extensions (Phase 4)

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| EX-01 | VS Code API subset | P2 | window, workspace, languages, commands APIs |
| EX-02 | Sandboxed extension host | P2 | Child worker with restricted API |
| EX-03 | ProCode-native API | P2 | Graph queries, agent spawning |
| EX-04 | Extension Marketplace | P3 | Curated, local-installable extensions |
