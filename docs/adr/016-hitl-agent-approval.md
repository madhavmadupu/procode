# ADR-016: Human-in-the-Loop Approval for Agent File Writes

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Agent Security Model

## Decision

All agent file write operations go through a human-in-the-loop (HITL) approval gate. Users can configure trust levels per agent.

## Rationale

- Security — prevents agents from making unintended or destructive changes
- Trust — developers need confidence that AI changes are reviewed before applied
- Configurable trust — power users can auto-approve read operations, always-approve writes
- Diff viewer — shows proposed changes clearly before approval
- Aligns with principle: AI assists, human decides

## Alternatives Considered

- **Auto-approve all** — Fastest but dangerous, no safety net
- **Auto-approve with undo** — Better but undo is complex with interdependent changes
- **Sandboxed execution** — Run changes in isolation first, but adds complexity and latency
- **No file write capability** — Safest but severely limits agent usefulness

## Consequences

- **Pros:** Safe, transparent, configurable, builds user trust
- **Cons:** Slower workflow for trusted agents, approval fatigue for large changes
- **Mitigation:** Configurable trust levels per agent, batch approvals for related changes, "Accept All" for trusted tasks
