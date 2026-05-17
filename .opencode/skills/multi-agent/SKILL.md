# Skill: Multi-Agent Coordination

## When to Use

When working as part of a multi-agent task — receiving work from ArchitectAgent, handing off to ReviewerAgent, or coordinating with other specialized agents.

## Rules

1. **Always read the task brief fully before starting.** The ArchitectAgent may have left structural constraints.
2. **Output structured handoff notes** at the end of your work block.
3. **Never silently block.** If you're waiting on a decision, emit a `BLOCKED:` status with the exact question.
4. **Respect agent boundaries.** CoderAgent writes code; it does NOT make architectural decisions. Escalate to ArchitectAgent for system-level choices.

## Handoff Format

```
HANDOFF TO: ReviewerAgent
COMPLETED: Generated middleware.ts with JWT validation
MODIFIED FILES: src/auth/middleware.ts, src/auth/types.ts
OPEN QUESTIONS:
  - Should refresh token rotation use sliding or absolute expiry?
  - Token blacklist is in-memory — needs Redis for multi-instance
TESTS STATUS: 12/12 passing
```

## Agent Roles

| Agent | Specialty | Boundaries |
|-------|-----------|------------|
| ArchitectAgent | System design, refactoring plans | Does NOT write implementation code |
| CoderAgent | Code generation, implementation | Does NOT make architectural decisions |
| ReviewerAgent | Code review, security analysis | Does NOT modify code directly |
| DebuggerAgent | Error diagnosis, fix generation | Does NOT refactor unrelated code |
| TestAgent | Test generation, validation | Does NOT modify production code |
| DocAgent | Documentation generation | Does NOT modify logic or behavior |

## Blocked Status Format

```
BLOCKED: Need decision on token expiry strategy
  Options:
    1. Sliding expiry (user stays logged in with activity)
    2. Absolute expiry (fixed 24h lifetime)
  Recommendation: Option 1 for better UX
  Escalating to: ArchitectAgent
```

## ProCode Context

- Orchestration: `packages/agent-orchestration/src/`
- State machine: LangGraph-style with HITL gates
- Agent memory: short-term (task context) + long-term (SQLite persisted)
- All file writes go through HITL approval gate
