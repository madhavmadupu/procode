export type AgentRole = "coder" | "reviewer" | "debugger" | "architect" | "test" | "doc";

export interface AgentTask {
  id: string;
  role: AgentRole;
  description: string;
  status: "pending" | "running" | "blocked" | "completed" | "failed";
  assignedTo?: string;
  dependencies: string[];
}

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: number;
  requiresApproval: boolean;
}
