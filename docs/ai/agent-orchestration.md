# Agent Orchestration

## Overview

ProCode's agent system is a stateful multi-agent graph inspired by LangGraph. Agents are specialized nodes; the orchestrator routes tasks through them based on intent classification.

## Agent Definitions

| Agent | Specialty | Key Tools |
|-------|-----------|-----------|
| **ArchitectAgent** | System design, refactoring plans, dependency analysis | GraphQuery, ReadFile, SearchCode |
| **CoderAgent** | Code generation, implementation, bug fixes | ReadFile, WriteFile, RunTerminal |
| **ReviewerAgent** | Code review, security analysis, best practices | ReadFile, GraphQuery, SearchCode |
| **DebuggerAgent** | Error analysis, stack trace interpretation, fix generation | ReadFile, WriteFile, RunTerminal, GraphQuery |
| **TestAgent** | Unit/integration test generation, test execution | ReadFile, WriteFile, RunTerminal |
| **DocAgent** | JSDoc, README, ADR, changelog generation | ReadFile, WriteFile, GraphQuery |

## Orchestration Flow

```
User Task (natural language)
        ↓
  Intent Classifier
  (classify: code_gen / review / debug / test / doc / architect)
        ↓
  Task Planner
  (decompose into ordered sub-tasks)
        ↓
  Agent Router
  ┌─────┬─────┬──────┬─────────┬──────┐
  │Arch │Code │Review│Debugger │Test  │
  └─────┴─────┴──────┴─────────┴──────┘
        ↓
  Human-in-the-Loop Gate
  (show proposed file writes → user approves/rejects)
        ↓
  Tool Execution
        ↓
  Result Synthesis
        ↓
  Response to User
```

## Intent Classifier

Classifies user intent to route to the appropriate agent:

```typescript
interface IntentClassification {
  type: 'code_gen' | 'review' | 'debug' | 'test' | 'doc' | 'architect';
  confidence: number;
  extractedEntities: {
    files?: string[];
    symbols?: string[];
    languages?: string[];
  };
}

class IntentClassifier {
  async classify(input: string): Promise<IntentClassification> {
    // Uses lightweight local model for classification
    // Keywords, patterns, and context from active file
    // Returns intent type with confidence score
  }
}
```

### Classification Heuristics
- "create", "implement", "add", "write" → `code_gen`
- "review", "check", "analyze", "improve" → `review`
- "fix", "error", "bug", "debug", "why is" → `debug`
- "test", "spec", "coverage" → `test`
- "document", "docstring", "README", "explain" → `doc`
- "design", "architect", "refactor", "structure" → `architect`

## Task Planner

Decomposes user intent into ordered sub-tasks:

```typescript
interface TaskStep {
  id: string;
  description: string;
  agentType: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  requiresApproval: boolean;
}

interface TaskPlan {
  id: string;
  description: string;
  steps: TaskStep[];
  createdAt: number;
}

class TaskPlanner {
  async plan(intent: IntentClassification, context: Context): Promise<TaskPlan> {
    // Uses LLM to decompose intent into steps
    // Each step assigned to appropriate agent
    // Steps ordered by dependencies
  }
}
```

### Example Plan
```
User: "Add rate limiting middleware to the auth router"

Plan:
1. [ArchitectAgent] Analyze existing auth patterns → Done
2. [CoderAgent] Read existing auth files → Done
3. [CoderAgent] Query graph for middleware patterns → Done
4. [CoderAgent] Generate middleware.ts → Done
5. [HITL] Review proposed changes → Pending approval
6. [CoderAgent] Write middleware.ts → Pending
7. [ReviewerAgent] Review new code → Pending
8. [TestAgent] Generate tests for middleware → Pending
```

## Agent Tools

### Available Tools

| Tool | Description | Requires Approval |
|------|-------------|-------------------|
| **ReadFile** | Read file content | No |
| **WriteFile** | Write/modify file | Yes |
| **SearchCode** | Search workspace for patterns | No |
| **RunTerminal** | Execute terminal command | Yes |
| **GitTool** | Git operations (status, diff, log) | No |
| **GraphQueryTool** | Query knowledge graph | No |

### Tool Interface

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
  execute(input: Record<string, unknown>): Promise<ToolResult>;
}

interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  requiresApproval?: boolean;
  preview?: string;  // Diff preview for write operations
}
```

## Human-in-the-Loop (HITL)

All file write and terminal command operations go through an approval gate:

```
Agent wants to write: src/auth/middleware.ts
┌────────────────────────────────────────┐
│  Agent proposes the following change:  │
│                                        │
│  [diff viewer shows proposed change]   │
│                                        │
│  [Accept]  [Reject]  [Edit & Accept]  │
└────────────────────────────────────────┘
```

### Trust Levels

Users can configure trust levels per agent:

```typescript
interface TrustConfig {
  agentType: string;
  readOps: 'auto' | 'notify' | 'approve';
  writeOps: 'auto' | 'notify' | 'approve';
  terminalOps: 'auto' | 'notify' | 'approve';
  safeCommands?: string[];    // Auto-approve list
  blockedCommands?: string[]; // Always block
}
```

## Agent Memory

### Short-Term Memory
Current task context, cleared after task completion:

```typescript
interface ShortTermMemory {
  taskDescription: string;
  toolCallHistory: ToolCall[];
  intermediateResults: string[];
  currentPlan: TaskStep[];
}
```

### Long-Term Memory
Persisted across sessions in SQLite:

```typescript
interface LongTermMemory {
  workspaceInsights: Insight[];      // "This project uses Repository pattern"
  userPreferences: Preference[];     // "User prefers functional style"
  recentDecisions: Decision[];       // "Decided to use SurrealDB for graph"
}
```

## Agent Panel UI

```
┌─ Agent Tasks ───────────────────────────────┐
│ ● Add authentication middleware              │
│   Status: Running (CoderAgent)              │
│   ├─ ✓ Read existing auth files             │
│   ├─ ✓ Query graph for middleware patterns  │
│   ├─ ⟳ Generating middleware.ts ...        │
│   └─ ○ Write file (pending approval)        │
│                                             │
│ ○ Write unit tests for UserService          │
│   Status: Queued                            │
└─────────────────────────────────────────────┘
```

## State Machine

Agent orchestration follows a state machine pattern:

```
IDLE → PLANNING → EXECUTING → AWAITING_APPROVAL → EXECUTING → SYNTHESIZING → DONE
                              ↓
                          REJECTED → IDLE
```

### State Transitions
- `IDLE → PLANNING`: User submits task
- `PLANNING → EXECUTING`: Plan approved by user
- `EXECUTING → AWAITING_APPROVAL`: Agent proposes file write
- `AWAITING_APPROVAL → EXECUTING`: User approves
- `AWAITING_APPROVAL → IDLE`: User rejects
- `EXECUTING → SYNTHESIZING`: All steps complete
- `SYNTHESIZING → DONE`: Response assembled
