---
name: testing
description: Testing standards for ProCode — unit/integration/E2E pyramid, coverage thresholds, and test organization
---

# Skill: Writing Tests

## When to Use

When writing tests for any ProCode feature. Every feature must have tests.

## Testing Pyramid

### Unit Tests (`*.test.ts`)
Test one function/class in isolation. Colocated with source.

```typescript
// packages/rag-pipeline/src/Chunker.test.ts
describe('Chunker', () => {
  describe('chunkByFunction', () => {
    it('produces one chunk per top-level function', () => {
      const src = `
        function foo() { return 1 }
        function bar() { return 2 }
      `
      const chunks = chunkByFunction(src, 'ts')
      expect(chunks).toHaveLength(2)
      expect(chunks[0].symbolName).toBe('foo')
      expect(chunks[1].symbolName).toBe('bar')
    })

    it('handles arrow functions assigned to const', () => { ... })
    it('handles class methods as separate chunks', () => { ... })
  })
})
```

### Integration Tests (`tests/integration/`)
Test package interactions.

```typescript
// tests/integration/rag-indexing.test.ts
it('indexes a TypeScript file and makes it searchable via hybrid search', async () => {
  const workspace = await TestWorkspace.create()
  await workspace.writeFile('src/utils.ts', sampleTypeScriptCode)
  await indexer.indexWorkspace(workspace.root)
  
  const results = await retriever.retrieve('utility function for date formatting')
  expect(results.some(r => r.fileUri.endsWith('utils.ts'))).toBe(true)
})
```

### E2E Tests (`tests/e2e/`)
Test user-visible behavior with Playwright.

```typescript
// tests/e2e/git-panel.spec.ts
test('shows modified files after editing a file', async ({ page, workspace }) => {
  await workspace.editFile('src/index.ts', '// changed')
  await page.getByRole('tab', { name: 'Source Control' }).click()
  await expect(page.getByText('src/index.ts')).toBeVisible()
  await expect(page.getByTestId('file-status-modified')).toBeVisible()
})
```

## Rules

- NEVER write code that cannot be tested. If something is hard to test, refactor it first.
- NEVER mock what you can fake. Prefer in-memory fakes over `jest.mock()` call-site mocks.
- NEVER write a test that tests implementation details. Test behavior and contracts.

## Coverage Requirements

| Package Type | Minimum Coverage |
|-------------|-----------------|
| Core packages | 70% |
| UI components | 60% |
| Utility packages | 80% |
| Rust native modules | 80% |

## ProCode Context

- Framework: Vitest (TypeScript), `cargo test` (Rust), Playwright (E2E)
- Test fixtures: `/tests/fixtures/` (small, medium, large workspaces)
- CI enforces coverage thresholds — blocks merge if below minimum
