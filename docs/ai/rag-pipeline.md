# RAG Pipeline

## Overview

The RAG (Retrieval-Augmented Generation) pipeline powers all AI-augmented features in ProCode: inline completions, chat context, and agent tool calls.

## Architecture

```
File Change Event
        ↓
   Code-Aware Chunking
        ↓
   Embedding Generation (Ollama)
        ↓
   Vector Index (HNSW, Rust)
   + FTS5 Index (SQLite)
        ↓
   Query → Hybrid Search
        ↓
   Reciprocal Rank Fusion
        ↓
   Reranking (Cross-Encoder)
        ↓
   Context Builder
        ↓
   LLM Prompt
```

## Chunking Strategy

### Code-Aware Chunking

ProCode uses structure-aware chunking rather than naive text splitting:

```typescript
interface CodeChunk {
  id: string;
  fileUri: string;
  content: string;
  nodeId: string;          // Knowledge graph node reference
  chunkType: 'function' | 'class' | 'file' | 'window';
  language: string;
  startLine: number;
  endLine: number;
  symbolName?: string;
  embedding?: Float32Array;
  contentHash: string;     // For change detection
}
```

### Chunking Strategies by Priority

1. **Function-level** (preferred) — Each function is one chunk
   - Preserves complete function logic
   - Natural semantic boundary
   - ~80% of code falls into this category

2. **Class-level** — Class header + method signatures
   - Preserves class structure and relationships
   - Method bodies chunked separately as function-level

3. **File-level** — Small files (< 50 lines) as single chunks
   - Config files, small utilities
   - Complete context preserved

4. **Sliding window** (fallback) — For files without clear structure
   - 512-token windows with 128-token overlap
   - Scripts, templates, non-code files

### Chunking Pipeline

```typescript
// packages/rag-pipeline/src/Chunker.ts
class Chunker {
  async chunkFile(file: File): Promise<CodeChunk[]> {
    const ast = await this.parseAST(file);

    if (ast.hasFunctions()) {
      return this.chunkByFunction(ast, file);
    } else if (ast.hasClasses()) {
      return this.chunkByClass(ast, file);
    } else if (file.lines < 50) {
      return [this.chunkAsFile(file)];
    } else {
      return this.chunkByWindow(file);
    }
  }
}
```

## Embedding

### Model
- **Model:** `nomic-embed-text` via Ollama
- **Dimensions:** 768
- **Runtime:** Local (Ollama sidecar)
- **Latency:** ~50ms per chunk on modern CPU

### Caching Strategy
- Embeddings cached by content hash
- Only recomputed when chunk content changes
- Cache stored in SQLite with `has_embedding` flag
- Batch embedding for new/changed chunks

```typescript
// packages/rag-pipeline/src/Embedder.ts
class Embedder {
  async embedChunks(chunks: CodeChunk[]): Promise<void> {
    const unembedded = chunks.filter(c => !c.hasEmbedding);
    const batches = this.batch(unembedded, 32);

    for (const batch of batches) {
      const texts = batch.map(c => c.content);
      const embeddings = await this.ollama.embed(texts);

      for (let i = 0; i < batch.length; i++) {
        batch[i].embedding = embeddings[i];
        batch[i].hasEmbedding = true;
      }

      await this.vectorIndex.insertBatch(batch);
    }
  }
}
```

## Hybrid Search

### Vector Search (HNSW)
- Implemented in Rust (`native/procode-vector/`)
- HNSW index for approximate nearest neighbor search
- Sub-10ms latency for 500k+ chunks
- Cosine similarity metric

### BM25 Search (SQLite FTS5)
- Full-text search via SQLite FTS5 virtual table
- Porter stemming for English
- Searches content and symbol_name fields

### Reciprocal Rank Fusion

```typescript
// packages/rag-pipeline/src/Retriever.ts
async function retrieve(query: string, topK: number): Promise<RankedChunk[]> {
  const [vectorResults, bm25Results] = await Promise.all([
    vectorSearch(query, topK * 2),      // HNSW search in Rust
    bm25Search(query, topK * 2),        // SQLite FTS5 full-text search
  ]);

  return reciprocalRankFusion(vectorResults, bm25Results, topK);
}

function reciprocalRankFusion(
  vectorResults: SearchResult[],
  bm25Results: SearchResult[],
  topK: number
): RankedChunk[] {
  const k = 60; // Constant for RRF
  const scores = new Map<string, number>();

  for (const [rank, result] of vectorResults.entries()) {
    scores.set(result.id, (scores.get(result.id) || 0) + 1 / (k + rank + 1));
  }

  for (const [rank, result] of bm25Results.entries()) {
    scores.set(result.id, (scores.get(result.id) || 0) + 1 / (k + rank + 1));
  }

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id, score]) => ({ id, score }));
}
```

## Reranking

For agent tasks (not real-time completions), retrieved chunks are reranked:

- **Model:** `ms-marco-MiniLM-L-6-v2` via ONNX Runtime
- **Runtime:** Local CPU (no GPU required)
- **Latency:** ~100ms for top-20 reranking
- **Purpose:** Cross-encoder provides more accurate relevance scores

## Context Builder

Assembles the final prompt context before sending to LLM:

```typescript
// packages/rag-pipeline/src/ContextBuilder.ts
interface PromptContext {
  systemPrompt: string;
  activeFile: string;           // Current buffer content
  adjacentCode: string;         // ±50 lines around cursor
  ragChunks: CodeChunk[];       // Top-10 retrieved chunks
  graphContext: GraphContext;   // Called functions, imports
  recentDiff?: string;          // Recent git changes
  agentMemory?: string;         // Relevant agent memories
}

class ContextBuilder {
  async buildContext(options: ContextOptions): Promise<PromptContext> {
    const [ragChunks, graphContext] = await Promise.all([
      this.retriever.search(options.query, options.topK),
      this.graphQuery(options.cursorSymbol),
    ]);

    return {
      systemPrompt: this.getSystemPrompt(options.taskType),
      activeFile: options.activeFile.content,
      adjacentCode: this.getAdjacentCode(options.activeFile, options.cursor),
      ragChunks: ragChunks.slice(0, 10),
      graphContext,
      recentDiff: await this.getRecentDiff(),
      agentMemory: await this.getRelevantMemories(options.query),
    };
  }
}
```

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Chunking (10k lines) | < 500ms | Tree-sitter parsing |
| Embedding (single chunk) | < 50ms | Ollama local |
| Vector search (500k chunks) | < 10ms | HNSW in Rust |
| BM25 search | < 5ms | SQLite FTS5 |
| RRF fusion | < 1ms | In-memory computation |
| Reranking (top-20) | < 100ms | ONNX cross-encoder |
| Total retrieval pipeline | < 200ms | End-to-end |
