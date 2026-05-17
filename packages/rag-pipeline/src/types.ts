import { z } from 'zod';

export const ChunkMetadataSchema = z.object({
  path: z.string(),
  startLine: z.number(),
  endLine: z.number(),
  language: z.string(),
  symbolName: z.string().optional(),
  symbolKind: z.enum(['function', 'class', 'method', 'variable', 'import', 'other']),
});

export type ChunkMetadata = z.infer<typeof ChunkMetadataSchema>;

export const ChunkSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: ChunkMetadataSchema,
  embedding: z.array(z.number()).optional(),
});

export type Chunk = z.infer<typeof ChunkSchema>;

export const SearchResultSchema = z.object({
  chunk: ChunkSchema,
  score: z.number(),
  source: z.enum(['vector', 'bm25', 'hybrid']),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export const RagConfigSchema = z.object({
  maxChunkSize: z.number().default(512),
  overlapSize: z.number().default(128),
  topK: z.number().default(10),
  excludedPaths: z.array(z.string()).default([
    'node_modules/',
    'dist/',
    'build/',
    'target/',
    '.git/',
    '*.min.js',
    '*.map',
    '*.lock',
  ]),
  maxFileSize: z.number().default(1024 * 1024),
});

export type RagConfig = z.infer<typeof RagConfigSchema>;
