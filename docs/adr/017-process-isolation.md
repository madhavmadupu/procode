# ADR-017: Process Isolation Security Model

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Security Architecture

## Decision

Implement strict process isolation: sandboxed renderer process (contextIsolation: true, nodeIntegration: false), restricted main process (workspace root only), sandboxed extension host (restricted API, no direct network access).

## Rationale

- Electron security best practices — contextIsolation prevents prototype pollution attacks
- Workspace root restriction prevents access to sensitive files outside project
- Extension host sandbox matches VS Code's proven security model
- Defense in depth — multiple layers of isolation reduce blast radius of vulnerabilities
- Agent tools require HITL approval for destructive operations

## Alternatives Considered

- **Full Node.js access in renderer** — Simpler but vulnerable to XSS → RCE attacks
- **No isolation** — Fastest development but unacceptable security risk for IDE handling arbitrary code
- **Full sandbox (no file access)** — Safest but breaks IDE functionality

## Consequences

- **Pros:** Strong security posture, follows Electron best practices, defense in depth
- **Cons:** More complex IPC architecture, careful API surface design required
- **Mitigation:** tRPC for type-safe IPC, Zod validation on all inputs, minimal API surface for extensions
