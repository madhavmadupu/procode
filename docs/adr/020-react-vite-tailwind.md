# ADR-020: React 18 + Vite + Tailwind CSS for UI

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — UI Framework Stack

## Decision

Use React 18 for UI components, Vite for build tooling, and Tailwind CSS for styling.

## Rationale

- React 18 — Concurrent features, Suspense, largest component ecosystem
- Vite — Fast HMR (critical for UI iteration), native ESM, excellent TypeScript support
- Tailwind CSS — Utility-first, design token system, easy theme switching (dark/light)
- Proven stack — used by thousands of production applications
- Fast iteration cycle — critical for UI/UX development
- CSS custom properties for theme system — VS Code theme compatibility

## Alternatives Considered

- **Vue 3** — Excellent but smaller ecosystem for IDE-specific components
- **Svelte** — Great performance but smaller ecosystem, less mature tooling
- **Solid.js** — Fastest but smallest ecosystem, riskier for long-term maintenance
- **CSS-in-JS (styled-components)** — Good DX but runtime overhead, Tailwind is zero-runtime
- **Vanilla CSS** — Simple but no design token system, harder to maintain themes

## Consequences

- **Pros:** Fast iteration, large ecosystem, excellent TypeScript support, zero-runtime CSS
- **Cons:** Tailwind class proliferation in JSX, requires discipline to keep components clean
- **Mitigation:** Extract complex UI patterns into reusable components, use Tailwind's @apply for repeated patterns, maintain design token system in tokens.css
