import type { Chunk, SearchResult } from './types.js';

export class HybridSearch {
  private chunks: Map<string, Chunk> = new Map();
  private bm25Index: Map<string, Map<string, number>> = new Map();
  private totalDocuments = 0;

  addChunk(chunk: Chunk): void {
    this.chunks.set(chunk.id, chunk);
    this.updateBm25Index(chunk);
    this.totalDocuments++;
  }

  removeChunk(chunkId: string): boolean {
    const chunk = this.chunks.get(chunkId);
    if (!chunk) return false;

    this.chunks.delete(chunkId);
    this.removeFromBm25Index(chunk);
    this.totalDocuments--;
    return true;
  }

  async search(query: string, vectorResults: SearchResult[], topK: number): Promise<SearchResult[]> {
    const bm25Results = this.bm25Search(query, topK);

    const mergedResults = this.reciprocalRankFusion(vectorResults, bm25Results);

    return mergedResults.slice(0, topK);
  }

  private bm25Search(query: string, topK: number): SearchResult[] {
    const queryTerms = this.tokenize(query);
    const scores: Map<string, number> = new Map();

    for (const term of queryTerms) {
      const docFreq = this.bm25Index.get(term);
      if (!docFreq) continue;

      const idf = Math.log((this.totalDocuments - docFreq.size + 0.5) / (docFreq.size + 0.5) + 1);

      for (const [docId, tf] of docFreq.entries()) {
        const k1 = 1.5;
        const b = 0.75;
        const avgDocLength = this.totalDocuments > 0 ? this.chunks.size / this.totalDocuments : 1;
        const docLength = this.chunks.get(docId)?.content.length || 1;

        const tfScore = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / avgDocLength)));
        const score = idf * tfScore;

        scores.set(docId, (scores.get(docId) || 0) + score);
      }
    }

    const results: SearchResult[] = [];
    for (const [chunkId, score] of scores.entries()) {
      const chunk = this.chunks.get(chunkId);
      if (chunk) {
        results.push({
          chunk,
          score,
          source: 'bm25',
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  private reciprocalRankFusion(vectorResults: SearchResult[], bm25Results: SearchResult[]): SearchResult[] {
    const k = 60;
    const combinedScores: Map<string, { chunk: Chunk; score: number; sources: Set<string> }> = new Map();

    for (const [rank, result] of vectorResults.entries()) {
      const existing = combinedScores.get(result.chunk.id);
      if (existing) {
        existing.score += 1 / (rank + 1 + k);
        existing.sources.add('vector');
      } else {
        combinedScores.set(result.chunk.id, {
          chunk: result.chunk,
          score: 1 / (rank + 1 + k),
          sources: new Set(['vector']),
        });
      }
    }

    for (const [rank, result] of bm25Results.entries()) {
      const existing = combinedScores.get(result.chunk.id);
      if (existing) {
        existing.score += 1 / (rank + 1 + k);
        existing.sources.add('bm25');
      } else {
        combinedScores.set(result.chunk.id, {
          chunk: result.chunk,
          score: 1 / (rank + 1 + k),
          sources: new Set(['bm25']),
        });
      }
    }

    const results: SearchResult[] = [];
    for (const [chunkId, data] of combinedScores.entries()) {
      results.push({
        chunk: data.chunk,
        score: data.score,
        source: data.sources.size > 1 ? 'hybrid' : Array.from(data.sources)[0] as 'vector' | 'bm25',
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private updateBm25Index(chunk: Chunk): void {
    const terms = this.tokenize(chunk.content);
    const termFreq = new Map<string, number>();

    for (const term of terms) {
      termFreq.set(term, (termFreq.get(term) || 0) + 1);
    }

    for (const [term, freq] of termFreq.entries()) {
      if (!this.bm25Index.has(term)) {
        this.bm25Index.set(term, new Map());
      }
      this.bm25Index.get(term)!.set(chunk.id, freq);
    }
  }

  private removeFromBm25Index(chunk: Chunk): void {
    const terms = this.tokenize(chunk.content);

    for (const term of terms) {
      const docFreq = this.bm25Index.get(term);
      if (docFreq) {
        docFreq.delete(chunk.id);
        if (docFreq.size === 0) {
          this.bm25Index.delete(term);
        }
      }
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s_]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  getChunkCount(): number {
    return this.chunks.size;
  }

  getChunk(chunkId: string): Chunk | undefined {
    return this.chunks.get(chunkId);
  }
}
