# ADR-013: VS Code Extension API Compatibility Layer

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Extension Ecosystem

## Decision

Implement a subset of the VS Code Extension API for ecosystem compatibility, plus a ProCode-native API for knowledge graph and agent access.

## Rationale

- Massive existing ecosystem — thousands of VS Code extensions available
- Lower barrier to entry for extension developers — familiar API
- ProCode-native API provides unique value (graph queries, agent spawning)
- Sandboxed extension host matches VS Code's security model
- Gradual migration path: VS Code extensions work, ProCode-native extensions unlock new capabilities

## Alternatives Considered

- **Completely custom API** — Full control but zero ecosystem, high adoption barrier
- **OpenVSX compatibility** — Standardized but limited to VS Code API surface
- **No extensions** — Simpler core but limits extensibility and community contributions

## Consequences

- **Pros:** Ecosystem compatibility, familiar API, unique ProCode capabilities
- **Cons:** Maintenance burden to keep VS Code API subset in sync, sandbox complexity
- **Mitigation:** Start with most-used VS Code APIs (window, workspace, languages, commands), expand based on community demand
