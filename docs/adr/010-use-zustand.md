# ADR-010: Use Zustand for State Management

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — React State Management

## Decision

Use Zustand for React state management across the renderer process.

## Rationale

- Minimal boilerplate — no providers, reducers, or action creators required
- TypeScript-first with excellent type inference
- Small bundle size (~1KB) compared to Redux (~20KB)
- Middleware support (persist, devtools, immer)
- Multiple stores pattern fits IDE architecture (editor.store, workspace.store, git.store, agent.store)
- Direct state access outside React components (useful for IPC handlers)

## Alternatives Considered

- **Redux Toolkit** — More boilerplate, larger bundle, overkill for IDE state patterns
- **Jotai** — Atomic model is elegant but harder to debug complex state flows
- **MobX** — Magical reactivity can be hard to trace, larger bundle
- **Context + useReducer** — Built-in but performance issues with frequent updates (editor cursor, file changes)

## Consequences

- **Pros:** Simple, fast, TypeScript-friendly, small bundle, multiple stores
- **Cons:** Less ecosystem than Redux, no built-in devtools (requires middleware)
- **Mitigation:** Use zustand/middleware for devtools integration, persist middleware for settings
