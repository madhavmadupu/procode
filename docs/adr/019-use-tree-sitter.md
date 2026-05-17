# ADR-019: Tree-Sitter for AST Parsing

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — Code Analysis

## Decision

Use Tree-sitter for incremental AST parsing across all supported languages.

## Rationale

- Incremental parsing — only re-parses changed portions of file, critical for performance
- Language-agnostic — same API for all languages via grammar files
- Error-tolerant — produces valid AST even for incomplete/syntax-error code
- Used by GitHub (semantic highlighting), Neovim, Helix — battle-tested
- Can be compiled to WASM or native via NAPI-RS
- Grammar files available for 100+ languages

## Alternatives Considered

- **Language-specific parsers** — Precise but requires maintaining separate parser per language
- **Regex-based parsing** — Fast but fragile, breaks on edge cases
- **TypeScript Compiler API** — Excellent for TS/JS but not language-agnostic
- **ANTLR** — Powerful but requires grammar writing, less community support

## Consequences

- **Pros:** Incremental, error-tolerant, language-agnostic, battle-tested
- **Cons:** Grammar quality varies by language, some grammars lag behind language updates
- **Mitigation:** Use official Tree-sitter grammars, contribute fixes upstream, fallback to regex for unsupported languages
