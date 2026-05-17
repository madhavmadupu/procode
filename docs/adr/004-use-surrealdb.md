# ADR-004: Use SurrealDB for Knowledge Graph Persistence

**Status:** Superseded by ADR-005  
**Date:** 2026-05-17  
**Superseded:** 2026-05-17

## Original Decision

Use SurrealDB (embedded mode) as the persistent storage for knowledge graph nodes and edges.

## Why Superseded

SurrealDB uses BSL 1.1 (source-available), not an OSI-approved license. While embedded local use is permitted, it creates a future compliance risk if ProCode ever adds cloud sync features. SQLite with recursive CTEs handles graph persistence adequately for v1 and is public domain.

See ADR-005 for the replacement decision.
