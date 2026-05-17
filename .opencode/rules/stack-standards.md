# Rule: Stack Standards

## Languages & Runtimes

| Language | Version | Configuration |
|----------|---------|---------------|
| TypeScript | 5.x | strict mode, decorators off, `exactOptionalPropertyTypes: true` |
| Rust | 2021 edition | via NAPI-RS for native Node.js modules |
| React | 18 | functional components only, no class components |
| Node.js | 22 LTS | in Electron main process |

## Key Libraries

| Domain | Library | Notes |
|--------|---------|-------|
| Desktop shell | Electron 30 | contextIsolation, no nodeIntegration in renderer |
| Editor | Monaco Editor | Use `editor.addCommand`, `editor.createDecorationsCollection` |
| IPC type-safety | tRPC + Electron IPC adapter | All IPC is typed end-to-end |
| State management | Zustand 4 | Slice pattern, no immer unless complex nested state |
| UI primitives | Radix UI + Tailwind CSS | No other component libraries |
| Schema validation | Zod 3 | Runtime validation on all IPC inputs and LLM outputs |
| Build system | Turborepo + pnpm workspaces | `pnpm --filter <package> <cmd>` |
| Rust bindings | NAPI-RS 3 | `#[napi]` macros, `napi::Result` error type |
| Rust graph | petgraph | `StableDiGraph` for mutable graphs |
| Rust file watch | notify-rs | `RecommendedWatcher` with debounce |
| Rust AST | tree-sitter | Language grammars as separate crates |
| Git (TS) | isomorphic-git | Fallback; prefer Rust libgit2 binding for perf |
| Git (Rust) | git2-rs | `Repository::open`, `Blame::file` |
| Terminal | node-pty + xterm.js | PTY in main process, xterm in renderer |
| Embeddings | Ollama REST API | `nomic-embed-text` model, batch requests. ALWAYS Ollama — decoupled from chat provider |
| Vector index | Custom HNSW (Rust) | In `native/procode-vector` |
| LLM Providers | Two-tier interface | See Provider Strategy below |
| App DB + Graph | SQLite via better-sqlite3 | Synchronous OK in main process only. Recursive CTEs for graph traversal. Single dependency, public domain license.
| Testing | Vitest + Playwright | Vitest for unit/integration, Playwright for E2E |
| Error handling (Rust) | anyhow (apps) + thiserror (libs) | Never use `unwrap()` in library code |

## Build Commands

```bash
pnpm dev                                   # Start dev build
pnpm --filter @procode/<pkg> test          # Test one package
cargo check --workspace                    # Check all Rust
cargo test --workspace                     # Test all Rust
pnpm build:native                          # Rebuild .node files
```

## Provider Strategy

### Two-Tier Interface

```typescript
// Tier 1 — Raw inference
interface LLMProvider {
  chat(options: ChatOptions): AsyncGenerator<string>
  complete(options: CompleteOptions): Promise<string>
}

// Tier 2 — Agentic runtime (OpenCode only)
interface AgenticProvider {
  runTask(task: AgentTask): AsyncGenerator<AgentEvent>
  getTools(): ToolDefinition[]
  supportsHandoff(): boolean
}
```

### Provider Priority

| Priority | Provider | Type | Notes |
|----------|----------|------|-------|
| 1 | Ollama | LLMProvider + EmbeddingProvider | Managed sidecar, always local, default. Deep integration: process lifecycle, model pull UI, health checks |
| 2 | OpenCode | AgenticProvider + LLMProvider | Agentic delegation when available. ProCode agents fall back gracefully. Managed sidecar |
| 3 | Anthropic | LLMProvider | Recommended cloud default. Best tool-use and long-context for agentic workloads |
| 4 | OpenAI | LLMProvider | Broadest familiarity. `baseUrl` supports Groq, Together, Fireworks |

### Provider Config (Discriminated Union)

```typescript
type ProviderConfig =
  | { type: 'ollama'; endpoint: string; chatModel: string }
  | { type: 'opencode'; endpoint: string; apiKey: string; projectId?: string }
  | { type: 'anthropic'; apiKey: string; model: string }
  | { type: 'openai'; apiKey: string; model: string; baseUrl?: string }
```

### Key Rules

- **EmbeddingProvider is ALWAYS Ollama locally.** Never route embeddings through chat provider.
- **OpenCode adapter implements BOTH LLMProvider and AgenticProvider.** AgentRouter can delegate entire task graphs to OpenCode runtime.
- **Cloud adapters are thin wrappers** (~150 lines each): auth, base URL, model string mapping, streaming normalization.
- **Ollama ships as a managed sidecar** — zero user setup required.
