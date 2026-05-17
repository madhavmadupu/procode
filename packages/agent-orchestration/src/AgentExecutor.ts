import type { LLMProvider, ChatMessage, ChatCompletionRequest } from '@procode/llm-client';
import type { ToolRegistry } from './tools/ToolRegistry.js';
import type { AgentTask, AgentEvent, HitlApproval, CapabilityTier } from './types.js';
import { AgentQueue } from './AgentQueue.js';

export class AgentExecutor {
  private provider: LLMProvider;
  private toolRegistry: ToolRegistry;
  private queue: AgentQueue;
  private capabilityTier: CapabilityTier;
  private eventListeners: Set<(event: AgentEvent) => void> = new Set();
  private pendingApprovals: Map<string, HitlApproval> = new Map();

  constructor(config: {
    provider: LLMProvider;
    toolRegistry: ToolRegistry;
    queue: AgentQueue;
    capabilityTier?: CapabilityTier;
  }) {
    this.provider = config.provider;
    this.toolRegistry = config.toolRegistry;
    this.queue = config.queue;
    this.capabilityTier = config.capabilityTier || 'standard';
  }

  setCapabilityTier(tier: CapabilityTier): void {
    this.capabilityTier = tier;
  }

  onEvent(listener: (event: AgentEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private emitEvent(event: AgentEvent): void {
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }

  async executeTask(task: AgentTask, context: string[]): Promise<void> {
    this.queue.enqueue(task);

    while (!this.queue.isEmpty()) {
      const currentTask = this.queue.dequeue();
      if (!currentTask) break;

      this.emitEvent({
        type: 'task-started',
        data: { taskId: currentTask.id },
      });

      try {
        await this.runTask(currentTask, context);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.queue.failTask(currentTask.id, errorMessage);
        this.emitEvent({
          type: 'task-failed',
          data: { taskId: currentTask.id, error: errorMessage },
        });
      }
    }
  }

  private async runTask(task: AgentTask, context: string[]): Promise<void> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a ${task.role} agent. ${task.description}`,
      },
      ...context.map((c) => ({ role: 'user' as const, content: c })),
    ];

    const tools = this.toolRegistry.listTools();

    const request: ChatCompletionRequest = {
      messages,
      model: this.provider.model,
      tools: tools.length > 0 ? tools : undefined,
      stream: true,
    };

    let fullResponse = '';

    const response = await this.provider.chatStream(request, (chunk) => {
      fullResponse += chunk;
      this.emitEvent({
        type: 'message',
        data: {
          taskId: task.id,
          message: {
            id: crypto.randomUUID(),
            taskId: task.id,
            role: 'assistant',
            content: chunk,
            timestamp: Date.now(),
            requiresApproval: false,
          },
        },
      });
    });

    if (response.choices[0]?.message?.toolCalls) {
      for (const toolCall of response.choices[0].message.toolCalls) {
        this.emitEvent({
          type: 'tool-call',
          data: {
            taskId: task.id,
            toolName: toolCall.name,
            args: JSON.parse(toolCall.arguments),
          },
        });

        const toolResult = await this.toolRegistry.executeTool(
          toolCall.name,
          JSON.parse(toolCall.arguments)
        );

        this.emitEvent({
          type: 'tool-result',
          data: {
            taskId: task.id,
            toolName: toolCall.name,
            result: toolResult,
          },
        });

        if (toolResult.success) {
          this.queue.completeTask(task.id, JSON.stringify(toolResult.data));
        } else {
          this.queue.failTask(task.id, toolResult.error || 'Tool execution failed');
        }
      }
    } else {
      this.queue.completeTask(task.id, fullResponse);
    }

    this.emitEvent({
      type: 'task-completed',
      data: { taskId: task.id, result: fullResponse },
    });
  }

  async requestApproval(approval: HitlApproval): Promise<boolean> {
    this.pendingApprovals.set(approval.id, approval);

    this.emitEvent({
      type: 'approval-request',
      data: {
        taskId: approval.taskId,
        approval: {
          id: approval.id,
          action: approval.action,
          diff: approval.diff,
        },
      },
    });

    return new Promise((resolve) => {
      const checkApproval = () => {
        const pending = this.pendingApprovals.get(approval.id);
        if (pending?.status === 'approved') {
          this.pendingApprovals.delete(approval.id);
          resolve(true);
        } else if (pending?.status === 'rejected') {
          this.pendingApprovals.delete(approval.id);
          resolve(false);
        } else {
          setTimeout(checkApproval, 100);
        }
      };
      checkApproval();
    });
  }

  approveApproval(approvalId: string): void {
    const approval = this.pendingApprovals.get(approvalId);
    if (approval) {
      approval.status = 'approved';
    }
  }

  rejectApproval(approvalId: string): void {
    const approval = this.pendingApprovals.get(approvalId);
    if (approval) {
      approval.status = 'rejected';
    }
  }

  cancelTask(taskId: string): boolean {
    return this.queue.cancelTask(taskId);
  }

  getQueue(): AgentQueue {
    return this.queue;
  }
}
