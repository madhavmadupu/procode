import type { EmbeddingProvider } from '@procode/llm-client';
import type { Chunk, SearchResult, RagConfig } from './types.js';
import { CodeChunker } from './CodeChunker.js';
import { HybridSearch } from './HybridSearch.js';

export class RagPipeline {
  private chunker: CodeChunker;
  private hybridSearch: HybridSearch;
  private embeddingProvider: EmbeddingProvider;
  private config: RagConfig;

  constructor(config: {
    embeddingProvider: EmbeddingProvider;
    config?: Partial<RagConfig>;
  }) {
    this.embeddingProvider = config.embeddingProvider;
    this.config = {
      maxChunkSize: config.config?.maxChunkSize || 512,
      overlapSize: config.config?.overlapSize || 128,
      topK: config.config?.topK || 10,
      excludedPaths: config.config?.excludedPaths || [],
      maxFileSize: config.config?.maxFileSize || 1024 * 1024,
    };
    this.chunker = new CodeChunker(this.config);
    this.hybridSearch = new HybridSearch();
  }

  async indexFile(filePath: string, content: string, language: string): Promise<Chunk[]> {
    const chunks = this.chunker.chunkFile(filePath, content, language);

    if (chunks.length === 0) {
      return [];
    }

    const texts = chunks.map((c) => c.content);
    const embeddingResponse = await this.embeddingProvider.embed({
      input: texts,
      model: this.embeddingProvider.model,
    });

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddingResponse.embeddings[i];
      if (chunk && embedding) {
        chunk.embedding = embedding;
        this.hybridSearch.addChunk(chunk);
      }
    }

    return chunks;
  }

  async search(query: string, topK?: number): Promise<SearchResult[]> {
    const k = topK || this.config.topK;

    const queryEmbedding = await this.embeddingProvider.embed({
      input: query,
      model: this.embeddingProvider.model,
    });

    const vectorQuery = queryEmbedding.embeddings[0];
    const vectorResults: SearchResult[] = [];

    const bm25Results = this.hybridSearch['bm25Search'](query, k);

    const mergedResults = this.hybridSearch['reciprocalRankFusion'](vectorResults, bm25Results);

    return mergedResults.slice(0, k);
  }

  removeFile(filePath: string): void {
    const chunksToRemove: string[] = [];

    for (const [chunkId, chunk] of this.hybridSearch['chunks'].entries()) {
      if (chunk.metadata.path === filePath) {
        chunksToRemove.push(chunkId);
      }
    }

    for (const chunkId of chunksToRemove) {
      this.hybridSearch.removeChunk(chunkId);
    }
  }

  getChunkCount(): number {
    return this.hybridSearch.getChunkCount();
  }

  getChunk(chunkId: string): Chunk | undefined {
    return this.hybridSearch.getChunk(chunkId);
  }
}
