# Rule: Architecture Boundaries

## Process Isolation

- NEVER make network requests from the renderer process directly. All network calls go through the main process via IPC.
- NEVER access the file system from the renderer process. All FS operations go through `FileSystemService` via IPC.
- NEVER bypass the IPC layer by importing main-process modules into renderer code.

## Window Model

- Single-window SPA for v1. All panels (diff editors, settings, agent) open within the single shell.
- New windows are panels routed within the single renderer, not separate Electron BrowserWindows.
- Revisit multi-window in v2 if power users demand it.

## Workspace Model

- Single-root workspace for v1. One folder per workspace.
- URIs use `file:///absolute/path` format from day one so multi-root is additive later, not a refactor.
- Multi-root workspaces are a v2 feature.

## Layer Separation

- NEVER put business logic in React components. Components are for rendering and event delegation only.
- NEVER put UI concerns in packages outside `apps/desktop/src/renderer/`. Packages are UI-agnostic.

## Data Security

- NEVER store sensitive data (API keys, tokens, credentials) in SQLite. Use Electron's `safeStorage`.
- NEVER store ProCode credentials — delegate git auth to system credential manager entirely.

## Settings Storage

- JSON files are source of truth: `~/.procode/settings/settings.json` (global), `.procode/settings.json` (workspace)
- SQLite caches merged result for fast reads
- File watcher picks up external edits to JSON files
- Workspace settings are git-trackable per project

## Rust Safety

- NEVER ship a Rust `unsafe` block without a `// SAFETY: <explanation>` comment that passes a Clippy audit.

## AI Inference

- NEVER call Ollama synchronously. All LLM calls stream via `AsyncGenerator`.
- NEVER route embeddings through the chat provider. EmbeddingProvider is always Ollama locally.
- NEVER conflate LLMProvider with AgenticProvider. OpenCode implements both; others implement only LLMProvider.
- NEVER let the AgentRouter assume AgenticProvider is available. Always check `supportsHandoff()` before delegating task graphs.

## Agent Concurrency

- Sequential FIFO queue for v1. One active agent task at a time.
- NEVER run parallel agents in v1 — creates merge conflicts, race conditions, confusing UX.
- Queue shows pending tasks so users know their request is captured.

## Telemetry

- Opt-in only. Zero network requests when local-only mode is active (Ollama only, no cloud providers).
- NEVER send file contents, code, or paths in telemetry.
- Crash reports via Sentry (free tier) only when user has opted in.

## Package Boundaries

```
apps/desktop/renderer  →  can import: packages/*, cannot import: main process modules
apps/desktop/main      →  can import: packages/*, native/*.node bindings
packages/*             →  can import: other packages/*, CANNOT import: apps/*
native/procode-*       →  pure Rust, no TS imports
```
