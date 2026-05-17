# ADR-011: Local-First Architecture

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Core Philosophy

## Decision

All AI inference, indexing, and data storage happens on the user's machine by default. No code leaves the machine without explicit consent.

## Rationale

- Developer privacy — code is intellectual property, should not leave machine without consent
- No network dependency — IDE works offline, no latency from cloud round-trips
- Enterprise appeal — companies with strict data policies can adopt without security review
- Competitive differentiation — most AI IDEs send code to cloud by default
- Aligns with growing local-first software movement

## Alternatives Considered

- **Cloud-first** — Better model quality, easier to iterate, but privacy concerns and network dependency
- **Hybrid with cloud default** — Easier onboarding but violates core privacy principle
- **Local with cloud opt-in** — Best of both worlds; chosen approach

## Consequences

- **Pros:** Privacy, offline capability, enterprise appeal, differentiation
- **Cons:** Model quality limited by local hardware, larger download sizes for models
- **Mitigation:** Optional cloud adapters (Anthropic, OpenAI) with explicit opt-in per workspace, clear disclosure of what data is sent
