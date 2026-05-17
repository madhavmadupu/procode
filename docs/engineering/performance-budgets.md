# Performance Budgets

## Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| App cold start to editor ready | < 2 seconds | Time from launch to first editable buffer |
| File open (large file, 10k lines) | < 100ms | Time from file selection to rendered content |
| Full workspace index (100k lines) | < 30 seconds | Time from workspace open to complete indexing |
| Incremental index update | < 50ms | Time from file save to graph update complete |
| Inline completion latency (local) | < 300ms | Time from keystroke to ghost text appearance |
| Knowledge graph query | < 20ms | Time from query to results returned |
| Vector search (top-10, 500k chunks) | < 10ms | Time from search to results returned |
| LSP response time | < 200ms | Time from request to completion/diagnostic |
| Git status computation | < 100ms | Time from status request to results |
| Agent task initial response | < 5 seconds | Time from task submission to first agent output |
| UI frame rate | 60 FPS | Consistent frame rate during scrolling, typing |
| Memory usage (idle) | < 500MB | RSS memory with workspace open, no activity |
| Memory usage (active) | < 1GB | RSS memory during indexing, agent tasks |
| Binary size (macOS) | < 200MB | DMG size for universal build |
| Binary size (Windows) | < 180MB | NSIS installer size |

## Measurement Strategy

### Automated Benchmarks
```bash
# Run performance benchmarks
pnpm benchmark

# Outputs:
# - startup-time: 1.2s
# - file-open-10k: 45ms
# - index-100k: 22s
# - incremental-update: 12ms
# - completion-latency: 180ms
# - graph-query: 8ms
# - vector-search: 4ms
```

### CI Performance Gates
- All benchmarks run on every PR
- Regression threshold: 10% degradation blocks merge
- Baseline stored in `benchmarks/baseline.json`
- Comparison report posted as PR comment

### Profiling Tools
- **Chrome DevTools** — Renderer process profiling (CPU, memory, rendering)
- **Node.js --inspect** — Main process profiling
- **cargo bench** — Rust native module benchmarks
- **Instruments (macOS)** — Native memory profiling
- **ETW (Windows)** — Windows performance tracing

## Optimization Strategies

### Startup Time
- Lazy-load packages — only initialize what's needed for first render
- Pre-compile Rust native modules — no JIT on startup
- Cache LSP server state — reuse previous session data
- Async indexing — start indexing after editor is ready

### File Open
- Virtual rendering — only render visible lines in Monaco
- Pre-warm buffer cache — keep recently closed files in memory
- Background syntax highlighting — highlight after render

### Indexing
- Incremental parsing — only re-parse changed file regions
- Parallel processing — index multiple files concurrently
- Priority queue — index active files first, background files later
- Debounced updates — batch rapid file changes

### Vector Search
- HNSW index — O(log n) search complexity
- Memory-mapped index — zero-copy access to vector data
- Batch embedding — generate embeddings in batches, not one-by-one

### Graph Queries
- In-memory petgraph — hot graph in RAM, SurrealDB for persistence
- Indexed lookups — hash maps for O(1) node/edge access
- Subgraph caching — cache frequently accessed subgraphs

## Monitoring

### Runtime Metrics
- Performance metrics collected in production (opt-in telemetry)
- Slow operations logged with context for debugging
- Memory usage tracked per subsystem
- Frame rate monitored during UI interactions

### Alerting
- Startup time > 3 seconds — investigate
- Memory usage > 1.5GB — investigate leaks
- Indexing time > 60 seconds for 100k lines — optimize
- Completion latency > 500ms — fallback to non-RAG completions
