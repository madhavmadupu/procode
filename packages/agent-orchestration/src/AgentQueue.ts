import type { AgentTask, AgentTaskStatus } from './types.js';

export class AgentQueue {
  private queue: AgentTask[] = [];
  private currentTask: AgentTask | null = null;
  private maxQueueSize = 100;

  enqueue(task: AgentTask): boolean {
    if (this.queue.length >= this.maxQueueSize) {
      return false;
    }

    task.status = 'pending';
    this.queue.push(task);
    return true;
  }

  dequeue(): AgentTask | null {
    if (this.queue.length === 0) {
      return null;
    }

    const task = this.queue.shift()!;
    task.status = 'running';
    task.startedAt = Date.now();
    this.currentTask = task;
    return task;
  }

  completeTask(taskId: string, result: string): void {
    const task = this.findTask(taskId);
    if (task) {
      task.status = 'completed';
      task.result = result;
      task.completedAt = Date.now();
      if (this.currentTask?.id === taskId) {
        this.currentTask = null;
      }
    }
  }

  failTask(taskId: string, error: string): void {
    const task = this.findTask(taskId);
    if (task) {
      task.status = 'failed';
      task.error = error;
      task.completedAt = Date.now();
      if (this.currentTask?.id === taskId) {
        this.currentTask = null;
      }
    }
  }

  cancelTask(taskId: string): boolean {
    const task = this.findTask(taskId);
    if (!task) return false;

    if (task.status === 'running') {
      task.status = 'cancelled';
      task.completedAt = Date.now();
      if (this.currentTask?.id === taskId) {
        this.currentTask = null;
      }
      return true;
    }

    const index = this.queue.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }

    return false;
  }

  getCurrentTask(): AgentTask | null {
    return this.currentTask;
  }

  getQueue(): AgentTask[] {
    return [...this.queue];
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0 && !this.currentTask;
  }

  private findTask(taskId: string): AgentTask | undefined {
    if (this.currentTask?.id === taskId) {
      return this.currentTask;
    }
    return this.queue.find((t) => t.id === taskId);
  }
}
