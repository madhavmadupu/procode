import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  toolCalls: z.array(z.object({
    id: z.string(),
    name: z.string(),
    arguments: z.string(),
  })).optional(),
  toolCallId: z.string().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.unknown()),
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  arguments: z.record(z.unknown()),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

export const ChatCompletionRequestSchema = z.object({
  messages: z.array(ChatMessageSchema),
  model: z.string(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  tools: z.array(ToolDefinitionSchema).optional(),
  toolChoice: z.enum(['none', 'auto', 'required']).optional(),
  stream: z.boolean().optional(),
});

export type ChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;

export const ChatCompletionResponseSchema = z.object({
  id: z.string(),
  choices: z.array(z.object({
    message: ChatMessageSchema,
    finishReason: z.string().optional(),
  })),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }).optional(),
});

export type ChatCompletionResponse = z.infer<typeof ChatCompletionResponseSchema>;

export const EmbeddingRequestSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  model: z.string(),
});

export type EmbeddingRequest = z.infer<typeof EmbeddingRequestSchema>;

export const EmbeddingResponseSchema = z.object({
  embeddings: z.array(z.array(z.number())),
  usage: z.object({
    promptTokens: z.number(),
    totalTokens: z.number(),
  }).optional(),
});

export type EmbeddingResponse = z.infer<typeof EmbeddingResponseSchema>;

export const ProviderConfigSchema = z.object({
  provider: z.enum(['ollama', 'openai', 'anthropic', 'opencode']),
  model: z.string(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  temperature: z.number().default(0.7),
  maxTokens: z.number().default(4096),
  projectId: z.string().optional(),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

export const ProviderHealthStatusSchema = z.object({
  healthy: z.boolean(),
  model: z.string().optional(),
  version: z.string().optional(),
  error: z.string().optional(),
});

export type ProviderHealthStatus = z.infer<typeof ProviderHealthStatusSchema>;
