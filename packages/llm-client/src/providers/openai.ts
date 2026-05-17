import OpenAI from 'openai';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ToolDefinition,
  ProviderHealthStatus,
} from '../types.js';
import type { LLMProvider, AgenticProvider } from './index.js';

export class OpenAIProvider implements LLMProvider, AgenticProvider {
  readonly name = 'openai';
  readonly model: string;
  private client: OpenAI;

  constructor(config: { model: string; apiKey: string; baseUrl?: string }) {
    this.model = config.model;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const params: OpenAI.ChatCompletionCreateParamsNonStreaming = {
      model: this.model,
      messages: request.messages as OpenAI.ChatCompletionMessageParam[],
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: false,
    };

    if (request.tools && request.tools.length > 0) {
      params.tools = request.tools.map((t: any) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters as Record<string, unknown>,
        },
      }));
      params.tool_choice = request.toolChoice || 'auto';
    }

    const response = await this.client.chat.completions.create(params);

    return {
      id: response.id,
      choices: response.choices.map((choice) => ({
        message: {
          role: choice.message.role as 'system' | 'user' | 'assistant' | 'tool',
          content: choice.message.content || '',
          toolCalls: choice.message.tool_calls?.map((tc) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: tc.function.arguments,
          })),
        },
        finishReason: choice.finish_reason || undefined,
      })),
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  async chatStream(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<ChatCompletionResponse> {
    let fullContent = '';

    const params: OpenAI.ChatCompletionCreateParamsStreaming = {
      model: this.model,
      messages: request.messages as OpenAI.ChatCompletionMessageParam[],
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: true,
    };

    if (request.tools && request.tools.length > 0) {
      params.tools = request.tools.map((t: any) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters as Record<string, unknown>,
        },
      }));
    }

    const stream = await this.client.chat.completions.create(params);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
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
      const response = await this.client.models.list();
      return {
        healthy: true,
        model: this.model,
        version: 'openai',
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
    throw new Error('OpenAI does not support task handoff');
  }
}
