export interface VectorIndex {
  dimension: number;
  metric: "cosine" | "euclidean" | "dot";
  size: number;
  insert(id: string, vector: number[]): void;
  search(vector: number[], k: number): VectorSearchResult[];
  delete(id: string): boolean;
  rebuild(): void;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface ChunkMetadata {
  path: string;
  startLine: number;
  endLine: number;
  language: string;
  symbolName?: string;
  symbolKind: "function" | "class" | "method" | "variable" | "import" | "other";
}
