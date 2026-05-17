---
name: error-handling
description: Error handling and observability for ProCode — typed errors, contextual logging, Result pattern in TS and Rust
---

# Skill: Error Handling & Observability

## When to Use

When writing error handling code in TypeScript or Rust for ProCode.

## Rules

All errors in ProCode must be:

1. **Typed** — use discriminated union error types, not string errors
2. **Contextual** — include enough information to diagnose without a debugger
3. **Logged** — use the `logger` utility with structured fields
4. **Surfaced appropriately** — IPC errors → UI notification; internal errors → log only

## TypeScript Examples

```typescript
// ✅ Correct error handling
import { logger } from '@procode/utils'

type EmbedError =
  | { type: 'OLLAMA_UNAVAILABLE'; message: string }
  | { type: 'MODEL_NOT_FOUND'; model: string }
  | { type: 'CONTENT_TOO_LARGE'; size: number; limit: number }

async function embedChunk(chunk: CodeChunk): Promise<Result<Float32Array, EmbedError>> {
  if (chunk.content.length > MAX_EMBED_SIZE) {
    return err({ type: 'CONTENT_TOO_LARGE', size: chunk.content.length, limit: MAX_EMBED_SIZE })
  }

  const response = await ollamaClient.embed(chunk.content).catch(e => {
    logger.error('ollama.embed.failed', { chunkId: chunk.id, error: e.message })
    return null
  })

  if (!response) return err({ type: 'OLLAMA_UNAVAILABLE', message: 'Ollama not responding' })
  return ok(new Float32Array(response.embedding))
}
```

## Rust Examples

```rust
// ✅ Correct Rust error handling
#[derive(thiserror::Error, Debug)]
pub enum GraphError {
    #[error("Node not found: {0}")]
    NodeNotFound(String),
    #[error("Cycle detected involving node: {0}")]
    CycleDetected(String),
    #[error("Database sync failed: {0}")]
    SyncFailed(#[from] surrealdb::Error),
}

// Always propagate with context
fn process_node(id: &str) -> Result<(), GraphError> {
    let node = self.find(id)
        .ok_or_else(|| GraphError::NodeNotFound(id.to_string()))?;
    // ...
    Ok(())
}
```

## ProCode Context

- TypeScript: use `Result<T, E>` pattern from `neverthrow` or similar
- Rust: `anyhow` for application crates, `thiserror` for library crates
- Logger: `packages/utils/src/logger.ts` with structured fields
- IPC errors: surface to UI via notification toast
- Internal errors: log only, don't expose internals to renderer
