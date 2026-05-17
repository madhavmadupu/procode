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
| Desktop shell | Electron 30 | Single-window SPA, contextIsolation, no nodeIntegration |
| Editor | Monaco Editor | Use `editor.addCommand`, `editor.createDecorationsCollection` |
| IPC type-safety | tRPC over Electron IPC | Custom adapter, typed end-to-end. Pay cost upfront |
| State management | Zustand 4 | Slice pattern, no immer unless complex nested state |
| UI primitives | Radix UI + Tailwind CSS | No other component libraries |
| Schema validation | Zod 3 | Runtime validation on all IPC inputs and LLM outputs |
| Build system | Turborepo + pnpm workspaces | `pnpm --filter <package> <cmd>` |
| Rust bindings | NAPI-RS 3 | `#[napi]` macros, `napi::Result` error type |
| Rust graph | petgraph | `StableDiGraph` for mutable graphs |
| Rust file watch | notify-rs | `RecommendedWatcher` with debounce |
| Rust AST | tree-sitter | Language grammars as separate crates |
| Git (TS) | isomorphic-git | Fallback only; prefer Rust libgit2 binding for perf |
| Git (Rust) | git2-rs | `Repository::open`, `Blame::file` |
| Terminal | node-pty + xterm.js | PTY in main process, xterm in renderer |
| Embeddings | Ollama REST API | `nomic-embed-text:v1.5`, batch requests. ALWAYS Ollama — decoupled from chat |
| Vector index | Custom HNSW (Rust) | In `native/procode-vector` |
| LLM Providers | Two-tier interface | See Provider Strategy below |
| App DB + Graph | SQLite via better-sqlite3 | Synchronous OK in main process. Recursive CTEs for graph. Public domain |
| Default font | JetBrains Mono (bundled) | Apache 2.0, ligatures on by default |
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

## AI & Indexing Defaults

### Ollama Models

| Purpose | Model | Notes |
|---------|-------|-------|
| Chat | `qwen2.5-coder:7b` | Apache 2.0, optimized for code, runs on 8GB VRAM |
| Embedding | `nomic-embed-text:v1.5` | 768 dimensions, runs on CPU |

- **Min VRAM target:** 8GB. Warn at 4GB, suggest 14b variant at 16GB+
- **Model pull:** Prompt on first launch with progress bar. Never auto-pull silently.

### Indexing Strategy

- **Primary trigger:** File watch debounced at 800ms (TypeScript layer)
- **Secondary trigger:** Full sync on git commit
- **Workspace open:** Always run full sync
- **Excluded paths:** `node_modules/`, `.git/`, `dist/`, `build/`, `target/`, `*.d.ts` in node_modules, any `.gitignore` path

### RAG Chunking

- **Hierarchy:** function/method → class (header + signatures) → top-level block → 512-token sliding window with 128-token overlap
- **Max chunk size:** 512 tokens
- **Comments:** Keep attached to their function
- **Excluded:** `node_modules/`, `dist/`, `build/`, `target/`, `.git/`, `*.min.js`, `*.map`, `*.lock`, binaries, files >1MB, `.gitignore` paths

### Agent Concurrency

- **Model:** Sequential FIFO queue, one active task at a time
- **v2:** Parallel with isolation (when task model proven)

## Editor Defaults

| Setting | Value | Notes |
|---------|-------|-------|
| Default font | JetBrains Mono (bundled) | Apache 2.0, ligatures on by default |
| Default keymap | VS Code | Lowest friction onboarding |
| Vim mode | Built-in toggle | `"editor.vimMode": false` default, ships v1 |
| Themes | 4 built-in | Dark (default), Light, Dark HC, Light HC |
| Theme import | VS Code `.json` | v1 support |
| Custom themes | `~/.procode/themes/` | v2 CSS variable themes |

## Terminal Configuration

- **Shell:** Respect `$SHELL` on macOS/Linux. PowerShell 7 on Windows (fallback to 5.1). Never CMD.
- **Injected env:** `PROCODE=1`, `PROCODE_WORKSPACE=/path/to/workspace`
- **Nothing else injected** — let user's shell config handle virtualenvs, PATH, etc.

## Git Configuration

- **Credentials:** Delegate entirely to system git credential manager
- **No ProCode credential storage** — call `git` as subprocess for auth operations
- **Works with:** `.gitconfig`, SSH agents, macOS Keychain, Windows Credential Manager, git-credential-manager

## Settings Storage

- **Source of truth:** JSON files in `~/.procode/settings/`
- **Global settings:** `~/.procode/settings/settings.json`
- **Workspace overrides:** `.procode/settings.json` at workspace root
- **Cache:** SQLite caches merged result for fast reads
- **File watcher:** Picks up external edits
- **Git-trackable:** Workspace settings can be committed to repo

## HITL (Human-in-the-Loop)

### Trust Levels (configurable per agent type)

| Level | Behavior |
|-------|----------|
| `strict` | Approve every file write, every terminal command |
| `standard` (default) | Approve file writes, auto-approve read-only terminal commands |
| `auto` | Auto-approve everything except destructive commands |

### Approval UI

- **Granularity:** Diff-level, hunk-by-hunk
- **Controls:** Accept All / Reject All / Accept This Hunk
- **Destructive commands:** `rm`, `git reset --hard` always require approval

## Release & Distribution

| Setting | Value |
|---------|-------|
| Update server | GitHub Releases, stable channel only at launch |
| Code signing | Apple notarization + Certum open source (Windows) |
| Telemetry | Opt-in only, zero network in local-only mode |
| Crash reporting | Sentry free tier, opt-in |
| First run | 3-step wizard (workspace → AI setup → done), skippable |
| Platform priority | macOS arm64 > macOS x64 > Linux x64 > Windows x64 |
| License | Apache 2.0 |
