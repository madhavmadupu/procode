# ADR-005: Use SQLite for Workspace State

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Workspace Metadata Storage

## Decision

Use SQLite (via better-sqlite3) for workspace-level state: editor state, settings, breakpoints, agent memory, task history, and FTS5 code search.

## Rationale

- Zero-configuration, serverless, single-file database
- FTS5 extension provides excellent full-text search for BM25 retrieval
- Mature, battle-tested, used by countless applications
- better-sqlite3 provides synchronous API — simpler than async wrappers
- Perfect fit for local-first architecture
- ACID transactions for data integrity

## Alternatives Considered

- **LevelDB** — Good for key-value but lacks relational queries and FTS
- **JSON files** — Simple but no query capability, no transactions, prone to corruption
- **PostgreSQL** — Overkill for local workspace state, requires server process

## Consequences

- **Pros:** Simple, reliable, FTS5 built-in, zero external dependencies
- **Cons:** Single-writer model (not an issue for local IDE), manual migration management
- **Mitigation:** Use migration scripts, single main-process writer pattern
