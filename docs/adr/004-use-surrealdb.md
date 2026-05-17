# ADR-004: Use SurrealDB for Knowledge Graph Persistence

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Knowledge Graph Storage

## Decision

Use SurrealDB (embedded mode) as the persistent storage for knowledge graph nodes and edges.

## Rationale

- Native graph database with SQL-like query language (SurrealQL)
- Embedded mode runs locally — no separate server process required
- Schema-full definitions for type safety on node/edge types
- Built-in support for graph traversals, relationships, and subgraph queries
- Single binary, zero external dependencies
- Can sync with in-memory petgraph (Rust) for hot queries

## Alternatives Considered

- **Neo4j** — Industry standard but requires separate server process, not local-first
- **SQLite with recursive CTEs** — Simpler but graph queries become complex and slow at scale
- **Dgraph** — Distributed by design, overkill for local-first IDE
- **Custom graph store** — Full control but significant engineering effort

## Consequences

- **Pros:** Local-first, embedded, graph-native, good query language
- **Cons:** Smaller ecosystem than Neo4j, less battle-tested at massive scale
- **Mitigation:** Use petgraph (Rust) as hot in-memory cache; SurrealDB is persistence layer only
