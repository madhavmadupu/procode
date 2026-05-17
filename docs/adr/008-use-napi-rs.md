# ADR-008: Use NAPI-RS for Rust ↔ Node.js Bindings

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Native Module Bridge

## Decision

Use NAPI-RS (Node-API) as the binding layer between Rust native modules and the TypeScript/Node.js application layer.

## Rationale

- NAPI-RS provides stable ABI across Node.js versions (no recompilation per Node version)
- Zero FFI overhead compared to node-ffi-napi
- Excellent TypeScript type generation from Rust definitions
- Active maintenance, strong community, used by major projects (SWC, Deno)
- Cross-compilation support via cross-rs for CI builds
- Ergonomic Rust API for defining Node.js modules

## Alternatives Considered

- **neon** — Older Rust → Node binding library, less active, more complex API
- **node-ffi-napi** — Higher overhead, less type safety
- **WebAssembly (WASM)** — Portable but serialization overhead, limited threading, slower for CPU-bound tasks
- **Custom FFI** — Maximum control but enormous engineering effort

## Consequences

- **Pros:** Stable ABI, zero overhead, TypeScript types generated automatically, cross-platform
- **Cons:** Requires Rust toolchain, native module compilation adds build complexity
- **Mitigation:** Pre-compiled .node binaries for each platform, CI matrix builds
