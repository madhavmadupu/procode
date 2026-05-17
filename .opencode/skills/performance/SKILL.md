# Skill: Performance-Sensitive Code

## When to Use

When working on hot paths in ProCode — indexer callbacks, completion providers, IPC handlers, graph traversal, vector search, AST parsing.

## TypeScript Hot Paths

- Avoid object allocation in tight loops. Reuse buffers.
- Use `Map` over plain objects for string-keyed stores with frequent updates.
- Use `Set` for membership tests. Never `array.includes()` on large arrays.
- Debounce all file-change-driven operations. Default debounce: 50ms.
- Prefer `for...of` over `.forEach()` — allows `break`, `continue`, `return`.

## Rust Hot Paths

- Profile with `cargo flamegraph` before any optimization.
- Prefer `Vec` over `LinkedList`. Cache locality matters.
- Avoid cloning inside loops. Take references or use `Cow<str>`.
- Use `rayon` for data-parallel workloads (batch embedding, parallel file parsing).
- Keep HNSW index hot in memory. Only flush to disk on explicit checkpoints.

## Performance Budgets

| Metric | Target |
|--------|--------|
| App cold start to editor ready | < 2 seconds |
| File open (10k lines) | < 100ms |
| Full workspace index (100k lines) | < 30 seconds |
| Incremental index update | < 50ms |
| Inline completion latency (local) | < 300ms |
| Knowledge graph query | < 20ms |
| Vector search (top-10, 500k chunks) | < 10ms |

## Measuring, Not Guessing

```bash
# TypeScript benchmark
pnpm --filter @procode/knowledge-graph bench

# Rust benchmark
cargo bench --package procode-vector

# E2E timing
pnpm e2e -- --headed tests/performance/indexing.spec.ts
```

## ProCode Context

- Performance budgets enforced in CI — 10% regression blocks merge
- Baseline stored in `benchmarks/baseline.json`
- Use Chrome DevTools for renderer profiling, `--inspect` for main process
- `cargo flamegraph` for Rust profiling
