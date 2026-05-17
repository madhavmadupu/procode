# ADR-014: Code-Aware Chunking for RAG

**Status:** Accepted  
**Date:** 2026-05-17  
**Context:** ProCode IDE — RAG Pipeline

## Decision

Use code-aware chunking (function-level, class-level, file-level) rather than naive character-based text splitting for the RAG pipeline.

## Rationale

- Code has inherent structure — functions, classes, modules are natural semantic boundaries
- Function-level chunks preserve context: a function's logic stays together
- Class-level chunks preserve method relationships and class invariants
- File-level chunks for small files maintain complete context
- Sliding window fallback for files without clear structure (scripts, configs)
- Better retrieval quality — chunks align with how developers think about code

## Alternatives Considered

- **Fixed-size character chunks** — Simple but breaks functions mid-logic, loses context
- **AST-based chunks only** — Precise but misses comments, imports, and non-code context
- **Sentence-based chunks** — Works for prose but not code
- **Line-based chunks** — Too granular, loses function-level context

## Consequences

- **Pros:** Higher retrieval quality, chunks align with developer mental models, better AI responses
- **Cons:** More complex chunking logic, language-specific parsers required
- **Mitigation:** Use Tree-sitter for language-agnostic AST parsing, fallback to sliding window for unsupported languages
