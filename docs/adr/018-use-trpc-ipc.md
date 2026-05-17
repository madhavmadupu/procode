# ADR-018: tRPC for Type-Safe IPC

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Inter-Process Communication

## Decision

Use tRPC over Electron IPC for type-safe communication between renderer and main processes.

## Rationale

- End-to-end type safety — TypeScript types shared between renderer and main
- Zero runtime schema definition — types derived from router definition
- Zod validation on all inputs — runtime safety plus compile-time types
- Familiar API pattern — similar to REST/GraphQL but with full type inference
- Excellent developer experience — autocomplete, type errors caught at compile time
- Lightweight — no code generation step required

## Alternatives Considered

- **Raw Electron IPC** — Simple but no type safety, easy to introduce runtime errors
- **gRPC** — Type-safe but requires protobuf definitions, overkill for local IPC
- **MessageChannel with manual typing** — Flexible but error-prone, no validation
- **JSON-RPC** — Standardized but no TypeScript type inference

## Consequences

- **Pros:** Full type safety, Zod validation, great DX, lightweight
- **Cons:** tRPC is primarily designed for HTTP; Electron IPC adapter required
- **Mitigation:** Use tRPC's custom link system to adapt to Electron IPC, well-tested pattern
