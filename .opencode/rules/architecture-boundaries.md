# Rule: Architecture Boundaries

## Process Isolation

- NEVER make network requests from the renderer process directly. All network calls go through the main process via IPC.
- NEVER access the file system from the renderer process. All FS operations go through `FileSystemService` via IPC.
- NEVER bypass the IPC layer by importing main-process modules into renderer code.

## Layer Separation

- NEVER put business logic in React components. Components are for rendering and event delegation only.
- NEVER put UI concerns in packages outside `apps/desktop/src/renderer/`. Packages are UI-agnostic.

## Data Security

- NEVER store sensitive data (API keys, tokens, credentials) in SQLite or SurrealDB. Use Electron's `safeStorage`.

## Rust Safety

- NEVER ship a Rust `unsafe` block without a `// SAFETY: <explanation>` comment that passes a Clippy audit.

## AI Inference

- NEVER call Ollama synchronously. All LLM calls stream via `AsyncGenerator`.
- NEVER route embeddings through the chat provider. EmbeddingProvider is always Ollama locally.
- NEVER conflate LLMProvider with AgenticProvider. OpenCode implements both; others implement only LLMProvider.
- NEVER let the AgentRouter assume AgenticProvider is available. Always check `supportsHandoff()` before delegating task graphs.

## Package Boundaries

```
apps/desktop/renderer  →  can import: packages/*, cannot import: main process modules
apps/desktop/main      →  can import: packages/*, native/*.node bindings
packages/*             →  can import: other packages/*, CANNOT import: apps/*
native/procode-*       →  pure Rust, no TS imports
```
