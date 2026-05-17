import type { LLMProvider, ChatMessage } from '@procode/llm-client';
import type { ToolRegistry } from './tools/ToolRegistry.js';
import type { AgentTask, ToolDefinition, CapabilityTier } from './types.js';
import { AgentQueue } from './AgentQueue.js';
import { AgentExecutor } from './AgentExecutor.js';

export class AgentRouter {
  private provider: LLMProvider;
  private toolRegistry: ToolRegistry;
  private queue: AgentQueue;
  private executor: AgentExecutor;
  private capabilityTier: CapabilityTier;

  constructor(config: {
    provider: LLMProvider;
    toolRegistry: ToolRegistry;
    capabilityTier?: CapabilityTier;
  }) {
    this.provider = config.provider;
    this.toolRegistry = config.toolRegistry;
    this.capabilityTier = config.capabilityTier || 'standard';
    this.queue = new AgentQueue();
    this.executor = new AgentExecutor({
      provider: this.provider,
      toolRegistry: this.toolRegistry,
      queue: this.queue,
      capabilityTier: this.capabilityTier,
    });
  }

  async planTask(userRequest: string, context: string[]): Promise<AgentTask[]> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an agent router. Given a user request, break it down into a sequence of tasks with roles: coder, reviewer, debugger, architect, test, or doc. Return a JSON array of tasks with id, role, description, and dependencies.`,
      },
      {
        role: 'user',
        content: `Request: ${userRequest}\n\nContext:\n${context.join('\n')}`,
      },
    ];

    const response = await this.provider.chat({
      messages,
      model: this.provider.model,
      temperature: 0.3,
      maxTokens: 2048,
    });

    const content = response.choices[0]?.message?.content || '';

    try {
      const tasks = JSON.parse(content) as Array<{
        id: string;
        role: string;
        description: string;
        dependencies: string[];
      }>;

      return tasks.map((t) => ({
        id: t.id || crypto.randomUUID(),
        role: t.role as AgentTask['role'],
        description: t.description,
        status: 'pending' as const,
        dependencies: t.dependencies || [],
        createdAt: Date.now(),
      }));
    } catch {
      return [
        {
          id: crypto.randomUUID(),
          role: 'coder',
          description: userRequest,
          status: 'pending',
          dependencies: [],
          createdAt: Date.now(),
        },
      ];
    }
  }

  async executeTasks(tasks: AgentTask[], context: string[]): Promise<void> {
    for (const task of tasks) {
      await this.executor.executeTask(task, context);
    }
  }

  async executeRequest(userRequest: string, context: string[]): Promise<void> {
    const tasks = await this.planTask(userRequest, context);
    await this.executeTasks(tasks, context);
  }

  getExecutor(): AgentExecutor {
    return this.executor;
  }

  getQueue(): AgentQueue {
    return this.queue;
  }

  setCapabilityTier(tier: CapabilityTier): void {
    this.capabilityTier = tier;
    this.executor.setCapabilityTier(tier);
  }

  getCapabilityTier(): CapabilityTier {
    return this.capabilityTier;
  }

  registerTool(definition: ToolDefinition, handler: (args: Record<string, unknown>) => Promise<unknown>): void {
    this.toolRegistry.register(definition, async (args) => {
      const result = await handler(args);
      return {
        toolName: definition.name,
        success: true,
        data: result,
      };
    });
  }
}
