import type {
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ToolDefinition,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderHealthStatus,
} from '../types.js';

export interface LLMProvider {
  readonly name: string;
  readonly model: string;

  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  chatStream(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<ChatCompletionResponse>;
  checkHealth(): Promise<ProviderHealthStatus>;
  supportsTools(): boolean;
  getTools(): ToolDefinition[];
}

export interface AgenticProvider extends LLMProvider {
  supportsHandoff(): boolean;
  handoffTask(task: string, context: string): Promise<string>;
}

export interface EmbeddingProvider {
  readonly name: string;
  readonly model: string;
  readonly dimension: number;

  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  checkHealth(): Promise<ProviderHealthStatus>;
}
