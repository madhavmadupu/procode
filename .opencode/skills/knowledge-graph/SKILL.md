# Skill: Knowledge Graph Queries

## When to Use

When the user wants to understand code relationships, dependencies, or impact. Always query the knowledge graph before making non-trivial code changes — never guess relationships.

## Query Patterns

### What does this function call?
```typescript
graph.query({
  startFqn: 'src/agent/AgentRouter.ts::route',
  edgeType: 'CALLS',
  direction: 'outbound',
  depth: 1,
})
```

### What imports this module?
```typescript
graph.query({
  startFqn: 'packages/rag-pipeline/src/index.ts',
  edgeType: 'IMPORTS',
  direction: 'inbound',
  depth: 1,
})
```

### Find all tests that cover this function
```typescript
graph.query({
  startFqn: 'packages/git-engine/src/GitOperations.ts::commit',
  edgeType: 'TESTS',
  direction: 'inbound',
  depth: 2,
})
```

### What changed in the last commit that affects this module?
```typescript
graph.query({
  startFqn: 'packages/knowledge-graph/src/GraphSync.ts',
  edgeType: 'MODIFIED_BY',
  direction: 'outbound',
  limit: 5,
})
```

## Pre-Change Checklist

Before writing any non-trivial code change, ALWAYS:

1. Query the call graph of functions you're modifying
2. Query inbound imports to modules you're changing
3. Check for existing tests that cover the touched code
4. Check for co-changed symbols (may need coordinated update)

## ProCode Context

- TypeScript API: `packages/knowledge-graph/src/GraphClient.ts`
- Rust engine: `native/procode-graph/src/lib.rs`
- Node types: File, Module, Function, Class, Interface, Variable, Type, Constant
- Edge types: CONTAINS, IMPORTS, CALLS, IMPLEMENTS, EXTENDS, EXPORTS, TESTS, DOCUMENTS, DEPENDS_ON, SIMILAR_TO, MODIFIED_BY, CREATED_IN, CO_CHANGED
- In-memory: petgraph (Rust), Persistence: SurrealDB
