# ADR-009: Use Turborepo for Monorepo Build Orchestration

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Build System

## Decision

Use Turborepo for monorepo build orchestration across TypeScript packages and Rust workspaces.

## Rationale

- Remote caching for faster CI builds (team productivity)
- Task dependency graph — builds packages in correct order automatically
- Incremental builds — only rebuilds changed packages
- Works alongside Cargo workspaces for Rust crates
- Simple configuration via turbo.json
- Industry standard for TypeScript monorepos (Vercel, Shopify, etc.)

## Alternatives Considered

- **Nx** — More features but heavier, steeper learning curve
- **Lerna** — Older, less performant, largely superseded by Turborepo
- **pnpm workspaces only** — Simple but no task orchestration or caching
- **Make/CMake** — Too low-level for TypeScript monorepo needs

## Consequences

- **Pros:** Fast builds, caching, dependency management, industry standard
- **Cons:** Additional tool to learn, remote caching requires setup
- **Mitigation:** Start with local caching, add remote caching when team grows
