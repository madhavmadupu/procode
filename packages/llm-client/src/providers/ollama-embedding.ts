import { Ollama } from 'ollama';
import type {
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderHealthStatus,
} from '../types.js';
import type { EmbeddingProvider } from './index.js';

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'ollama-embedding';
  readonly model = 'nomic-embed-text:v1.5';
  readonly dimension = 768;
  private client: Ollama;
  private baseUrl: string;

  constructor(config?: { baseUrl?: string }) {
    this.baseUrl = config?.baseUrl || 'http://localhost:11434';
    this.client = new Ollama({ host: this.baseUrl });
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const inputs = Array.isArray(request.input) ? request.input : [request.input];

    const embeddings: number[][] = [];
    let totalTokens = 0;

    for (const input of inputs) {
      const response = await this.client.embed({
        model: this.model,
        input: input,
      });

      const embedding = response.embeddings[0];
      if (embedding) {
        embeddings.push(embedding);
      }
      totalTokens += response.prompt_eval_count || 0;
    }

    return {
      embeddings,
      usage: {
        promptTokens: totalTokens,
        totalTokens,
      },
    };
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    try {
      const response = await this.client.embed({
        model: this.model,
        input: 'test',
      });

      return {
        healthy: true,
        model: this.model,
        version: 'ollama',
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
