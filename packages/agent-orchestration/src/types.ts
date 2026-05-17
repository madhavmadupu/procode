import { z } from 'zod';

export const AgentTaskStatusSchema = z.enum(['pending', 'running', 'blocked', 'completed', 'failed', 'cancelled']);
export type AgentTaskStatus = z.infer<typeof AgentTaskStatusSchema>;

export const CapabilityTierSchema = z.enum(['strict', 'standard', 'auto', 'full']);
export type CapabilityTier = z.infer<typeof CapabilityTierSchema>;

export const AgentCapabilitySchema = z.object({
  name: z.string(),
  tier: CapabilityTierSchema,
  description: z.string(),
});
export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;

export const AgentTaskSchema = z.object({
  id: z.string(),
  role: z.enum(['coder', 'reviewer', 'debugger', 'architect', 'test', 'doc']),
  description: z.string(),
  status: AgentTaskStatusSchema,
  assignedTo: z.string().optional(),
  dependencies: z.array(z.string()),
  createdAt: z.number(),
  startedAt: z.number().optional(),
  completedAt: z.number().optional(),
  result: z.string().optional(),
  error: z.string().optional(),
});
export type AgentTask = z.infer<typeof AgentTaskSchema>;

export const ToolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.string(), z.unknown()),
  requiredCapabilities: z.array(z.string()),
});
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

export const ToolResultSchema = z.object({
  toolName: z.string(),
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});
export type ToolResult = z.infer<typeof ToolResultSchema>;

export const AgentMessageSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  timestamp: z.number(),
  requiresApproval: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type AgentMessage = z.infer<typeof AgentMessageSchema>;

export const AgentEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('task-started'), data: z.object({ taskId: z.string() }) }),
  z.object({ type: z.literal('task-progress'), data: z.object({ taskId: z.string(), message: z.string() }) }),
  z.object({ type: z.literal('tool-call'), data: z.object({ taskId: z.string(), toolName: z.string(), args: z.unknown() }) }),
  z.object({ type: z.literal('tool-result'), data: z.object({ taskId: z.string(), toolName: z.string(), result: ToolResultSchema }) }),
  z.object({ type: z.literal('approval-request'), data: z.object({ taskId: z.string(), approval: z.object({ id: z.string(), action: z.string(), diff: z.string() }) }) }),
  z.object({ type: z.literal('task-completed'), data: z.object({ taskId: z.string(), result: z.string() }) }),
  z.object({ type: z.literal('task-failed'), data: z.object({ taskId: z.string(), error: z.string() }) }),
  z.object({ type: z.literal('message'), data: z.object({ taskId: z.string(), message: AgentMessageSchema }) }),
]);
export type AgentEvent = z.infer<typeof AgentEventSchema>;

export const HitlActionSchema = z.enum(['accept', 'reject', 'accept-all', 'reject-all', 'accept-hunk']);
export type HitlAction = z.infer<typeof HitlActionSchema>;

export const HitlApprovalSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  action: z.string(),
  diff: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.number(),
});
export type HitlApproval = z.infer<typeof HitlApprovalSchema>;
