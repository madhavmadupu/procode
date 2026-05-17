# Rule: Testing Standards

## Absolute Rules

- NEVER write code that cannot be tested. If something is hard to test, refactor it first.
- NEVER mock what you can fake. Prefer in-memory fakes over `jest.mock()` call-site mocks.
- NEVER write a test that tests implementation details. Test behavior and contracts.

## Coverage Requirements

| Package Type | Minimum | Enforced in CI |
|-------------|---------|----------------|
| Core packages (editor-core, knowledge-graph, rag-pipeline, agent-orchestration) | 70% | Yes |
| UI components | 60% | Yes |
| Utility packages | 80% | Yes |
| Rust native modules | 80% | Yes |

## Test Organization

- Unit tests: colocated with source (`*.test.ts`, `*.spec.ts`)
- Integration tests: `/tests/integration/`
- E2E tests: `/tests/e2e/` with Playwright
- Rust tests: inline `#[cfg(test)]` modules and `tests/` directory

## Frameworks

- TypeScript: Vitest + Testing Library
- Rust: `cargo test`
- E2E: Playwright
