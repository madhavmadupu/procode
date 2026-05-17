import Anthropic from '@anthropic-ai/sdk';
import type {
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ToolDefinition,
  ProviderHealthStatus,
} from '../types.js';
import type { LLMProvider, AgenticProvider } from './index.js';

export class AnthropicProvider implements LLMProvider, AgenticProvider {
  readonly name = 'anthropic';
  readonly model: string;
  private client: Anthropic;

  constructor(config: { model: string; apiKey: string }) {
    this.model = config.model;
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const messages = request.messages
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: m.content,
      }));

    const systemMessage = request.messages.find((m: any) => m.role === 'system');

    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: this.model,
      messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature,
      stream: false,
    };

    if (systemMessage) {
      params.system = systemMessage.content;
    }

    if (request.tools && request.tools.length > 0) {
      params.tools = request.tools.map((t: any) => ({
        name: t.name,
        description: t.description,
        input_schema: { type: 'object', ...t.parameters } as any,
      }));
    }

    const response = await this.client.messages.create(params);

    const content = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => (block as Anthropic.TextBlock).text)
      .join('\n');

    const toolCalls = response.content
      .filter((block: any) => block.type === 'tool_use')
      .map((block: any) => {
        const toolBlock = block as Anthropic.ToolUseBlock;
        return {
          id: toolBlock.id,
          name: toolBlock.name,
          arguments: JSON.stringify(toolBlock.input),
        };
      });

    return {
      id: response.id,
      choices: [
        {
          message: {
            role: 'assistant',
            content,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          },
          finishReason: response.stop_reason || undefined,
        },
      ],
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  async chatStream(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<ChatCompletionResponse> {
    let fullContent = '';

    const messages = request.messages
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: m.content,
      }));

    const systemMessage = request.messages.find((m: any) => m.role === 'system');

    const params: Anthropic.MessageCreateParamsStreaming = {
      model: this.model,
      messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature,
      stream: true,
    };

    if (systemMessage) {
      params.system = systemMessage.content;
    }

    const stream = await this.client.messages.create(params);

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        const text = chunk.delta.text;
        fullContent += text;
        onChunk(text);
      }
    }

    return {
      id: crypto.randomUUID(),
      choices: [
        {
          message: {
            role: 'assistant',
            content: fullContent,
          },
          finishReason: 'end_turn',
        },
      ],
    };
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10,
      });

      return {
        healthy: true,
        model: this.model,
        version: 'anthropic',
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
    throw new Error('Anthropic does not support task handoff');
  }
}
