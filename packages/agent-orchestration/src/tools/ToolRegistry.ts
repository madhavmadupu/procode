import type { ToolDefinition, ToolResult } from '../types.js';

type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

export class ToolRegistry {
  private tools: Map<string, { definition: ToolDefinition; handler: ToolHandler }> = new Map();

  register(definition: ToolDefinition, handler: ToolHandler): void {
    this.tools.set(definition.name, { definition, handler });
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  getTool(name: string): { definition: ToolDefinition; handler: ToolHandler } | undefined {
    return this.tools.get(name);
  }

  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  async executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        toolName: name,
        success: false,
        error: `Tool "${name}" not found`,
      };
    }

    try {
      const result = await tool.handler(args);
      return {
        toolName: name,
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        toolName: name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }
}
