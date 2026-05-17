# ADR-015: Hybrid Search (Vector + BM25) with RRF

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — RAG Retrieval Strategy

## Decision

Use hybrid retrieval combining vector similarity search (HNSW) and BM25 keyword search (SQLite FTS5), fused with Reciprocal Rank Fusion (RRF).

## Rationale

- Vector search captures semantic similarity — finds related code even with different terminology
- BM25 captures exact keyword matches — finds code with specific identifiers, function names
- RRF provides parameter-free fusion — no tuning required for weighting between approaches
- Proven in information retrieval literature — hybrid consistently outperforms either approach alone
- SQLite FTS5 is built-in, zero additional dependencies for BM25

## Alternatives Considered

- **Vector-only search** — Good for semantic but misses exact identifier matches
- **BM25-only search** — Good for keywords but misses semantic relationships
- **Learned fusion (cross-encoder)** — Better quality but adds latency; reserved for reranking stage
- **Weighted linear combination** — Requires manual tuning per domain

## Consequences

- **Pros:** Best retrieval quality, parameter-free fusion, leverages both semantic and lexical signals
- **Cons:** Two search indices to maintain, slightly more complex pipeline
- **Mitigation:** Both searches run in parallel (Promise.all), RRF is computationally cheap
