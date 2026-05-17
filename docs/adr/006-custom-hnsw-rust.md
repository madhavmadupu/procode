# ADR-006: Custom HNSW in Rust for Vector Search

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Vector Similarity Search

## Decision

Implement a custom HNSW (Hierarchical Navigable Small World) index in Rust for vector similarity search over code embeddings, with sqlite-vec as persistence fallback.

## Rationale

- HNSW provides excellent recall/speed tradeoff for approximate nearest neighbor search
- Rust implementation ensures cache-efficient memory layout and zero-copy operations
- Sub-10ms search latency for 500k+ code chunks (performance budget requirement)
- sqlite-vec provides disk-backed persistence without custom serialization
- Full control over index construction, update strategies, and memory management

## Alternatives Considered

- **Faiss (Meta)** — Excellent but C++ dependency, heavy binary, overkill for code embeddings
- **usearch** — Good Rust library but less control over memory layout
- **SQLite-vec only** — Simpler but slower for large indices; better as persistence layer
- **Chroma/Qdrant** — Require separate server processes, not local-first

## Consequences

- **Pros:** Maximum performance, full control, local-first, sub-10ms latency
- **Cons:** Engineering effort to implement and maintain HNSW correctly
- **Mitigation:** Use well-tested HNSW algorithms from literature, extensive benchmarking, sqlite-vec as fallback
