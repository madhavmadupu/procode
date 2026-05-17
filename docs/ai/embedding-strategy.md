# Embedding Strategy

## Overview

ProCode generates embeddings for all code chunks to enable semantic search. All embeddings are generated locally via Ollama.

## Model Selection

### Primary Model: nomic-embed-text
- **Dimensions:** 768
- **Size:** ~270MB
- **Runtime:** Ollama (local)
- **License:** Apache 2.0
- **Performance:** ~50ms per chunk on modern CPU

### Why nomic-embed-text
- Optimized for code and text
- Excellent performance on semantic search benchmarks
- Small enough for local deployment
- Apache 2.0 license (no restrictions)
- Supported by Ollama out of the box

### Alternative Models
| Model | Dimensions | Size | Notes |
|-------|-----------|------|-------|
| nomic-embed-text | 768 | 270MB | Default choice |
| all-MiniLM-L6-v2 | 384 | 80MB | Smaller, faster, less accurate |
| text-embedding-3-small | 1536 | Cloud only | OpenAI, better but not local |

## Embedding Pipeline

### Batch Processing
```typescript
class Embedder {
  private readonly BATCH_SIZE = 32;
  private readonly ollama: OllamaClient;
  private readonly vectorIndex: HNSWIndex;

  async embedChunks(chunks: CodeChunk[]): Promise<void> {
    const unembedded = chunks.filter(c => !c.hasEmbedding);
    const batches = this.chunkArray(unembedded, this.BATCH_SIZE);

    for (const batch of batches) {
      const texts = batch.map(c => this.prepareText(c));
      const embeddings = await this.ollama.embedBatch(texts);

      for (let i = 0; i < batch.length; i++) {
        batch[i].embedding = embeddings[i];
        batch[i].hasEmbedding = true;
      }

      await this.vectorIndex.insertBatch(batch);
      await this.db.markEmbedded(batch.map(c => c.id));
    }
  }

  private prepareText(chunk: CodeChunk): string {
    // Include symbol name and context for better embeddings
    return `${chunk.symbolName || ''}\n${chunk.content}`;
  }
}
```

### Text Preparation

Embeddings are generated from prepared text that includes:

1. **Symbol name** (if available) — Function/class name provides strong signal
2. **Code content** — The actual code text
3. **Language hint** — Language identifier for multi-language workspaces

```
functionName
function body content here...
```

### Change Detection

Embeddings are only regenerated when content changes:

```typescript
class ChunkTracker {
  private contentHashes: Map<string, string> = new Map();

  needsReEmbed(chunk: CodeChunk): boolean {
    const currentHash = hash(chunk.content);
    const storedHash = this.contentHashes.get(chunk.id);

    if (storedHash !== currentHash) {
      this.contentHashes.set(chunk.id, currentHash);
      return true;
    }
    return false;
  }
}
```

## Vector Index

### HNSW Index (Rust)
```rust
// native/procode-vector/src/hnsw.rs
pub struct HNSWIndex {
    layers: Vec<HNSWLayer>,
    dimensions: usize,
    m: usize,              // Max connections per layer
    ef_construction: usize, // Construction-time search width
    ef_search: usize,       // Query-time search width
}

impl HNSWIndex {
    pub fn new(dimensions: usize, m: usize, ef_construction: usize) -> Self { ... }

    pub fn insert(&mut self, id: String, vector: Vec<f32>) { ... }

    pub fn search(&self, vector: &[f32], k: usize) -> Vec<SearchResult> { ... }

    pub fn save(&self, path: &str) -> Result<()> { ... }

    pub fn load(path: &str) -> Result<Self> { ... }
}
```

### Persistence
- HNSW index saved to disk as binary file
- sqlite-vec as fallback/backup
- Index loaded on workspace open
- Incremental updates without full rebuild

### Configuration
```rust
// Default HNSW parameters
let index = HNSWIndex::new(
    dimensions: 768,        // nomic-embed-text dimensions
    m: 16,                  // Max connections per node
    ef_construction: 200,   // Build quality (higher = better, slower)
    ef_search: 50,          // Query quality (higher = better, slower)
);
```

## Performance

| Operation | Target | Notes |
|-----------|--------|-------|
| Single embedding | < 50ms | Ollama local inference |
| Batch embedding (32) | < 500ms | Parallel processing |
| HNSW insert (single) | < 1ms | In-memory operation |
| HNSW search (500k) | < 10ms | Top-10 results |
| Index save/load | < 1s | Binary serialization |

## Memory Usage

| Metric | Estimate |
|--------|----------|
| Embedding per chunk | 768 × 4 bytes = 3KB |
| 100k chunks | ~300MB |
| HNSW index overhead | ~2x raw embeddings |
| Total for 100k chunks | ~900MB |

### Memory Optimization
- Memory-mapped index file (zero-copy access)
- Evict rarely accessed chunks from RAM
- Compress embeddings (PCA to 512 dimensions if needed)
