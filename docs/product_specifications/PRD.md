# ProCode IDE
## Complete Product Specification, Architecture & Technical Documentation

> **Version:** 1.0.0-alpha  
> **Stack Decision:** TypeScript (Electron + Node.js core) + Rust (performance-critical subsystems via NAPI-RS)  
> **Tagline:** The AI-native IDE built for the agentic era — local-first, knowledge-aware, multi-agent orchestrated.

---

## Table of Contents

1. [Product Vision & Philosophy](#1-product-vision--philosophy)
2. [Stack Decision Rationale](#2-stack-decision-rationale)
3. [Feature Set](#3-feature-set)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [Monorepo Structure](#5-monorepo-structure)
6. [Core Subsystems](#6-core-subsystems)
   - 6.1 [Editor Engine](#61-editor-engine)
   - 6.2 [File System & Git Integration](#62-file-system--git-integration)
   - 6.3 [Knowledge Graph System](#63-knowledge-graph-system)
   - 6.4 [RAG Pipeline](#64-rag-pipeline)
   - 6.5 [Multi-Agent Orchestration](#65-multi-agent-orchestration)
   - 6.6 [Language Server Protocol (LSP)](#66-language-server-protocol-lsp)
   - 6.7 [Extension System](#67-extension-system)
   - 6.8 [Terminal Subsystem](#68-terminal-subsystem)
   - 6.9 [UI Shell](#69-ui-shell)
7. [Data Models & Schemas](#7-data-models--schemas)
8. [API Contracts](#8-api-contracts)
9. [Database Strategy](#9-database-strategy)
10. [Security Model](#10-security-model)
11. [Build & Packaging](#11-build--packaging)
12. [Roadmap](#12-roadmap)
13. [Engineering Standards](#13-engineering-standards)

---

## 1. Product Vision & Philosophy

ProCode is a **developer-first, AI-native IDE** that treats your codebase as a living knowledge graph, not just a collection of files. Every symbol, dependency, commit, and architectural decision is indexed, reasoned over, and made available to a fleet of AI agents that work alongside you — not just autocomplete your next line.

### Core Principles

| Principle | What it means |
|---|---|
| **Local-First** | All AI inference, indexing, and data storage happens on your machine. No code leaves without explicit consent. |
| **Knowledge-Aware** | The IDE maintains a persistent semantic graph of your codebase — relationships, call graphs, data flows, architectural boundaries. |
| **Agent-Orchestrated** | Multiple specialized AI agents (Architect, Reviewer, Debugger, Documenter, Test Writer) collaborate through a structured orchestration layer. |
| **Standard-Compatible** | Full LSP, DAP, Git, and extension protocol compatibility. Existing tools work out of the box. |
| **Performance-Uncompromising** | Rust powers the hot paths: file watching, AST parsing, vector search, and graph traversal. TypeScript handles UX and orchestration. |

---

## 2. Stack Decision Rationale

ProCode uses a **hybrid TypeScript + Rust** architecture — TypeScript for the application shell, orchestration logic, and UI, and Rust for performance-critical native subsystems exposed via NAPI-RS bindings.

### Why TypeScript for the Shell

- Electron is the fastest path to a cross-platform IDE with a rich ecosystem
- Monaco Editor (the VS Code editor component) is TypeScript-native
- LSP, DAP, Git protocols all have mature TypeScript/Node.js implementations
- Fastest iteration speed for UI and agent orchestration logic

### Why Rust for Native Modules

- File watching and indexing of large repos (100k+ files) requires zero-copy I/O
- AST parsing (via Tree-sitter compiled to WASM or native) is CPU-bound
- Vector similarity search (HNSW index) needs cache-efficient memory layout
- Knowledge graph traversal over millions of edges needs tight memory control
- Rust → Node.js via `napi-rs` gives native performance with zero FFI overhead

### Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer          React 18 + Vite + Tailwind CSS           │
│  Editor            Monaco Editor (VS Code engine)           │
│  App Shell         Electron 30 (Chromium + Node.js)         │
│  IPC / RPC         Electron IPC + tRPC (type-safe)          │
│  Orchestration     TypeScript — LangGraph-style state machine│
│  AI Inference      Ollama (local) + optional cloud adapters  │
│  Embeddings        nomic-embed-text (local via Ollama)       │
│  Native Modules    Rust via NAPI-RS                          │
│  LSP Host          vscode-languageclient (TypeScript)        │
│  Git               isomorphic-git + libgit2 (Rust binding)  │
│  Graph DB          SurrealDB (embedded, local)               │
│  Vector Store      Custom HNSW in Rust + SQLite-vec fallback │
│  Relational        SQLite via better-sqlite3                  │
│  Build System      Turborepo + Cargo workspaces              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Feature Set

### 3.1 Core IDE Features (Parity with VS Code / Cursor)

- **Monaco Editor** — full code editing with syntax highlighting for 100+ languages
- **Multi-pane layout** — split editors, draggable panels, customizable workspaces
- **File Explorer** — hierarchical tree, drag-and-drop, multi-root workspaces
- **Command Palette** — fuzzy search over all commands, files, and symbols (`Ctrl+Shift+P`)
- **Integrated Terminal** — full PTY with multiple sessions, shell profiles, split panes
- **Find & Replace** — file-level and workspace-wide with regex support
- **Breadcrumbs** — symbol-level navigation within files
- **Minimap** — code overview with current viewport indicator
- **Tabs & Tab Groups** — pinnable, previewed, closable
- **Settings UI** — JSON and visual settings editor
- **Keyboard Shortcut Editor** — full rebinding support
- **Snippets** — language-aware user and built-in snippets
- **Problems Panel** — diagnostics aggregated from all LSP servers
- **Output & Debug Console** — multi-channel log viewer

### 3.2 Git Integration (VS Code parity + enhancements)

- **Source Control Panel** — staged/unstaged changes, inline diff viewer
- **Git Blame Annotations** — inline authorship with commit metadata
- **Timeline View** — per-file commit history with diff preview
- **Branch Management** — create, checkout, merge, rebase, delete via UI
- **Merge Conflict Editor** — 3-way merge view with accept/reject controls
- **Stash Management** — stash, pop, apply, drop
- **Interactive Rebase** — visual commit reordering UI
- **Remote Management** — push, pull, fetch with credential management
- **Git Graph View** — visual DAG of commit history
- **Diff Editor** — side-by-side and inline diff for any two revisions
- **GitLens-style decorators** — current line blame, heatmap overlays

### 3.3 Language Intelligence (LSP)

- Auto-install language servers per workspace language
- Go to Definition / Declaration / Implementation / Type Definition
- Find All References / Call Hierarchy / Type Hierarchy
- Hover documentation with rendered Markdown
- IntelliSense completions (LSP + AI hybrid)
- Signature help
- Rename symbol (cross-file)
- Code actions & quick fixes
- Format on save (Prettier, language-specific formatters)
- Diagnostics (errors, warnings, hints)
- Inlay hints
- Semantic token highlighting
- Document symbols / Workspace symbols

### 3.4 Debug Adapter Protocol (DAP)

- Breakpoints (line, conditional, logpoints, hit-count)
- Call stack and stack frame navigation
- Variable inspection and watch expressions
- REPL in debug console
- Remote debugging support
- Multi-process/thread debugging

### 3.5 AI Features — ProCode Exclusive

#### Inline AI
- **Smart Autocomplete** — RAG-augmented completions using your codebase context
- **Inline Chat** — open a chat bubble in-editor (`Ctrl+K`) for inline edits
- **Doc Generation** — generate JSDoc/docstrings for any function
- **Explain Code** — select any code block and get a plain-English explanation
- **Refactor Suggestions** — AI-detected smell patterns with one-click refactors

#### AI Chat Panel
- Persistent conversation with full codebase context
- `@file`, `@symbol`, `@git-commit`, `@branch` mentions
- Streaming responses with syntax-highlighted code blocks
- Accept/reject code changes directly from chat
- Conversation history with search

#### Knowledge Graph Explorer
- Visual graph view of your codebase's semantic structure
- Click any node to navigate to source
- Filter by relationship type (calls, imports, implements, tests)
- Time-travel: view graph state at any git commit

#### Multi-Agent Panel
- Spawn specialized agents for long-running tasks
- See live agent thoughts, tool calls, and intermediate results
- Approve/reject agent actions before they write files
- Agent conversation history per task

### 3.6 Extensions

- VS Code extension compatibility layer (subset of VS Code Extension API)
- ProCode-native extension API with access to Knowledge Graph and Agent system
- Extension Marketplace (curated, local-installable)

---

## 4. System Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          PROCODE DESKTOP APP                               │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        RENDERER PROCESS (UI)                        │  │
│  │  React App  │  Monaco Editor  │  Knowledge Graph Viz  │  Agent UI  │  │
│  └───────────────────────────┬─────────────────────────────────────────┘  │
│                              │  Electron IPC / tRPC                        │
│  ┌───────────────────────────▼─────────────────────────────────────────┐  │
│  │                        MAIN PROCESS (Node.js)                       │  │
│  │                                                                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │  │
│  │  │ Editor Core  │  │  Git Engine  │  │   LSP / DAP Host        │  │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────────────┘  │  │
│  │                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │                  AI ORCHESTRATION LAYER                      │  │  │
│  │  │  Agent Router  │  Task Queue  │  Context Builder  │  Memory  │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  │                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │                   NATIVE MODULE BRIDGE (NAPI-RS)             │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                              │  NAPI-RS Bindings                           │
│  ┌───────────────────────────▼─────────────────────────────────────────┐  │
│  │                     RUST NATIVE SUBSYSTEMS                          │  │
│  │                                                                     │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │  │ File Watcher│  │  AST Parser  │  │  Vector Index (HNSW)     │  │  │
│  │  │ (notify-rs) │  │ (tree-sitter)│  │                          │  │  │
│  │  └─────────────┘  └──────────────┘  └──────────────────────────┘  │  │
│  │                                                                     │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │  │ Graph Engine│  │  Git (libgit2│  │  Code Indexer            │  │  │
│  │  │ (petgraph)  │  │  binding)    │  │                          │  │  │
│  │  └─────────────┘  └──────────────┘  └──────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌───────────────────────────────────────────────────────────────────┐    │
│  │                         DATA LAYER                                │    │
│  │  SQLite (workspace state)  │  SurrealDB (knowledge graph)         │    │
│  │  Vector Store (embeddings) │  LevelDB (LSP caches)                │    │
│  └───────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                             ┌──────▼──────┐
                             │   Ollama    │
                             │  (sidecar)  │
                             │  LLM + Emb  │
                             └─────────────┘
```

---

## 5. Monorepo Structure

```
procode/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Build, test, lint on every PR
│   │   ├── release.yml               # Electron packaging + GitHub release
│   │   └── rust-clippy.yml           # Rust linting
│   └── CODEOWNERS
│
├── .cursorrules                       # AI IDE context for contributors
├── .gitignore
├── turbo.json                         # Turborepo pipeline config
├── package.json                       # Root workspace config
├── pnpm-workspace.yaml
├── Cargo.toml                         # Rust workspace root
├── Cargo.lock
├── tsconfig.base.json
│
├── apps/
│   ├── desktop/                       # Electron application
│   │   ├── src/
│   │   │   ├── main/                  # Main process (Node.js)
│   │   │   │   ├── index.ts           # App entry, window management
│   │   │   │   ├── ipc/               # IPC handler registry
│   │   │   │   │   ├── editor.ipc.ts
│   │   │   │   │   ├── git.ipc.ts
│   │   │   │   │   ├── agent.ipc.ts
│   │   │   │   │   └── graph.ipc.ts
│   │   │   │   ├── services/          # Main-process services
│   │   │   │   │   ├── WindowManager.ts
│   │   │   │   │   ├── WorkspaceManager.ts
│   │   │   │   │   ├── OllamaManager.ts
│   │   │   │   │   └── UpdateManager.ts
│   │   │   │   └── preload/
│   │   │   │       └── index.ts       # Context bridge
│   │   │   │
│   │   │   └── renderer/              # Renderer process (React)
│   │   │       ├── index.html
│   │   │       ├── main.tsx
│   │   │       ├── App.tsx
│   │   │       ├── components/
│   │   │       │   ├── editor/
│   │   │       │   │   ├── MonacoEditor.tsx
│   │   │       │   │   ├── EditorTabs.tsx
│   │   │       │   │   ├── EditorBreadcrumbs.tsx
│   │   │       │   │   └── InlineChat.tsx
│   │   │       │   ├── sidebar/
│   │   │       │   │   ├── FileExplorer.tsx
│   │   │       │   │   ├── SourceControl.tsx
│   │   │       │   │   ├── SearchPanel.tsx
│   │   │       │   │   ├── ExtensionsPanel.tsx
│   │   │       │   │   └── AgentPanel.tsx
│   │   │       │   ├── panels/
│   │   │       │   │   ├── Terminal.tsx
│   │   │       │   │   ├── ProblemsPanel.tsx
│   │   │       │   │   ├── OutputPanel.tsx
│   │   │       │   │   ├── DebugConsole.tsx
│   │   │       │   │   └── KnowledgeGraphView.tsx
│   │   │       │   ├── chat/
│   │   │       │   │   ├── AIChat.tsx
│   │   │       │   │   ├── ChatMessage.tsx
│   │   │       │   │   ├── ChatInput.tsx
│   │   │       │   │   └── CodeBlock.tsx
│   │   │       │   └── shared/
│   │   │       │       ├── CommandPalette.tsx
│   │   │       │       ├── StatusBar.tsx
│   │   │       │       ├── ActivityBar.tsx
│   │   │       │       ├── NotificationToast.tsx
│   │   │       │       └── DiffEditor.tsx
│   │   │       ├── hooks/
│   │   │       │   ├── useEditor.ts
│   │   │       │   ├── useGit.ts
│   │   │       │   ├── useAgent.ts
│   │   │       │   └── useKnowledgeGraph.ts
│   │   │       ├── stores/            # Zustand stores
│   │   │       │   ├── editor.store.ts
│   │   │       │   ├── workspace.store.ts
│   │   │       │   ├── git.store.ts
│   │   │       │   ├── agent.store.ts
│   │   │       │   └── settings.store.ts
│   │   │       └── styles/
│   │   │           ├── tokens.css     # Design tokens
│   │   │           └── themes/
│   │   │               ├── dark.css
│   │   │               └── light.css
│   │   ├── electron.vite.config.ts
│   │   └── package.json
│
├── packages/
│   ├── editor-core/                   # Editor state management (shared)
│   │   ├── src/
│   │   │   ├── EditorModel.ts         # File buffer, cursor, selections
│   │   │   ├── EditorGroup.ts         # Tab groups
│   │   │   ├── LanguageRegistry.ts    # Language → LSP server mapping
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── git-engine/                    # Git operations (TypeScript layer)
│   │   ├── src/
│   │   │   ├── GitRepository.ts       # Workspace git state
│   │   │   ├── GitOperations.ts       # commit, branch, merge, rebase
│   │   │   ├── GitDiff.ts             # Diff computation and parsing
│   │   │   ├── GitBlame.ts            # Blame annotations
│   │   │   ├── GitTimeline.ts         # Per-file history
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── lsp-host/                      # LSP client host
│   │   ├── src/
│   │   │   ├── LanguageClient.ts      # Per-language LSP client
│   │   │   ├── ServerRegistry.ts      # LSP server definitions
│   │   │   ├── CapabilityManager.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── dap-host/                      # Debug Adapter Protocol host
│   │   ├── src/
│   │   │   ├── DebugSession.ts
│   │   │   ├── BreakpointManager.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── knowledge-graph/               # Knowledge graph TypeScript API
│   │   ├── src/
│   │   │   ├── GraphClient.ts         # Interface to Rust graph engine
│   │   │   ├── GraphSchema.ts         # Node/edge type definitions
│   │   │   ├── GraphQuery.ts          # Query builder
│   │   │   ├── GraphSync.ts           # Git-aware incremental sync
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── rag-pipeline/                  # RAG system
│   │   ├── src/
│   │   │   ├── Chunker.ts             # Code-aware chunking strategies
│   │   │   ├── Embedder.ts            # Ollama embedding client
│   │   │   ├── Retriever.ts           # Hybrid search (vector + BM25)
│   │   │   ├── ContextBuilder.ts      # Assembles retrieved context
│   │   │   ├── Reranker.ts            # Cross-encoder reranking
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── agent-orchestration/           # Multi-agent system
│   │   ├── src/
│   │   │   ├── AgentGraph.ts          # LangGraph-style orchestration
│   │   │   ├── agents/
│   │   │   │   ├── ArchitectAgent.ts  # High-level design decisions
│   │   │   │   ├── CoderAgent.ts      # Code generation & editing
│   │   │   │   ├── ReviewerAgent.ts   # Code review & critique
│   │   │   │   ├── DebuggerAgent.ts   # Error diagnosis & fixing
│   │   │   │   ├── TestAgent.ts       # Test generation & validation
│   │   │   │   └── DocAgent.ts        # Documentation generation
│   │   │   ├── tools/
│   │   │   │   ├── ReadFileTool.ts
│   │   │   │   ├── WriteFileTool.ts
│   │   │   │   ├── SearchCodeTool.ts
│   │   │   │   ├── RunTerminalTool.ts
│   │   │   │   ├── GitTool.ts
│   │   │   │   └── GraphQueryTool.ts
│   │   │   ├── AgentMemory.ts         # Short/long-term agent memory
│   │   │   ├── TaskPlanner.ts         # Decomposes user intent → tasks
│   │   │   ├── AgentRouter.ts         # Routes tasks to correct agents
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── llm-client/                    # Unified LLM interface
│   │   ├── src/
│   │   │   ├── OllamaClient.ts        # Local Ollama adapter
│   │   │   ├── AnthropicClient.ts     # Optional cloud adapter
│   │   │   ├── OpenAIClient.ts        # Optional cloud adapter
│   │   │   ├── StreamHandler.ts       # SSE streaming
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── extension-api/                 # Extension host + API surface
│   │   ├── src/
│   │   │   ├── ExtensionHost.ts       # Extension process manager
│   │   │   ├── api/
│   │   │   │   ├── window.api.ts
│   │   │   │   ├── workspace.api.ts
│   │   │   │   ├── editor.api.ts
│   │   │   │   ├── languages.api.ts
│   │   │   │   └── graph.api.ts       # ProCode-native graph API
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── terminal/                      # PTY terminal backend
│   │   ├── src/
│   │   │   ├── PtyManager.ts          # node-pty wrapper
│   │   │   ├── ShellProfile.ts        # Shell detection & profiles
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── db/                            # Database access layer
│   │   ├── src/
│   │   │   ├── workspace.db.ts        # SQLite workspace DB
│   │   │   ├── graph.db.ts            # SurrealDB graph client
│   │   │   ├── vector.db.ts           # Vector store interface
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types/                         # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── editor.types.ts
│   │   │   ├── git.types.ts
│   │   │   ├── agent.types.ts
│   │   │   ├── graph.types.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── utils/                         # Shared utilities
│       ├── src/
│       │   ├── logger.ts
│       │   ├── paths.ts
│       │   ├── debounce.ts
│       │   └── index.ts
│       └── package.json
│
├── native/                            # Rust workspace
│   ├── Cargo.toml                     # Rust workspace manifest
│   │
│   ├── procode-native/                # Main NAPI-RS binding crate
│   │   ├── src/
│   │   │   ├── lib.rs                 # NAPI exports
│   │   │   ├── file_watcher.rs        # notify-rs wrapper
│   │   │   ├── ast_parser.rs          # tree-sitter bindings
│   │   │   ├── indexer.rs             # Incremental code indexer
│   │   │   └── bridge.rs              # Type conversions
│   │   └── Cargo.toml
│   │
│   ├── procode-graph/                 # Knowledge graph engine
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── graph.rs               # petgraph wrapper
│   │   │   ├── nodes.rs               # Node type definitions
│   │   │   ├── edges.rs               # Edge type definitions
│   │   │   ├── query.rs               # Graph query engine
│   │   │   └── serializer.rs          # SurrealDB sync
│   │   └── Cargo.toml
│   │
│   ├── procode-vector/                # HNSW vector index
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── hnsw.rs                # HNSW index implementation
│   │   │   ├── similarity.rs          # Cosine / dot product
│   │   │   └── persistence.rs         # Disk-backed index
│   │   └── Cargo.toml
│   │
│   └── procode-git/                   # libgit2 bindings (fast git ops)
│       ├── src/
│       │   ├── lib.rs
│       │   ├── blame.rs
│       │   ├── diff.rs
│       │   └── history.rs
│       └── Cargo.toml
│
├── scripts/
│   ├── build-native.sh                # Compile Rust → .node files
│   ├── setup-dev.sh                   # Full dev environment setup
│   ├── package-app.sh                 # Electron builder
│   └── install-lsp-servers.sh         # Auto-install common LSP servers
│
├── docs/
│   ├── ARCHITECTURE.md                # This file
│   ├── CONTRIBUTING.md
│   ├── EXTENSION_API.md
│   ├── AGENT_SYSTEM.md
│   └── KNOWLEDGE_GRAPH.md
│
└── tests/
    ├── e2e/                           # Playwright E2E tests
    ├── integration/                   # Cross-package integration tests
    └── fixtures/                      # Test workspaces / repos
```

---

## 6. Core Subsystems

### 6.1 Editor Engine

The editor engine is built on **Monaco Editor** — the same engine powering VS Code — running inside Electron's renderer process.

**Key responsibilities:**

- File buffer management (open, save, auto-save, dirty tracking)
- Multi-cursor editing, column selection
- Code folding, bracket matching, indent guides
- Editor groups (split panes) with independent layouts
- Diff editor for git comparisons
- Virtual documents (e.g., git show output, agent-generated previews)

**Architecture:**

```
MonacoEditor (React component)
    ↓
EditorService (TypeScript)
    ├── BufferManager    — in-memory file buffers, dirty state
    ├── EditorGroupManager — split pane logic
    ├── DecorationManager  — inline decorations (blame, agents, errors)
    └── ActionRegistry   — editor commands and keybindings
```

**AI Integration Points:**

- `InlineCompletionProvider` — intercepts Monaco's completion requests, routes to RAG pipeline
- `InlineChatWidget` — overlays a chat bubble at cursor position (`Ctrl+K`)
- `HoverProvider` — augments LSP hover with AI explanations
- `CodeActionProvider` — adds AI-powered code actions alongside LSP actions

---

### 6.2 File System & Git Integration

#### File System

The file system layer handles workspace I/O with a Rust-backed file watcher for performance.

```typescript
// packages/editor-core/src/FileSystemService.ts
interface FileSystemService {
  readFile(uri: URI): Promise<Uint8Array>
  writeFile(uri: URI, content: Uint8Array): Promise<void>
  stat(uri: URI): Promise<FileStat>
  readDirectory(uri: URI): Promise<[string, FileType][]>
  watch(uri: URI, options: WatchOptions): IDisposable
  // Rust-backed watcher fires on any FS change
}
```

Rust `file_watcher.rs` uses `notify-rs` with debouncing to emit change events over NAPI, which the TypeScript layer converts into Monaco model updates and triggers incremental re-indexing.

#### Git Integration

ProCode provides first-class Git UI — no plugin required.

**Source Control Panel features:**

```
Source Control
├── Changes
│   ├── [M] src/app.ts            (modified)
│   ├── [A] src/new-feature.ts    (added)
│   └── [D] src/old-file.ts       (deleted)
├── Staged Changes
│   └── [M] package.json
└── Commit message input + Commit button
```

**Git Engine Architecture:**

```
GitEngine (TypeScript — packages/git-engine/)
    ├── StatusTracker    — polls/watches .git for status changes
    ├── StageManager     — stage, unstage, discard changes
    ├── CommitManager    — commit with message, amend, sign-off
    ├── BranchManager    — create, checkout, merge, rebase, delete
    ├── RemoteManager    — push, pull, fetch, remote management
    ├── BlameProvider    — per-line blame with metadata
    ├── TimelineProvider — per-file commit history
    ├── DiffEngine       — text diffs, structural diffs
    └── ConflictResolver — 3-way merge UI data provider

Native Rust (native/procode-git/)
    ├── libgit2-based fast blame computation
    ├── Efficient diff generation for large files
    └── Batch history operations
```

**Git Graph View** — DAG visualization rendered using D3.js in the renderer, with commit data fetched from the Rust git layer.

---

### 6.3 Knowledge Graph System

The Knowledge Graph is ProCode's defining feature — a persistent, queryable semantic model of your entire codebase.

#### Node Types

```
Symbol Nodes
├── File           — every source file in the workspace
├── Module         — logical module/package boundary
├── Function       — named function or method
├── Class          — class definition
├── Interface      — TypeScript interface / abstract type
├── Variable       — module-level or exported variable
├── Type           — type alias, enum, union type
└── Constant       — exported constants

Infrastructure Nodes
├── Dependency     — npm/cargo package dependency
├── GitCommit      — commit in the repo history
├── TestSuite      — test file → test cases
└── ConfigFile     — tsconfig, package.json, Cargo.toml
```

#### Edge Types

```
Code Structure
├── CONTAINS       — File → Function, Class → Method
├── IMPORTS        — File → File (import/require/use)
├── CALLS          — Function → Function (call graph)
├── IMPLEMENTS     — Class → Interface
├── EXTENDS        — Class → Class, Interface → Interface
└── EXPORTS        — File → Symbol

Semantic
├── TESTS          — TestSuite → Function/Class
├── DOCUMENTS      — DocComment → Symbol
├── DEPENDS_ON     — Module → Dependency
└── SIMILAR_TO     — Symbol → Symbol (embedding similarity)

Temporal
├── MODIFIED_BY    — Symbol → GitCommit
├── CREATED_IN     — Symbol → GitCommit
└── CO_CHANGED     — Symbol → Symbol (co-committed frequently)
```

#### Graph Engine Architecture

```rust
// native/procode-graph/src/graph.rs
pub struct KnowledgeGraph {
    graph: petgraph::Graph<KGNode, KGEdge>,
    node_index: HashMap<NodeId, NodeIndex>,
    symbol_index: HashMap<FullyQualifiedName, NodeId>,
}

impl KnowledgeGraph {
    pub fn query(&self, q: GraphQuery) -> Vec<QueryResult> { ... }
    pub fn upsert_node(&mut self, node: KGNode) -> NodeId { ... }
    pub fn upsert_edge(&mut self, from: NodeId, to: NodeId, edge: KGEdge) { ... }
    pub fn subgraph(&self, root: NodeId, depth: u32) -> KnowledgeGraph { ... }
    pub fn find_paths(&self, from: NodeId, to: NodeId) -> Vec<Vec<NodeId>> { ... }
}
```

#### Indexing Pipeline

```
File Change Event (Rust file watcher)
          ↓
    Parse AST (Tree-sitter, Rust)
          ↓
    Extract Symbols & Relationships
          ↓
    Diff against existing graph nodes
          ↓
    Upsert nodes/edges in petgraph (in-memory)
          ↓
    Persist delta to SurrealDB (async)
          ↓
    Generate embeddings for changed symbols
          ↓
    Upsert embeddings in HNSW vector index
          ↓
    Notify TypeScript subscribers (IPC event)
```

Full workspace indexing completes in under 30 seconds for a 100k-line codebase. Incremental updates are under 50ms.

#### Knowledge Graph Explorer UI

A force-directed graph visualization using **D3-force** in the renderer. Nodes are colored by type, edges by relationship type. Features:

- Pan, zoom, click-to-navigate
- Filter sidebar (show/hide node/edge types)
- Search (fuzzy match on symbol names)
- Time-travel slider (view graph at any git ref)
- Focus mode (show subgraph around selected node)

---

### 6.4 RAG Pipeline

The RAG system powers AI-augmented completions, chat context, and agent tool calls.

#### Chunking Strategy

ProCode uses **code-aware chunking** rather than naive character splitting:

```typescript
// packages/rag-pipeline/src/Chunker.ts

// Function-level chunks (preferred) — each function is one chunk
// Class-level chunks — class header + method signatures
// File-level chunks — small files as single chunks
// Sliding window — fallback for files with no clear structure

interface CodeChunk {
  id: string
  fileUri: string
  content: string
  nodeId: string          // Knowledge graph node this chunk belongs to
  chunkType: 'function' | 'class' | 'file' | 'window'
  language: string
  startLine: number
  endLine: number
  symbolName?: string
  embedding?: Float32Array
}
```

#### Embedding

All embeddings are generated **locally** via Ollama's `nomic-embed-text` model (768-dimensional). Embeddings are cached and only recomputed when chunk content changes (tracked by content hash).

#### Hybrid Search

ProCode uses hybrid retrieval — vector similarity + BM25 keyword search — fused with Reciprocal Rank Fusion (RRF):

```typescript
// packages/rag-pipeline/src/Retriever.ts

async function retrieve(query: string, topK: number): Promise<RankedChunk[]> {
  const [vectorResults, bm25Results] = await Promise.all([
    vectorSearch(query, topK * 2),      // HNSW search in Rust
    bm25Search(query, topK * 2),        // SQLite FTS5 full-text search
  ])

  return reciprocalRankFusion(vectorResults, bm25Results, topK)
}
```

#### Context Builder

Before sending any LLM request, the Context Builder assembles:

```
System Prompt
├── Active file content (current buffer)
├── Cursor-adjacent code (±50 lines)
├── RAG-retrieved relevant chunks (top-10)
├── Knowledge graph context (called functions, imports)
├── Recent git diff (what changed recently)
└── Agent memory (if in agent context)
```

#### Reranking

For agent tasks (not real-time completions), retrieved chunks are reranked using a cross-encoder model (`ms-marco-MiniLM-L-6-v2` via ONNX runtime — runs locally, no GPU required).

---

### 6.5 Multi-Agent Orchestration

ProCode's agent system is a **stateful multi-agent graph** inspired by LangGraph. Agents are specialized nodes; the orchestrator routes tasks through them based on intent classification.

#### Agent Definitions

| Agent | Specialty | Key Tools |
|---|---|---|
| **ArchitectAgent** | System design, refactoring plans, dependency analysis | GraphQuery, ReadFile, SearchCode |
| **CoderAgent** | Code generation, implementation, bug fixes | ReadFile, WriteFile, RunTerminal |
| **ReviewerAgent** | Code review, security analysis, best practices | ReadFile, GraphQuery, SearchCode |
| **DebuggerAgent** | Error analysis, stack trace interpretation, fix generation | ReadFile, WriteFile, RunTerminal, GraphQuery |
| **TestAgent** | Unit/integration test generation, test execution | ReadFile, WriteFile, RunTerminal |
| **DocAgent** | JSDoc, README, ADR, changelog generation | ReadFile, WriteFile, GraphQuery |

#### Orchestration Flow

```
User Task (natural language)
        ↓
  Intent Classifier
  (classify: code_gen / review / debug / test / doc / architect)
        ↓
  Task Planner
  (decompose into ordered sub-tasks)
        ↓
  Agent Router
  ┌─────┬─────┬──────┬─────────┬──────┐
  │Arch │Code │Review│Debugger │Test  │
  └─────┴─────┴──────┴─────────┴──────┘
        ↓
  Human-in-the-Loop Gate
  (show proposed file writes → user approves/rejects)
        ↓
  Tool Execution
        ↓
  Result Synthesis
        ↓
  Response to User
```

#### Agent Memory

```typescript
// packages/agent-orchestration/src/AgentMemory.ts

interface AgentMemory {
  // Short-term: current task context window
  shortTerm: {
    taskDescription: string
    toolCallHistory: ToolCall[]
    intermediateResults: string[]
    currentPlan: TaskStep[]
  }

  // Long-term: persisted across sessions in SQLite
  longTerm: {
    workspaceInsights: Insight[]      // "This project uses Repository pattern"
    userPreferences: Preference[]     // "User prefers functional style"
    recentDecisions: Decision[]       // "Decided to use SurrealDB for graph"
  }
}
```

#### Human-in-the-Loop (HITL)

All file write operations go through an approval gate:

```
Agent wants to write: src/auth/middleware.ts
┌────────────────────────────────────────┐
│  Agent proposes the following change:  │
│                                        │
│  [diff viewer shows proposed change]   │
│                                        │
│  [Accept]  [Reject]  [Edit & Accept]  │
└────────────────────────────────────────┘
```

Users can configure trust levels per agent (auto-approve read ops, always-approve writes).

#### Agent Panel UI

```
┌─ Agent Tasks ───────────────────────────────┐
│ ● Add authentication middleware              │
│   Status: Running (CoderAgent)              │
│   ├─ ✓ Read existing auth files             │
│   ├─ ✓ Query graph for middleware patterns  │
│   ├─ ⟳ Generating middleware.ts ...        │
│   └─ ○ Write file (pending approval)        │
│                                             │
│ ○ Write unit tests for UserService          │
│   Status: Queued                            │
└─────────────────────────────────────────────┘
```

---

### 6.6 Language Server Protocol (LSP)

ProCode is a full LSP client. The `lsp-host` package manages connections to external language server processes.

#### Supported Language Servers (auto-installed)

| Language | Server | Install method |
|---|---|---|
| TypeScript / JavaScript | typescript-language-server | npm |
| Rust | rust-analyzer | rustup component |
| Python | pylsp / pyright | pip |
| Go | gopls | go install |
| C / C++ | clangd | system package |
| Java | Eclipse JDT LS | bundled |
| C# | OmniSharp | bundled |
| HTML / CSS | vscode-html-languageserver | npm |
| JSON / YAML | yaml-language-server | npm |
| Markdown | marksman | bundled binary |

#### LSP ↔ Monaco Integration

```typescript
// packages/lsp-host/src/LanguageClient.ts
// Each language client:
// 1. Spawns the LSP server process
// 2. Manages JSON-RPC communication
// 3. Translates LSP protocol → Monaco API calls
//    (completions, hovers, definitions, diagnostics, code actions)
```

---

### 6.7 Extension System

ProCode supports a subset of the VS Code Extension API to enable ecosystem compatibility, plus a ProCode-native API for graph and agent access.

#### Extension Host

Extensions run in a **sandboxed child process** (Node.js worker) with a restricted API surface exposed via IPC. This matches VS Code's architecture.

#### VS Code API Compatibility

```typescript
// Supported VS Code Extension APIs:
vscode.window.*          // UI notifications, input boxes, quick picks
vscode.workspace.*       // File system, configuration
vscode.languages.*       // Language features (completions, hover, etc.)
vscode.commands.*        // Command registration
vscode.debug.*           // Debug adapter integration
vscode.scm.*             // Source control
```

#### ProCode-Native Extension API

```typescript
// ProCode-exclusive APIs for extensions
procode.graph.query(q: GraphQuery): Promise<QueryResult[]>
procode.graph.subscribe(filter: EventFilter, cb: Callback): Disposable
procode.agents.spawn(config: AgentConfig): AgentHandle
procode.rag.search(query: string): Promise<CodeChunk[]>
```

---

### 6.8 Terminal Subsystem

Full-featured integrated terminal powered by **node-pty** (PTY) and **xterm.js** (renderer).

Features:

- Multiple terminal sessions (tabs)
- Shell profile detection (bash, zsh, fish, PowerShell)
- Split terminals (horizontal/vertical)
- Terminal links (clickable URLs, file paths)
- Custom environment variable injection per workspace
- Terminal history search (`Ctrl+R`)
- Copy/paste with proper escape handling
- Configurable font, size, colors

---

### 6.9 UI Shell

Built with **React 18 + Vite + Tailwind CSS**. Layout mirrors VS Code's proven 5-zone layout:

```
┌──────────────────────────────────────────────────────────────┐
│                        TITLE BAR                              │
├──┬───────────────────────────────────────────────────────────┤
│  │            TABS / EDITOR GROUPS                           │
│  ├───────────────────────────────────────────────────────────┤
│A │                                                           │
│C │                   MONACO EDITOR                          │
│T │                                                           │
│I ├───────────────────────────────────────────────────────────┤
│V │              PANEL (Terminal / Problems / Output)         │
│I ├───────────────────────────────────────────────────────────┤
│T │                       STATUS BAR                          │
│Y └───────────────────────────────────────────────────────────┘
│B
│A  Secondary Sidebar:
│R  AI Chat / Knowledge Graph / Agent Panel
```

**Activity Bar icons:** Explorer, Search, Source Control, Run & Debug, Extensions, AI Chat, Knowledge Graph, Settings

**Status Bar:** Language mode, encoding, line/col, git branch, LSP status, Ollama status, AI agent activity indicator

**Theme system:** Full dark/light/custom theme support. Themes are CSS custom property sets. VS Code `.json` themes are auto-converted.

---

## 7. Data Models & Schemas

### Workspace SQLite Schema

```sql
-- Workspace metadata
CREATE TABLE workspace (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_opened_at INTEGER NOT NULL,
  settings_json TEXT
);

-- Open editor state
CREATE TABLE editor_state (
  workspace_id TEXT NOT NULL,
  uri TEXT NOT NULL,
  group_id INTEGER NOT NULL,
  is_pinned INTEGER DEFAULT 0,
  cursor_line INTEGER,
  cursor_col INTEGER,
  scroll_top REAL,
  PRIMARY KEY (workspace_id, uri)
);

-- Breakpoints
CREATE TABLE breakpoints (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  uri TEXT NOT NULL,
  line INTEGER NOT NULL,
  condition TEXT,
  hit_count INTEGER,
  log_message TEXT,
  enabled INTEGER DEFAULT 1
);

-- Agent memory (long-term)
CREATE TABLE agent_memory (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  memory_type TEXT NOT NULL,  -- 'insight' | 'preference' | 'decision'
  content TEXT NOT NULL,
  embedding_id TEXT,           -- FK to vector store
  created_at INTEGER NOT NULL,
  expires_at INTEGER
);

-- Agent task history
CREATE TABLE agent_tasks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,        -- 'queued' | 'running' | 'done' | 'failed'
  agent_type TEXT,
  plan_json TEXT,
  result_summary TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

-- Code chunks (RAG)
CREATE TABLE code_chunks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  file_uri TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  chunk_type TEXT NOT NULL,
  start_line INTEGER,
  end_line INTEGER,
  symbol_name TEXT,
  language TEXT,
  node_id TEXT,                -- Knowledge graph node ID
  has_embedding INTEGER DEFAULT 0,
  indexed_at INTEGER NOT NULL
);

-- FTS5 index for BM25 search
CREATE VIRTUAL TABLE code_fts USING fts5(
  content,
  symbol_name,
  file_uri UNINDEXED,
  chunk_id UNINDEXED,
  tokenize="porter unicode61"
);
```

### Knowledge Graph Node Schema (SurrealDB)

```surql
DEFINE TABLE kg_node SCHEMAFULL;
DEFINE FIELD id       ON kg_node TYPE string;
DEFINE FIELD type     ON kg_node TYPE string;  -- 'file' | 'function' | 'class' | ...
DEFINE FIELD name     ON kg_node TYPE string;
DEFINE FIELD fqn      ON kg_node TYPE string;  -- fully qualified name
DEFINE FIELD file_uri ON kg_node TYPE option<string>;
DEFINE FIELD start_line ON kg_node TYPE option<int>;
DEFINE FIELD end_line   ON kg_node TYPE option<int>;
DEFINE FIELD language   ON kg_node TYPE option<string>;
DEFINE FIELD metadata   ON kg_node FLEXIBLE TYPE option<object>;
DEFINE FIELD updated_at ON kg_node TYPE datetime;

DEFINE TABLE kg_edge SCHEMAFULL;
DEFINE FIELD in          ON kg_edge TYPE record<kg_node>;
DEFINE FIELD out         ON kg_edge TYPE record<kg_node>;
DEFINE FIELD type        ON kg_edge TYPE string;  -- 'CALLS' | 'IMPORTS' | ...
DEFINE FIELD weight      ON kg_edge TYPE option<float>;
DEFINE FIELD metadata    ON kg_edge FLEXIBLE TYPE option<object>;
```

---

## 8. API Contracts

### IPC Channels (Electron Main ↔ Renderer)

All IPC is typed end-to-end with tRPC over Electron IPC. Key procedures:

```typescript
// apps/desktop/src/main/ipc/index.ts

const appRouter = t.router({
  // File System
  fs: t.router({
    readFile: t.procedure.input(z.object({ uri: z.string() })).query(...),
    writeFile: t.procedure.input(z.object({ uri: z.string(), content: z.string() })).mutation(...),
    readDirectory: t.procedure.input(z.object({ uri: z.string() })).query(...),
  }),

  // Git
  git: t.router({
    status: t.procedure.query(...),
    diff: t.procedure.input(z.object({ uri: z.string() })).query(...),
    stage: t.procedure.input(z.object({ uris: z.array(z.string()) })).mutation(...),
    commit: t.procedure.input(z.object({ message: z.string() })).mutation(...),
    branches: t.procedure.query(...),
    checkout: t.procedure.input(z.object({ branch: z.string() })).mutation(...),
    log: t.procedure.input(z.object({ limit: z.number() })).query(...),
    blame: t.procedure.input(z.object({ uri: z.string() })).query(...),
  }),

  // AI / Agents
  agent: t.router({
    spawn: t.procedure.input(AgentConfigSchema).mutation(...),
    getTask: t.procedure.input(z.object({ taskId: z.string() })).query(...),
    approveAction: t.procedure.input(z.object({ actionId: z.string() })).mutation(...),
    rejectAction: t.procedure.input(z.object({ actionId: z.string() })).mutation(...),
    listTasks: t.procedure.query(...),
  }),

  // Knowledge Graph
  graph: t.router({
    query: t.procedure.input(GraphQuerySchema).query(...),
    getNode: t.procedure.input(z.object({ nodeId: z.string() })).query(...),
    getNeighbors: t.procedure.input(z.object({ nodeId: z.string(), depth: z.number() })).query(...),
  }),

  // RAG
  rag: t.router({
    search: t.procedure.input(z.object({ query: z.string(), topK: z.number() })).query(...),
    indexWorkspace: t.procedure.mutation(...),
  }),

  // Settings
  settings: t.router({
    get: t.procedure.input(z.object({ key: z.string() })).query(...),
    set: t.procedure.input(z.object({ key: z.string(), value: z.unknown() })).mutation(...),
  }),
})

export type AppRouter = typeof appRouter
```

### LLM Client Interface

```typescript
// packages/llm-client/src/index.ts

interface LLMClient {
  chat(options: ChatOptions): AsyncGenerator<string>
  complete(options: CompleteOptions): Promise<string>
  embed(text: string): Promise<Float32Array>
}

interface ChatOptions {
  model: string
  messages: ChatMessage[]
  systemPrompt?: string
  tools?: Tool[]
  maxTokens?: number
  temperature?: number
  stream?: boolean
}
```

---

## 9. Database Strategy

| Store | Technology | Purpose |
|---|---|---|
| **Workspace DB** | SQLite (better-sqlite3) | Editor state, settings, breakpoints, task history, FTS5 code search |
| **Knowledge Graph** | SurrealDB (embedded) | Persistent graph nodes and edges across sessions |
| **In-Memory Graph** | petgraph (Rust) | Hot graph for fast traversal during indexing and queries |
| **Vector Index** | Custom HNSW (Rust) | Fast approximate nearest-neighbor search over code embeddings |
| **Vector Persistence** | sqlite-vec | Backup/restore HNSW index to SQLite |
| **LSP Cache** | LevelDB | LSP server state caches (indexed files, symbol tables) |

All databases are stored in `~/.procode/workspaces/<workspace-id>/` — fully local, no cloud sync required.

---

## 10. Security Model

### Process Isolation

- **Renderer process** — sandboxed (contextIsolation: true, nodeIntegration: false). Zero direct Node.js access.
- **Main process** — restricted to workspace root. Cannot access files outside unless user grants permission.
- **Extension host** — child worker with further restricted API surface. No direct network access.
- **Agent tools** — file write tools require HITL approval. Terminal commands shown to user before execution.

### Data Privacy

- All AI inference runs locally via Ollama by default. Zero network requests to AI providers.
- Optional cloud adapters (Anthropic, OpenAI) require explicit user opt-in per workspace.
- When cloud is enabled, only the assembled context (not full codebase) is sent, with explicit disclosure.
- Telemetry is opt-in, anonymized, and limited to crash reports.

### Code Execution

- Agent terminal commands are shown to user before execution
- Configurable allow-list of safe commands (e.g., `npm test`, `cargo build`)
- Dangerous commands (`rm -rf`, `sudo`) require additional confirmation prompt

---

## 11. Build & Packaging

### Development

```bash
# One-time setup
pnpm install
./scripts/build-native.sh        # Compile Rust modules
./scripts/setup-dev.sh           # Install LSP servers, Ollama models

# Start dev server
pnpm dev                         # Starts Electron + Vite HMR

# Run tests
pnpm test                        # Unit + integration
pnpm e2e                         # Playwright E2E
cargo test --workspace           # Rust tests
```

### Turborepo Pipeline

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "*.node"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {}
  }
}
```

### Packaging (Electron Builder)

Target platforms: macOS (arm64 + x64, universal DMG), Windows (x64 NSIS + portable), Linux (x64 AppImage + deb)

```bash
pnpm package:mac
pnpm package:win
pnpm package:linux
```

Rust native modules are cross-compiled for each target platform in CI using GitHub Actions matrix builds and `cross-rs`.

### Auto-Update

Uses `electron-updater` with a self-hosted update server (or GitHub Releases as backend). Users control update channel (stable / beta / nightly).

---

## 12. Roadmap

### Phase 1 — Foundation (Months 1–3)
- Electron shell with Monaco Editor
- File Explorer, Tabs, Command Palette, Status Bar
- Basic Git integration (status, stage, commit, diff)
- Integrated terminal (PTY)
- LSP host (TypeScript, Python, Rust auto-install)
- Settings system
- Light/dark themes

### Phase 2 — Intelligence Layer (Months 4–6)
- Rust native modules: file watcher, AST parser, code indexer
- Knowledge Graph: indexing pipeline, SurrealDB persistence
- RAG pipeline: chunking, embeddings (Ollama), hybrid search
- Inline AI completions (RAG-augmented)
- AI Chat panel with `@file`, `@symbol` mentions

### Phase 3 — Agents (Months 7–9)
- Multi-agent orchestration system
- CoderAgent, ReviewerAgent, DebuggerAgent
- HITL approval workflow
- Agent Panel UI
- Agent memory (short-term + long-term)

### Phase 4 — Full Parity + Polish (Months 10–12)
- DAP (Debug Adapter Protocol) integration
- Extension system (VS Code API subset)
- Knowledge Graph Explorer visual UI
- ArchitectAgent, TestAgent, DocAgent
- Interactive Git Rebase UI
- Git Graph visual DAG view
- ProCode Extension Marketplace (v1)
- Performance benchmarking and optimization pass

### Phase 5 — Ecosystem (Month 13+)
- ProCode Cloud (optional sync for settings/agent memory)
- Team features (shared agent tasks, knowledge graph export)
- Remote development (SSH workspaces)
- Web version (ProCode Web — browser-based)

---

## 13. Engineering Standards

### TypeScript

- `strict: true` in all `tsconfig.json` files
- No `any` — use `unknown` + type guards
- Explicit return types on all public functions
- Zod for all runtime validation (IPC inputs, LLM outputs)
- ESLint + Prettier enforced in CI

### Rust

- `#![deny(clippy::all)]` — zero Clippy warnings
- All public APIs documented with `///` doc comments
- Error handling via `anyhow` (application) and `thiserror` (library crates)
- No `unsafe` without a `// SAFETY:` comment justification

### Testing

- Unit tests colocated with source (`*.test.ts`, `*.spec.ts`)
- Integration tests in `/tests/integration/`
- E2E tests with Playwright in `/tests/e2e/`
- Minimum 70% line coverage enforced in CI on core packages
- Snapshot tests for UI components (Vitest + Testing Library)

### Git Conventions

- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`
- Conventional Commits (`feat:`, `fix:`, `chore:`, `breaking:`)
- Squash-merge PRs to keep main history clean
- Protected `main` branch — no direct pushes

### Performance Budgets

| Metric | Target |
|---|---|
| App cold start to editor ready | < 2 seconds |
| File open (large file, 10k lines) | < 100ms |
| Full workspace index (100k lines) | < 30 seconds |
| Incremental index update | < 50ms |
| Inline completion latency (local) | < 300ms |
| Knowledge graph query | < 20ms |
| Vector search (top-10, 500k chunks) | < 10ms |

---

*ProCode — Where your codebase thinks with you.*

> Document version: 1.0.0 | Last updated: 2026-05-17