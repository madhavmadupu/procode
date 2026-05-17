# Roadmap Phases

## Phase 1 — Foundation (Months 1–3)

**Theme:** "A usable IDE that developers can switch to today"

### Deliverables
- Electron shell with Monaco Editor
- File Explorer with multi-root workspace support
- Tab system with tab groups (split panes)
- Command Palette with fuzzy search
- Status Bar with essential info
- Integrated terminal (PTY with xterm.js)
- Basic Git integration (status, stage, commit, diff)
- LSP host with auto-install for TypeScript, Python, Rust
- Settings system (UI + JSON)
- Light/dark themes with VS Code theme import
- Problems Panel for diagnostics
- Output Panel for logs

### Success Metrics
- App cold start to editor ready: < 2 seconds
- File open (10k lines): < 100ms
- LSP server auto-install and connect: < 30 seconds
- Zero critical bugs in core editing flow

### Risk Mitigation
- Monaco Editor is well-tested — low risk
- Electron + React is proven stack — low risk
- LSP auto-install may fail on some systems — provide manual fallback

---

## Phase 2 — Intelligence Layer (Months 4–6)

**Theme:** "The IDE that understands your codebase"

### Deliverables
- Rust native modules: file watcher (notify-rs), AST parser (tree-sitter), code indexer
- Knowledge Graph: indexing pipeline, SurrealDB persistence
- RAG pipeline: code-aware chunking, Ollama embeddings, hybrid search (HNSW + BM25)
- Inline AI completions (RAG-augmented, < 300ms latency)
- AI Chat panel with `@file`, `@symbol` mentions
- Explain Code feature
- Smart Autocomplete with RAG context
- Doc Generation for functions

### Success Metrics
- Full workspace index (100k lines): < 30 seconds
- Incremental index update: < 50ms
- Inline completion latency (local): < 300ms
- Knowledge graph query: < 20ms
- Vector search (top-10, 500k chunks): < 10ms
- RAG retrieval accuracy: > 85% relevant chunks in top-10

### Risk Mitigation
- Rust native modules require cross-compilation — set up CI early
- Ollama model quality varies — provide model recommendations per task
- Indexing large repos may block UI — run in background thread with progress indicator

---

## Phase 3 — Agents (Months 7–9)

**Theme:** "Your AI teammates that work alongside you"

### Deliverables
- Multi-agent orchestration system (LangGraph-style state machine)
- CoderAgent: code generation and editing
- ReviewerAgent: code review and critique
- DebuggerAgent: error diagnosis and fixing
- HITL approval workflow with diff viewer
- Agent Panel UI with live status, thoughts, tool calls
- Agent memory (short-term task context + long-term workspace insights)
- Task Planner: decompose user intent into ordered sub-tasks
- Agent Router: intent classification and task routing

### Success Metrics
- Agent task completion rate: > 70% for code generation tasks
- HITL approval time: < 30 seconds per action
- Agent response latency: < 5 seconds for initial response
- User satisfaction: > 4/5 for agent-assisted tasks

### Risk Mitigation
- Agent hallucination — always show diff before applying, never auto-write
- Long-running tasks may hang — implement timeout and cancellation
- Complex tasks may fail — break into smaller sub-tasks with validation at each step

---

## Phase 4 — Full Parity + Polish (Months 10–12)

**Theme:** "No reason to use anything else"

### Deliverables
- DAP (Debug Adapter Protocol) integration
- Extension system (VS Code API subset: window, workspace, languages, commands)
- Knowledge Graph Explorer visual UI (D3 force-directed graph)
- ArchitectAgent: system design, refactoring plans
- TestAgent: test generation and validation
- DocAgent: documentation generation
- Interactive Git Rebase UI
- Git Graph visual DAG view
- ProCode Extension Marketplace (v1)
- Performance benchmarking and optimization pass
- ProCode-native extension API (graph queries, agent spawning)

### Success Metrics
- VS Code extension compatibility: > 80% of top 100 extensions work
- Debug session start: < 3 seconds
- Git rebase UI: all operations available via UI
- Extension Marketplace: 50+ curated extensions at launch

### Risk Mitigation
- VS Code API is large — start with most-used subset, expand based on demand
- DAP integration requires adapter testing — partner with language server maintainers
- Extension marketplace requires moderation — start curated, expand gradually

---

## Phase 5 — Ecosystem (Month 13+)

**Theme:** "Beyond the IDE"

### Deliverables
- ProCode Cloud (optional sync for settings, agent memory)
- Team features: shared agent tasks, knowledge graph export
- Remote development (SSH workspaces)
- Web version (ProCode Web — browser-based)
- Enterprise features: SSO, audit logs, policy enforcement
- Plugin marketplace with revenue sharing

### Success Metrics
- Cloud sync adoption: > 30% of active users
- Team feature adoption: > 20% of organizations
- Remote development latency: < 100ms round-trip
- Web version feature parity: > 90% of desktop features

### Risk Mitigation
- Cloud sync raises privacy concerns — opt-in only, end-to-end encryption
- Remote development is complex — start with SSH, expand to containers
- Web version has limitations — clearly document what works vs. desktop

---

## Milestone Summary

| Phase | Timeline | Theme | Key Deliverable |
|-------|----------|-------|-----------------|
| 1 | Months 1-3 | Foundation | Usable IDE with Git, LSP, Terminal |
| 2 | Months 4-6 | Intelligence | Knowledge Graph, RAG, Inline AI |
| 3 | Months 7-9 | Agents | Multi-Agent System, HITL |
| 4 | Months 10-12 | Parity | DAP, Extensions, Graph UI |
| 5 | Month 13+ | Ecosystem | Cloud, Teams, Remote, Web |
