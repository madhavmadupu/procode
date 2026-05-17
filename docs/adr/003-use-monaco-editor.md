# ADR-003: Use Monaco Editor as Editor Engine

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Code Editing

## Decision

Use Monaco Editor as the core code editing component.

## Rationale

- Same engine powering VS Code — battle-tested with millions of users
- Native TypeScript support with excellent IntelliSense
- Built-in support for 100+ languages with syntax highlighting
- Rich API for extensions: completion providers, hover providers, code actions, decorations
- Virtual document support (git diffs, agent previews)
- Active maintenance by Microsoft with strong community

## Alternatives Considered

- **CodeMirror 6** — Lighter weight, excellent extensibility, but less mature LSP integration and smaller ecosystem
- **Ace Editor** — Mature but older architecture, less active development
- **Custom editor** — Full control but years of development to reach Monaco parity

## Consequences

- **Pros:** VS Code parity out of the box, massive ecosystem, zero learning curve for VS Code users
- **Cons:** Tightly coupled to browser/DOM model, harder to customize at deep levels
- **Mitigation:** Wrap Monaco in abstraction layer (EditorService) for future flexibility
