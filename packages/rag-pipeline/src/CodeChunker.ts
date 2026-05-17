import type { Chunk, ChunkMetadata, RagConfig } from './types.js';

const LANGUAGE_PATTERNS: Record<string, RegExp> = {
  typescript: /(?:export\s+)?(?:async\s+)?function\s+(\w+)|class\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=/g,
  javascript: /(?:export\s+)?(?:async\s+)?function\s+(\w+)|class\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=/g,
  python: /(?:async\s+)?def\s+(\w+)|class\s+(\w+)/g,
  rust: /(?:pub\s+)?(?:async\s+)?fn\s+(\w+)|struct\s+(\w+)|enum\s+(\w+)|impl\s+(\w+)/g,
  go: /func\s+(\w+)|type\s+(\w+)\s+(?:struct|interface)/g,
};

const MAX_CHUNK_SIZE = 512;
const OVERLAP_SIZE = 128;

export class CodeChunker {
  private config: RagConfig;

  constructor(config?: Partial<RagConfig>) {
    this.config = {
      maxChunkSize: config?.maxChunkSize || MAX_CHUNK_SIZE,
      overlapSize: config?.overlapSize || OVERLAP_SIZE,
      topK: config?.topK || 10,
      excludedPaths: config?.excludedPaths || [],
      maxFileSize: config?.maxFileSize || 1024 * 1024,
    };
  }

  chunkFile(filePath: string, content: string, language: string): Chunk[] {
    if (content.length > this.config.maxFileSize) {
      return [];
    }

    const lines = content.split('\n');
    const chunks: Chunk[] = [];

    const symbols = this.extractSymbols(content, language);

    if (symbols.length > 0) {
      for (const symbol of symbols) {
        const symbolContent = lines.slice(symbol.startLine, symbol.endLine + 1).join('\n');
        if (this.estimateTokens(symbolContent) <= this.config.maxChunkSize) {
          chunks.push({
            id: `${filePath}:${symbol.name}:${symbol.startLine}`,
            content: symbolContent,
            metadata: {
              path: filePath,
              startLine: symbol.startLine,
              endLine: symbol.endLine,
              language,
              symbolName: symbol.name,
              symbolKind: symbol.kind,
            },
          });
        } else {
          const subChunks = this.splitLargeSymbol(symbolContent, symbol, filePath, language, lines);
          chunks.push(...subChunks);
        }
      }
    } else {
      const topLevelChunks = this.chunkByTopLevelBlocks(content, filePath, language, lines);
      chunks.push(...topLevelChunks);
    }

    return chunks;
  }

  private extractSymbols(content: string, language: string): Array<{
    name: string;
    kind: ChunkMetadata['symbolKind'];
    startLine: number;
    endLine: number;
  }> {
    const symbols: Array<{ name: string; kind: ChunkMetadata['symbolKind']; startLine: number; endLine: number }> = [];
    const lines = content.split('\n');

    const pattern: RegExp = LANGUAGE_PATTERNS[language] || LANGUAGE_PATTERNS['typescript']!;
    const matches = [...content.matchAll(pattern)];

    for (const match of matches) {
      const name = match[1] || match[2] || match[3] || match[4] || 'unknown';
      const matchIndex = match.index || 0;
      const startLine = content.substring(0, matchIndex).split('\n').length - 1;

      let endLine = startLine;
      let braceCount = 0;
      let foundOpen = false;

      for (let i = startLine; i < lines.length; i++) {
        const line = lines[i] || '';
        for (const char of line) {
          if (char === '{') {
            braceCount++;
            foundOpen = true;
          } else if (char === '}') {
            braceCount--;
          }
        }

        if (foundOpen && braceCount === 0) {
          endLine = i;
          break;
        }
      }

      const kind = this.determineSymbolKind(name, match[0]);

      symbols.push({ name, kind, startLine, endLine });
    }

    return symbols;
  }

  private determineSymbolKind(name: string, matchText: string): ChunkMetadata['symbolKind'] {
    if (matchText.includes('class')) return 'class';
    if (matchText.includes('function') || matchText.includes('fn') || matchText.includes('def')) return 'function';
    if (matchText.includes('const') || matchText.includes('let') || matchText.includes('var')) return 'variable';
    if (matchText.includes('import')) return 'import';
    return 'other';
  }

  private splitLargeSymbol(
    content: string,
    symbol: { name: string; kind: ChunkMetadata['symbolKind']; startLine: number; endLine: number },
    filePath: string,
    language: string,
    lines: string[]
  ): Chunk[] {
    const chunks: Chunk[] = [];
    let currentChunk = '';
    let chunkStartLine = symbol.startLine;

    for (let i = symbol.startLine; i <= symbol.endLine; i++) {
      const line = lines[i];
      if (this.estimateTokens(currentChunk + line) > this.config.maxChunkSize) {
        if (currentChunk) {
          chunks.push({
            id: `${filePath}:${symbol.name}:${chunkStartLine}`,
            content: currentChunk,
            metadata: {
              path: filePath,
              startLine: chunkStartLine,
              endLine: i - 1,
              language,
              symbolName: symbol.name,
              symbolKind: symbol.kind,
            },
          });

          const overlap = currentChunk.split('\n').slice(-Math.ceil(this.config.overlapSize / 50)).join('\n');
          currentChunk = overlap + '\n' + line;
          chunkStartLine = i - Math.ceil(this.config.overlapSize / 50);
        }
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }

    if (currentChunk) {
      chunks.push({
        id: `${filePath}:${symbol.name}:${chunkStartLine}`,
        content: currentChunk,
        metadata: {
          path: filePath,
          startLine: chunkStartLine,
          endLine: symbol.endLine,
          language,
          symbolName: symbol.name,
          symbolKind: symbol.kind,
        },
      });
    }

    return chunks;
  }

  private chunkByTopLevelBlocks(
    content: string,
    filePath: string,
    language: string,
    lines: string[]
  ): Chunk[] {
    const chunks: Chunk[] = [];
    let currentChunk = '';
    let chunkStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (this.estimateTokens(currentChunk + line) > this.config.maxChunkSize) {
        if (currentChunk) {
          chunks.push({
            id: `${filePath}:block:${chunkStartLine}`,
            content: currentChunk,
            metadata: {
              path: filePath,
              startLine: chunkStartLine,
              endLine: i - 1,
              language,
              symbolKind: 'other',
            },
          });

          const overlapLines = currentChunk.split('\n').slice(-Math.ceil(this.config.overlapSize / 50));
          currentChunk = overlapLines.join('\n') + '\n' + line;
          chunkStartLine = i - overlapLines.length;
        }
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }

    if (currentChunk) {
      chunks.push({
        id: `${filePath}:block:${chunkStartLine}`,
        content: currentChunk,
        metadata: {
          path: filePath,
          startLine: chunkStartLine,
          endLine: lines.length - 1,
          language,
          symbolKind: 'other',
        },
      });
    }

    return chunks;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
