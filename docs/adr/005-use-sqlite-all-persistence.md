# ADR-005: Use SQLite for All Persistence Including Knowledge Graph

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Unified Persistence Layer

## Decision

Use SQLite (via better-sqlite3) as the single persistence layer for all ProCode data: workspace state, settings, AND knowledge graph. Graph traversal uses recursive CTEs.

## Rationale

- **Zero licensing risk** — SQLite is public domain, fully OSI-approved
- **Single dependency** — no need to manage two database engines
- **Recursive CTEs are sufficient** — graph traversal queries work well for IDE-scale graphs (<100k nodes)
- **Mature ecosystem** — decades of battle-testing, excellent tooling
- **Synchronous in main process** — no async complexity for a single-writer desktop app
- **$0 cost** — no licensing fees, no cloud requirements

## Alternatives Considered

- **SurrealDB** — Nice graph query syntax but BSL 1.1 license creates cloud sync risk. Superseded ADR-004.
- **DuckDB** — MIT licensed, excellent for analytics, but no native graph primitives
- **LevelDB/RocksDB** — Key-value only, would need to build graph structure from scratch

## Consequences

- **Pros:** Single dependency, public domain license, mature ecosystem, simple architecture
- **Cons:** Graph queries more verbose than SurrealQL, no native graph primitives
- **Mitigation:** `packages/db/src/graph.db.ts` interface is swappable. If a better graph store emerges, it's one adapter swap, not a refactor.

## Performance Notes

- Recursive CTEs handle depth-limited traversals efficiently
- For hot queries, in-memory petgraph (Rust) serves as cache
- SQLite writes are synchronous — acceptable for single-writer desktop app
- Index FQN (fully qualified name) columns for fast lookups
