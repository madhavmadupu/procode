# ADR-002: Hybrid TypeScript + Rust Architecture

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Core Architecture

## Decision

Use a hybrid architecture: TypeScript for application shell, orchestration logic, and UI; Rust for performance-critical native subsystems exposed via NAPI-RS bindings.

## Rationale

- TypeScript handles UX, orchestration, and protocol integration where iteration speed matters
- Rust powers hot paths: file watching, AST parsing, vector search, graph traversal
- NAPI-RS provides native performance with zero FFI overhead between Rust and Node.js
- Clear separation of concerns: TypeScript = orchestration, Rust = computation

## Alternatives Considered

- **Pure TypeScript** — Simpler stack but cannot handle 100k+ file repos with sub-50ms incremental updates
- **Pure Rust** — Best performance but significantly slower UI iteration and limited IDE ecosystem
- **TypeScript + WebAssembly** — WASM has serialization overhead and limited threading; NAPI-RS is faster for CPU-bound tasks

## Consequences

- **Pros:** Best of both worlds — fast iteration + native performance
- **Cons:** Two language ecosystems, more complex build pipeline, cross-compilation for native modules
- **Mitigation:** Turborepo + Cargo workspaces for unified build, CI matrix builds for cross-platform native compilation
