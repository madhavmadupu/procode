# ProCode Phase Plan

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI vs LSP ordering | AI before LSP | AI is the differentiator; LSP is table-stakes |
| Editor shell scope | B — Usable editor | Users won't stick around for AI if editor feels broken |
| AI interaction model | C — Agent-first | Biggest whitespace. Agent that builds features across codebase is the killer feature |
| Agent execution | C — Hybrid | Scratch workspace + live progress + step-by-step approval |
| Tool permissions | C — Capability tiers | Safe defaults for new users, power users can loosen |
| Knowledge graph | A first, design for C | Static analysis is free and fast. Runtime telemetry later |
| Native crates | B + procode-native in Phase 1 | Just-in-time Rust, but NAPI-RS scaffolding must exist first |
| LLM providers | B — Multi-provider from day one | Local-first positioning requires Ollama at launch |
| Electron mode | Single-window SPA | Faster to build, revisit multi-window in v2 |
| IPC | tRPC from day one | End-to-end typed, prevents malformed payloads, pays cost upfront |
| Workspace model | Single-root v1 | Multi-root complicates URIs, git, LSP, graph — additive in v2 |
| Extensions v1 | None, internal panels only | Half-implemented extension system worse than none |
| Settings storage | JSON source + SQLite cache | Familiar, git-trackable, human-readable, fast reads |
| Ollama chat model | `qwen2.5-coder:7b` | Apache 2.0, code-optimized, runs on 8GB VRAM |
| Embedding model | `nomic-embed-text:v1.5` | 768 dimensions, runs on CPU |
| Model pull | Prompt on first launch | Never auto-pull silently — respect metered connections |
| Min VRAM target | 8GB | Warn at 4GB, suggest 14b at 16GB+ |
| Index trigger | File watch 800ms debounce + git commit full sync | Wait for typing to stop, catch drift on commit |
| RAG chunk size | 512 tokens max, function-level preferred | Fits embedding optimal range, precise retrieval |
| Agent concurrency | Sequential FIFO queue v1 | Simple, predictable, no merge conflicts |
| HITL granularity | Diff-level, hunk-by-hunk, configurable trust | Real control, not too coarse |
| Git credentials | Delegate to system entirely | Security minefield to build our own |
| Terminal shell | Respect `$SHELL`, PS7 on Windows | Never hardcode, inject only PROCODE env vars |
| Default font | JetBrains Mono (bundled), ligatures on | Best coding font, Apache 2.0 |
| Default keymap | VS Code | Lowest friction onboarding |
| Vim mode | Built-in toggle v1 | Deep Monaco integration, extension can't do it cleanly |
| Themes | 4 built-in, VS Code import v1 | Dark, Light, HC Dark, HC Light |
| Auto-update | GitHub Releases, stable only | Free, reliable, no infra |
| Telemetry | Opt-in, zero network in local-only | Privacy-first positioning |
| First run | 3-step wizard, skippable | Workspace → AI setup → done, under 2 minutes |
| Platform priority | macOS arm64 > x64 > Linux x64 > Windows x64 | Local AI users skew macOS/Linux |
| License | Apache 2.0 | Patent protection, OSI-approved, dual-license path |

## Phase 1: Foundation ✅

**Goal:** Workspace structure, build pipeline, skeleton packages

- [x] Turborepo + pnpm workspace
- [x] Cargo workspace (4 crates)
- [x] Electron + Vite + React skeleton
- [x] 13 TS packages with strict mode
- [x] NAPI-RS scaffolding (`procode-native`)
- [x] Build pipeline verified (14/14 packages)
- [x] Domain types in `@procode/types` (8 modules)
- [x] Core utilities in `@procode/utils` (Result, path, async)

**Native crates:** `procode-native` (scaffolding only)

## Phase 2: Core Editor Shell

**Goal:** Open a folder, browse files, edit with syntax highlighting. Feels like a real editor.

### Architecture Constraints
- Single-window SPA — all panels route within one renderer
- Single-root workspace — one folder, `file:///absolute/path` URIs
- tRPC over Electron IPC — custom adapter, typed end-to-end
- No extension system — internal panels only

### File System
- [ ] `FileSystemService` (main process) — open folder, read/write files, stat, list directory
- [ ] File watcher (notify-rs via NAPI) — debounce file change events
- [ ] tRPC adapter — typed IPC layer for all FS operations
- [ ] Workspace state persistence — SQLite (better-sqlite3)

### Settings
- [ ] JSON settings loader — `~/.procode/settings/settings.json` (global)
- [ ] Workspace settings loader — `.procode/settings.json` at workspace root
- [ ] Settings merger — global + workspace override logic
- [ ] SQLite cache — merged result for fast reads
- [ ] File watcher — picks up external edits to JSON files

### Editor Integration
- [ ] Monaco Editor in renderer
- [ ] Language detection + basic syntax highlighting
- [ ] Tab/document management — open, close, switch, dirty state
- [ ] File tree sidebar — recursive directory tree, icons, expand/collapse
- [ ] JetBrains Mono font (bundled), ligatures on by default
- [ ] VS Code keymap as default

### Layout & Chrome
- [ ] Three-panel layout: sidebar | editor | (future panel area)
- [ ] Title bar — window controls, workspace name
- [ ] Status bar — file type, line/col, git branch (placeholder), Ollama health
- [ ] Breadcrumbs — file path navigation
- [ ] Find/replace — Monaco built-in
- [ ] Fuzzy file search — quick open (Cmd/Ctrl+P)
- [ ] Basic keybindings — save, close tab, switch tab, toggle sidebar

### State Management
- [ ] Zustand stores — workspace, editor, tabs, file tree, settings
- [ ] IPC wiring — connect renderer stores to main process services via tRPC
- [ ] Frozen TS interfaces in `@procode/types` for `KnowledgeGraph` and `VectorIndex` (stub implementations)

### First-Run Experience
- [ ] 3-step wizard (skippable): Open workspace → AI setup → Done
- [ ] Ollama detection + model pull UI with progress bar
- [ ] Cloud provider fallback option (API key input)

### Native crates: None new

## Phase 3: Git Integration

**Goal:** Full git workflow inside editor — changes, commits, branches, blame.

### Git Engine
- [ ] `procode-git` (Rust) — libgit2 bindings: status, diff, commit, branch, blame, log
- [ ] `GitEngine` (TS wrapper) — high-level API over native crate
- [ ] Source control panel — changes, staged, commit message, commit button
- [ ] Inline diff viewer — unified diff with syntax highlighting
- [ ] Branch management — create, checkout, delete, list
- [ ] Git blame — inline gutter annotations
- [ ] Commit history — log view with file changes per commit

### Native crates: `procode-git`

## Phase 4: AI Core

**Goal:** AI pair programmer with repo context. Agent that can build features across the codebase.

### LLM Client
- [ ] Two-tier provider interface (`LLMProvider`, `AgenticProvider`)
- [ ] Ollama adapter — managed sidecar, process lifecycle, model pull UI, health checks
- [ ] OpenCode adapter — agentic delegation, task handoff, `supportsHandoff()`
- [ ] Anthropic adapter — cloud chat/completion, tool-use support
- [ ] OpenAI adapter — cloud chat/completion, `baseUrl` for compatible providers
- [ ] Provider config UI — discriminated union config, switch providers
- [ ] EmbeddingProvider — ALWAYS Ollama, `nomic-embed-text:v1.5`, decoupled from chat
- [ ] Default chat model: `qwen2.5-coder:7b` (8GB VRAM target)

### Agent Orchestration
- [ ] `AgentRouter` — task planning, tool selection, handoff to OpenCode if available
- [ ] Multi-agent system — planner, executor, reviewer agents
- [ ] Tool definitions — ReadFile, WriteFile, SearchCode, GraphQuery, RunTerminal
- [ ] Capability tier system — workspace read (always), write (tiered), terminal (approval), system (blocked)
- [ ] Sequential FIFO queue — one active task at a time, pending tasks visible
- [ ] HITL approval UI — diff-level, hunk-by-hunk, Accept All / Reject All / Accept This Hunk
- [ ] Trust levels — strict, standard (default), auto, configurable per agent type
- [ ] Task execution UI — live progress, step-by-step approval, promote/rollback

### Knowledge Graph
- [ ] `procode-graph` (Rust) — petgraph-based, AST parsing, dependency graphs
- [ ] Static analysis pipeline — imports/exports, function calls, type relationships
- [ ] Indexing trigger: file watch debounced 800ms + full sync on git commit
- [ ] Workspace open: always run full sync
- [ ] Graph query API — CALLS inbound/outbound, impact analysis
- [ ] Graph UI — visualize dependencies, node inspection

### RAG Pipeline
- [ ] Code-aware chunking — function-level → class (header + signatures) → top-level block → 512-token sliding window with 128-token overlap
- [ ] Max chunk size: 512 tokens
- [ ] Comments kept attached to their function
- [ ] Excluded: `node_modules/`, `dist/`, `build/`, `target/`, `.git/`, `*.min.js`, `*.map`, `*.lock`, binaries, files >1MB, `.gitignore` paths
- [ ] `procode-vector` (Rust) — HNSW index with cosine similarity
- [ ] Hybrid search — HNSW vector + BM25 FTS5 with Reciprocal Rank Fusion
- [ ] Reranking — cross-encoder via ONNX runtime (for agent tasks)
- [ ] Context assembly — build prompt context from graph + RAG results

### Agent UI
- [ ] Agent panel — task input, live progress stream, results display
- [ ] Scratch workspace — agent works in isolated branch, user promotes changes
- [ ] Inline AI actions — explain, refactor, generate (triggered from editor)
- [ ] Review interface — diff view for agent-proposed changes, approve/reject per file

### Native crates: `procode-graph`, `procode-vector`

## Phase 5: Language Intelligence

**Goal:** VS Code-level code intelligence for 2-3 languages (TypeScript, Rust, Python).

### LSP Host
- [ ] `LSPHost` — spawn, manage, communicate with language servers
- [ ] Diagnostics — error/warning squiggles, problem panel
- [ ] Hover — type info, docstrings on hover
- [ ] Go-to-definition — jump to symbol definition
- [ ] Autocomplete — completion items with snippets
- [ ] Symbol search — workspace-wide symbol search (Cmd/Ctrl+T)
- [ ] Rename symbol — refactor-aware rename across files
- [ ] Language server installer — `install-lsp-servers.sh` for TS, Rust, Python

### DAP Host
- [ ] `DAPHost` — debug adapter protocol support
- [ ] Breakpoints — set, hit, conditional
- [ ] Step execution — step over, into, out, continue
- [ ] Variable inspection — watch, locals, call stack
- [ ] Debug console — REPL during debug session

### Native crates: None new

## Phase 6: Extension System + Terminal

**Goal:** Extensible platform with integrated terminal and debugging.

### Extension API
- [ ] VS Code-compatible subset — commands, menus, status bar items, settings
- [ ] Extension marketplace — browse, install, enable/disable extensions
- [ ] Extension sandbox — isolated execution, limited permissions
- [ ] Extension API surface — workspace, editor, window, languages namespaces

### Terminal
- [ ] `node-pty` in main process — PTY management
- [ ] `xterm.js` in renderer — terminal UI
- [ ] Terminal panel — multiple tabs, split panes
- [ ] Shell integration — cwd tracking, command detection
- [ ] Terminal task runner — run tasks from command palette

### Native crates: None new

## Phase 7: Polish & Ship

**Goal:** Distributable v0.1

### Settings & Theming
- [ ] Settings UI — search, categories, JSON config
- [ ] Theme system — light, dark, custom themes
- [ ] Keybinding editor — customize, conflicts detection
- [ ] Font settings — family, size, ligatures

### Performance
- [ ] Monaco virtualized for large files
- [ ] Lazy loading of language servers
- [ ] Memory profiling — leak detection, heap snapshots
- [ ] Startup time optimization — deferred initialization

### Distribution
- [ ] Auto-updater — check, download, apply updates
- [ ] Packaging — dmg (macOS), exe/MSI (Windows), AppImage (Linux)
- [ ] Code signing — macOS notarization, Windows certificate
- [ ] Release notes — changelog generation

### Native crates: None new

## Rust Crate Schedule

| Phase | Crate | Why then |
|-------|-------|----------|
| 1 | `procode-native` (scaffolding) | NAPI-RS build pipeline, CI, `.node` loading in Electron |
| 3 | `procode-git` | Ships with Git panel — blame, diff, history need libgit2 speed |
| 4 | `procode-graph` + `procode-vector` | Agent and RAG features actually query them |

## Critical Interfaces (Frozen by End of Phase 2)

These TypeScript interfaces in `@procode/types` must be defined and frozen by end of Phase 2 so Phase 4 Rust crates are drop-in replacements:

- `KnowledgeGraph` — node/edge types, query API, impact analysis
- `VectorIndex` — insert, search, delete, cosine similarity
- `GitRepository` — status, diff, commit, branch, blame (Phase 3 prep)

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| TS graph/vector APIs drift before Rust ships | Freeze interfaces in Phase 2. Rust crates satisfy contracts via NAPI-RS |
| Ollama sidecar fails to start | Fallback to cloud provider (Anthropic/OpenAI) with user notification |
| Agent makes destructive changes | Capability tiers + scratch workspace + step-by-step approval |
| Large repo git operations slow | Rust libgit2 from Phase 3, not isomorphic-git |
| LSP servers consume too much memory | Lazy loading, per-language server memory limits, kill idle servers |
