# Testing Strategy

## Overview

ProCode uses a multi-layered testing approach: unit tests, integration tests, and E2E tests, with minimum 70% line coverage enforced in CI on core packages.

## Test Pyramid

```
        ┌─────────┐
        │  E2E    │  ~10% of tests — critical user flows
        ├─────────┤
        │Integration│ ~20% of tests — cross-package interactions
        ├─────────┤
        │  Unit   │  ~70% of tests — individual functions, classes
        └─────────┘
```

## Unit Tests

### Location
- Colocated with source: `*.test.ts`, `*.spec.ts`
- Rust tests: inline `#[cfg(test)]` modules and `tests/` directory

### Framework
- **TypeScript:** Vitest
- **Rust:** Built-in `cargo test`
- **React Components:** Vitest + Testing Library

### Coverage Requirements
- Core packages (editor-core, knowledge-graph, rag-pipeline, agent-orchestration): 70% minimum
- UI components: 60% minimum
- Utility packages: 80% minimum
- Rust native modules: 80% minimum

### Example
```typescript
// packages/rag-pipeline/src/Chunker.test.ts
import { describe, it, expect } from 'vitest';
import { chunkByFunction } from './Chunker';

describe('chunkByFunction', () => {
  it('splits TypeScript file into function-level chunks', () => {
    const source = `
      function foo() { return 1; }
      function bar() { return 2; }
    `;
    const chunks = chunkByFunction(source, 'typescript');
    expect(chunks).toHaveLength(2);
    expect(chunks[0].symbolName).toBe('foo');
    expect(chunks[1].symbolName).toBe('bar');
  });

  it('handles nested functions', () => {
    // ...
  });
});
```

## Integration Tests

### Location
- `/tests/integration/`

### Scope
- Cross-package interactions
- NAPI-RS bridge between TypeScript and Rust
- IPC communication between main and renderer
- LSP host communication with language servers
- RAG pipeline end-to-end (chunking → embedding → search → reranking)

### Example
```typescript
// tests/integration/rag-pipeline.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { Chunker } from '@procode/rag-pipeline';
import { Embedder } from '@procode/rag-pipeline';
import { Retriever } from '@procode/rag-pipeline';

describe('RAG Pipeline Integration', () => {
  let retriever: Retriever;

  beforeAll(async () => {
    const chunker = new Chunker();
    const embedder = new Embedder();
    retriever = new Retriever(chunker, embedder);
    await retriever.indexWorkspace('/path/to/test-fixture');
  });

  it('retrieves relevant chunks for a query', async () => {
    const results = await retriever.search('authentication middleware');
    expect(results).toHaveLength(10);
    expect(results[0].content).toContain('middleware');
  });
});
```

## E2E Tests

### Location
- `/tests/e2e/`

### Framework
- Playwright

### Scope
- Critical user flows
- Cross-platform compatibility (macOS, Windows, Linux)
- Performance benchmarks

### Test Flows
1. **App Launch** — Open app, load workspace, editor renders
2. **File Editing** — Open file, type, save, verify content
3. **Git Workflow** — Make changes, stage, commit, verify
4. **AI Chat** — Open chat, send message, receive response
5. **Agent Task** — Spawn agent, approve action, verify file change
6. **Knowledge Graph** — Open explorer, query graph, navigate to file

### Example
```typescript
// tests/e2e/editor.spec.ts
import { test, expect } from '@playwright/test';

test('can open file and edit', async ({ page }) => {
  await page.goto('file:///path/to/workspace');

  // Open file via command palette
  await page.keyboard.press('Control+P');
  await page.locator('[data-testid="command-palette-input"]').fill('src/index.ts');
  await page.keyboard.press('Enter');

  // Verify file content is displayed
  await expect(page.locator('.monaco-editor')).toContainText('export');

  // Type in editor
  await page.locator('.monaco-editor textarea').focus();
  await page.keyboard.type('// New comment');

  // Save file
  await page.keyboard.press('Control+S');

  // Verify dirty state cleared
  await expect(page.locator('[data-testid="tab-dirty"]')).not.toBeVisible();
});
```

## Rust Tests

### Unit Tests
```rust
// native/procode-graph/src/graph.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_upsert_node() {
        let mut graph = KnowledgeGraph::new();
        let node = KGNode {
            id: "test".to_string(),
            node_type: NodeType::Function,
            name: "test_func".to_string(),
            // ...
        };
        let id = graph.upsert_node(node);
        assert_eq!(graph.node_count(), 1);
    }

    #[test]
    fn test_query_returns_results() {
        // ...
    }
}
```

### Integration Tests
```rust
// native/procode-graph/tests/graph_integration.rs
#[test]
fn test_full_indexing_pipeline() {
    let mut graph = KnowledgeGraph::new();
    // Index test fixture, verify node/edge counts
}
```

## CI Configuration

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: ./scripts/build-native.sh
      - run: pnpm test
      - run: cargo test --workspace
      - run: pnpm e2e
      - name: Coverage
        run: pnpm coverage
      - name: Check coverage threshold
        run: pnpm coverage:check
```

## Snapshot Testing

UI components use snapshot testing for visual regression:

```typescript
// apps/desktop/src/renderer/components/chat/ChatMessage.test.tsx
import { render } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';

it('renders user message correctly', () => {
  const { container } = render(
    <ChatMessage role="user" content="Hello world" />
  );
  expect(container).toMatchSnapshot();
});
```

## Test Fixtures

`/tests/fixtures/` contains sample workspaces for testing:
- `small-workspace/` — 10 files, single language
- `medium-workspace/` — 100 files, multi-language
- `large-workspace/` — 1,000 files, performance testing
- `monorepo/` — Multi-root workspace with packages
