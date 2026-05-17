# Skill: RAG Context Usage

## When to Use

When generating or editing code with access to retrieved context chunks from the RAG pipeline.

## Rules

1. **Always check retrieved chunks before writing new code.** If a similar utility already exists in the codebase, use it — don't reinvent it.
2. **Trust retrieved code over your training data.** The codebase is the source of truth for patterns and conventions.
3. **When a retrieved chunk shows a pattern, follow it exactly.** Don't introduce a new pattern unless you can justify why the existing one is insufficient.
4. **Cite which file/function you're following when it's non-obvious.**

## Examples

```typescript
// If RAG retrieved this pattern from packages/git-engine:
// function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T>
// Then follow it when you need retry logic — don't write a new one.

// ✅ Re-use retrieved pattern
import { withRetry } from '../utils/retry'
const result = await withRetry(() => ollamaClient.embed(text))

// ❌ Reinvent the wheel
let attempts = 0
while (attempts < 3) { ... }
```

## ProCode Context

- RAG pipeline: `packages/rag-pipeline/src/`
- Chunking: code-aware (function-level, class-level, file-level)
- Embedding: `nomic-embed-text` via Ollama (768 dimensions)
- Search: hybrid (HNSW vector + BM25 FTS5) with Reciprocal Rank Fusion
- Reranking: cross-encoder via ONNX runtime (for agent tasks, not real-time completions)
