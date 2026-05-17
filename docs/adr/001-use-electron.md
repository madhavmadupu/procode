# ADR-001: Use Electron for Cross-Platform IDE Shell

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Desktop Application Shell

## Decision

Use Electron (Chromium + Node.js) as the desktop application shell for ProCode IDE.

## Rationale

- Fastest path to a cross-platform IDE with rich ecosystem
- Monaco Editor (VS Code's editor component) is TypeScript-native and runs in browser environments
- Mature ecosystem for IDE features (LSP clients, terminal emulators, file watchers)
- Proven track record: VS Code, Cursor, Zed (early), and many other IDEs use Electron
- Single codebase for macOS, Windows, and Linux

## Alternatives Considered

- **Tauri (Rust + WebView)** — Smaller binary size, but WebView inconsistencies across platforms and limited access to Chromium DevTools
- **Native (Swift/Kotlin/Qt)** — Best performance but 3x development effort for cross-platform parity
- **Flutter Desktop** — Good performance but limited IDE-specific ecosystem and no Monaco support

## Consequences

- **Pros:** Rapid development, access to npm ecosystem, Monaco compatibility, DevTools built-in
- **Cons:** Larger binary size (~150MB), higher memory footprint than native apps
- **Mitigation:** Use Rust native modules for performance-critical paths to offset Electron overhead
