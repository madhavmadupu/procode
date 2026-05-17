import type { ProviderConfig } from './types.js';
import type { LLMProvider, EmbeddingProvider } from './providers/index.js';
import { OllamaProvider } from './providers/ollama.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { OpenCodeProvider } from './providers/opencode.js';
import { OllamaEmbeddingProvider } from './providers/ollama-embedding.js';

export function createProvider(config: ProviderConfig): LLMProvider {
  switch (config.provider) {
    case 'ollama':
      return new OllamaProvider({
        model: config.model,
        baseUrl: config.baseUrl,
      });
    case 'openai':
      if (!config.apiKey) {
        throw new Error('OpenAI provider requires apiKey');
      }
      return new OpenAIProvider({
        model: config.model,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
      });
    case 'anthropic':
      if (!config.apiKey) {
        throw new Error('Anthropic provider requires apiKey');
      }
      return new AnthropicProvider({
        model: config.model,
        apiKey: config.apiKey,
      });
    case 'opencode':
      if (!config.apiKey) {
        throw new Error('OpenCode provider requires apiKey');
      }
      return new OpenCodeProvider({
        model: config.model,
        endpoint: config.baseUrl || 'https://api.opencode.ai',
        apiKey: config.apiKey,
        projectId: config.projectId,
      });
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

export function createEmbeddingProvider(config?: { baseUrl?: string }): EmbeddingProvider {
  return new OllamaEmbeddingProvider(config);
}
