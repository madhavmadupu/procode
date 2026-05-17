import { router, publicProcedure } from "./trpc.js";
import { z } from "zod";

let llmProvider: any = null;
let embeddingProvider: any = null;
let agentRouter: any = null;
let ragPipeline: any = null;

export const aiRouter = router({
  checkHealth: publicProcedure.query(async () => {
    if (!llmProvider) {
      return { healthy: false, error: "No provider configured" };
    }

    try {
      const status = await llmProvider.checkHealth();
      return status;
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),

  chat: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant", "tool"]),
            content: z.string(),
          })
        ),
        model: z.string().optional(),
        temperature: z.number().optional(),
        maxTokens: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!llmProvider) {
        throw new Error("No LLM provider configured");
      }

      const response = await llmProvider.chat({
        messages: input.messages,
        model: input.model || llmProvider.model,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      });

      return response;
    }),

  configureProvider: publicProcedure
    .input(
      z.object({
        provider: z.enum(["ollama", "openai", "anthropic"]),
        model: z.string(),
        apiKey: z.string().optional(),
        baseUrl: z.string().optional(),
        temperature: z.number().default(0.7),
        maxTokens: z.number().default(4096),
      })
    )
    .mutation(async ({ input }) => {
      const { createProvider } = await import("@procode/llm-client");

      llmProvider = createProvider({
        provider: input.provider,
        model: input.model,
        apiKey: input.apiKey,
        baseUrl: input.baseUrl,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      });

      return { success: true, provider: input.provider, model: input.model };
    }),

  configureEmbeddingProvider: publicProcedure
    .input(
      z.object({
        baseUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { createEmbeddingProvider } = await import("@procode/llm-client");

      embeddingProvider = createEmbeddingProvider(input);

      return { success: true, provider: "ollama-embedding" };
    }),

  executeAgentTask: publicProcedure
    .input(
      z.object({
        request: z.string(),
        context: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      if (!agentRouter) {
        throw new Error("Agent router not initialized");
      }

      const taskId = `task-${Date.now()}`;
      await agentRouter.executeRequest(input.request, input.context);

      return { taskId, status: "queued" };
    }),

  searchCodebase: publicProcedure
    .input(
      z.object({
        query: z.string(),
        topK: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      if (!ragPipeline) {
        throw new Error("RAG pipeline not initialized");
      }

      const results = await ragPipeline.search(input.query, input.topK);
      return results;
    }),

  indexFile: publicProcedure
    .input(
      z.object({
        filePath: z.string(),
        content: z.string(),
        language: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      if (!ragPipeline) {
        throw new Error("RAG pipeline not initialized");
      }

      const chunks = await ragPipeline.indexFile(
        input.filePath,
        input.content,
        input.language
      );

      return { chunksIndexed: chunks.length };
    }),
});
