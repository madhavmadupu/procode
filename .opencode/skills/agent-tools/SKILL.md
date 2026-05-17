---
name: agent-tools
description: Agent tool discipline for ProCode — ReadFile, SearchCode, GraphQuery, WriteFile, RunTerminal with completion checklist
---

# Skill: Agent Tool Use

## When to Use

When executing tasks as an agent inside ProCode. You have access to tools — use them with discipline.

## Available Tools

### ReadFile
Always read before you write. Never assume file contents.
```
ReadFile: src/agent/AgentRouter.ts
// Then reason about what you read before proposing changes.
```

### SearchCode
Use semantic search before reading files you haven't seen.
```
SearchCode: "how does the workspace root path get resolved"
// Use results to find the RIGHT file before opening it.
```

### GraphQuery
Use the knowledge graph to understand impact before editing.
```
GraphQuery: CALLS inbound to packages/lsp-host/src/LanguageClient.ts::start
// Know who depends on what you're changing.
```

### WriteFile
Only write files after you have read all relevant context. Never write a file blind.

### RunTerminal
Use for: running tests, type-checking, linting, build verification. NEVER for destructive operations without explicit confirmation.
```
RunTerminal: pnpm --filter @procode/git-engine test --run
// Always verify your changes pass tests before reporting done.
```

## Task Completion Checklist

Before reporting a task as done:

- [ ] Did I read all files I touched before writing them?
- [ ] Did I check the knowledge graph for callers/importers of changed code?
- [ ] Did I run `tsc --noEmit` (or `cargo check`) to verify types?
- [ ] Did I run the relevant tests?
- [ ] Did I check for similar existing utilities before creating new ones?
- [ ] Is every new function under 60 lines?
- [ ] Does every new file have the correct package imports (not `../../../`)?
