import { Ollama } from 'ollama';
import type {
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ToolDefinition,
  ProviderHealthStatus,
} from '../types.js';
import type { LLMProvider, AgenticProvider } from './index.js';

export class OllamaProvider implements LLMProvider, AgenticProvider {
  readonly name = 'ollama';
  readonly model: string;
  private client: Ollama;
  private baseUrl: string;

  constructor(config: { model: string; baseUrl?: string }) {
    this.model = config.model;
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.client = new Ollama({ host: this.baseUrl });
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await this.client.chat({
      model: this.model,
      messages: request.messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      options: {
        temperature: request.temperature,
        num_predict: request.maxTokens,
      },
      stream: false,
    });

    return {
      id: crypto.randomUUID(),
      choices: [
        {
          message: {
            role: 'assistant',
            content: response.message.content,
          },
          finishReason: response.done_reason || 'stop',
        },
      ],
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
    };
  }

  async chatStream(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<ChatCompletionResponse> {
    let fullContent = '';

    const stream = await this.client.chat({
      model: this.model,
      messages: request.messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      options: {
        temperature: request.temperature,
        num_predict: request.maxTokens,
      },
      stream: true,
    });

    for await (const part of stream) {
      const content = part.message?.content || '';
      fullContent += content;
      onChunk(content);
    }

    return {
      id: crypto.randomUUID(),
      choices: [
        {
          message: {
            role: 'assistant',
            content: fullContent,
          },
          finishReason: 'stop',
        },
      ],
    };
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return { healthy: false, error: `HTTP ${response.status}` };
      }

      const data = (await response.json()) as { models: Array<{ name: string }> };
      const hasModel = data.models?.some((m: any) => m.name === this.model || m.name.startsWith(this.model.split(':')[0]));

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

  supportsTools(): boolean {
    return true;
  }

  getTools(): ToolDefinition[] {
    return [];
  }

  supportsHandoff(): boolean {
    return false;
  }

  async handoffTask(_task: string, _context: string): Promise<string> {
    throw new Error('Ollama does not support task handoff');
  }
}
