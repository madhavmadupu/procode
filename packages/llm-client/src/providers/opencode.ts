import type {
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ToolDefinition,
  ProviderHealthStatus,
} from '../types.js';
import type { LLMProvider, AgenticProvider } from './index.js';

export class OpenCodeProvider implements LLMProvider, AgenticProvider {
  readonly name = 'opencode';
  readonly model: string;
  private endpoint: string;
  private apiKey: string;
  private projectId?: string;

  constructor(config: { model: string; endpoint: string; apiKey: string; projectId?: string }) {
    this.model = config.model;
    this.endpoint = config.endpoint.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.projectId = config.projectId;
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...(this.projectId ? { 'X-Project-ID': this.projectId } : {}),
      },
      body: JSON.stringify({
        model: request.model || this.model,
        messages: request.messages,
        stream: false,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenCode API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id || crypto.randomUUID(),
      choices: data.choices.map((c: any) => ({
        message: {
          role: c.message.role,
          content: c.message.content,
        },
        finishReason: c.finish_reason,
      })),
      usage: data.usage,
    };
  }

  async chatStream(
    request: ChatCompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...(this.projectId ? { 'X-Project-ID': this.projectId } : {}),
      },
      body: JSON.stringify({
        model: request.model || this.model,
        messages: request.messages,
        stream: true,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenCode API error: ${response.status} ${response.statusText}`);
    }

    let fullContent = '';
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(line => line.trim().startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '').trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            fullContent += content;
            onChunk(content);
          } catch {
            // Skip malformed SSE data
          }
        }
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
          finishReason: 'stop',
        },
      ],
    };
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    try {
      const response = await fetch(`${this.endpoint}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return { healthy: false, error: `HTTP ${response.status}` };
      }

      return {
        healthy: true,
        model: this.model,
        version: 'opencode',
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
    return true;
  }

  async handoffTask(task: string, context: string): Promise<string> {
    const response = await fetch(`${this.endpoint}/v1/agent/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        task,
        context,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenCode agent error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || data.response || '';
  }
}
