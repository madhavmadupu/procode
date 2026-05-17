# System Architecture

## Overview

ProCode uses a hybrid TypeScript + Rust architecture running within Electron's multi-process model.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          PROCODE DESKTOP APP                               │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        RENDERER PROCESS (UI)                        │  │
│  │  React 18 + Vite + Tailwind CSS                                     │  │
│  │  Monaco Editor  │  Knowledge Graph Viz  │  Agent Panel  │  Chat UI  │  │
│  │  Zustand Stores (editor, workspace, git, agent, settings)           │  │
│  └───────────────────────────┬─────────────────────────────────────────┘  │
│                              │  tRPC over Electron IPC                     │
│  ┌───────────────────────────▼─────────────────────────────────────────┐  │
│  │                        MAIN PROCESS (Node.js)                       │  │
│  │                                                                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │  │
│  │  │ Editor Core  │  │  Git Engine  │  │   LSP / DAP Host        │  │  │
│  │  │ (packages/   │  │ (packages/   │  │ (packages/              │  │  │
│  │  │  editor-core)│  │  git-engine) │  │  lsp-host, dap-host)    │  │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────────────┘  │  │
│  │                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │                  AI ORCHESTRATION LAYER                      │  │  │
│  │  │  Agent Router  │  Task Queue  │  Context Builder  │  Memory  │  │  │
│  │  │  (packages/agent-orchestration, rag-pipeline, llm-client)   │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  │                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │              KNOWLEDGE GRAPH & INDEXING                      │  │  │
│  │  │  (packages/knowledge-graph) ↔ Rust Graph Engine (NAPI-RS)   │  │  │
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
│  │  │ (notify-rs) │  │ (tree-sitter)│  │  (native/procode-vector) │  │  │
│  │  └─────────────┘  └──────────────┘  └──────────────────────────┘  │  │
│  │                                                                     │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │  │ Graph Engine│  │  Git (libgit2│  │  Code Indexer            │  │  │
│  │  │ (petgraph)  │  │  binding)    │  │  (native/procode-git)    │  │  │
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

## Process Model

### Renderer Process (Sandboxed)
- **Role:** UI rendering, user interaction, Monaco Editor
- **Security:** contextIsolation: true, nodeIntegration: false
- **Tech:** React 18, Vite, Tailwind CSS, Monaco Editor, xterm.js
- **State:** Zustand stores (editor, workspace, git, agent, settings)
- **Communication:** tRPC client → Electron IPC → Main process

### Main Process (Node.js)
- **Role:** Application logic, IPC routing, service orchestration
- **Security:** Restricted to workspace root, validated inputs via Zod
- **Tech:** Node.js, tRPC server, Electron IPC handlers
- **Services:** WindowManager, WorkspaceManager, OllamaManager, UpdateManager
- **Communication:** NAPI-RS → Rust native modules, IPC → Renderer, HTTP → Ollama

### Rust Native Subsystems
- **Role:** Performance-critical computation
- **Tech:** Rust, NAPI-RS, notify-rs, tree-sitter, petgraph, libgit2
- **Modules:** procode-native, procode-graph, procode-vector, procode-git
- **Communication:** NAPI-RS bindings → Node.js main process

## Data Flow

### File Edit Flow
```
User types in Monaco Editor
    ↓
Renderer: Editor keystroke event
    ↓
IPC: Buffer update → Main process
    ↓
Main: BufferManager updates in-memory buffer
    ↓
Main: Trigger incremental re-index (Rust)
    ↓
Rust: Tree-sitter parses changed region
    ↓
Rust: Update knowledge graph nodes/edges
    ↓
Rust: Generate embeddings for changed symbols
    ↓
Main: Notify LSP servers of document change
    ↓
LSP: Return diagnostics, completions
    ↓
IPC: Diagnostics → Renderer → Problems Panel
```

### AI Completion Flow
```
User triggers completion (Ctrl+Space)
    ↓
Renderer: Completion request → Main process
    ↓
Main: Context Builder assembles context
    ├── Active file content
    ├── Cursor-adjacent code (±50 lines)
    ├── RAG-retrieved relevant chunks
    ├── Knowledge graph context
    └── Recent git diff
    ↓
Main: RAG Pipeline retrieves context
    ├── Vector search (HNSW, Rust)
    ├── BM25 search (SQLite FTS5)
    └── Reciprocal Rank Fusion
    ↓
Main: Send to Ollama (local LLM)
    ↓
Ollama: Generate completion (streaming)
    ↓
Main: Stream completion → Renderer
    ↓
Renderer: Display inline completion (ghost text)
```

### Agent Task Flow
```
User submits task in AI Chat
    ↓
Main: Intent Classifier routes task
    ↓
Main: Task Planner decomposes into sub-tasks
    ↓
Main: Agent Router assigns to specialized agents
    ↓
Agent: Queries knowledge graph for context
    ↓
Agent: Executes tools (ReadFile, SearchCode, etc.)
    ↓
Agent: Proposes file write
    ↓
Main: HITL Gate — show diff to user
    ↓
User: Approves/Rejects
    ↓
Agent: Writes file (if approved)
    ↓
Main: Update Git, notify renderer
```

## Key Design Decisions

See `/docs/adr/` for detailed Architecture Decision Records covering:
- ADR-001: Use Electron for cross-platform shell
- ADR-002: Hybrid TypeScript + Rust architecture
- ADR-003: Use Monaco Editor as editor engine
- ADR-004: Use SurrealDB for knowledge graph
- ADR-005: Use SQLite for workspace state
- ADR-006: Custom HNSW in Rust for vector search
- ADR-007: Use Ollama for local AI inference
- ADR-008: Use NAPI-RS for Rust ↔ Node.js bindings
- ADR-011: Local-first architecture
- ADR-012: Multi-agent orchestration with state machine
- ADR-017: Process isolation security model
- ADR-018: tRPC for type-safe IPC
