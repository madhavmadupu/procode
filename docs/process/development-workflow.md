# Development Workflow

## Git Workflow

### Branch Strategy
```
main ──────────────────────────────────────────────── (protected)
  ├── feat/editor-tabs ────────────────────────── (feature branch)
  ├── feat/ai-chat ────────────────────────────── (feature branch)
  ├── fix/git-blame-crash ─────────────────────── (fix branch)
  ├── chore/update-deps ───────────────────────── (chore branch)
  └── docs/update-architecture ────────────────── (docs branch)
```

### Branch Naming
| Prefix | Use Case | Example |
|--------|----------|---------|
| `feat/` | New features | `feat/knowledge-graph-explorer` |
| `fix/` | Bug fixes | `fix/lsp-server-crash` |
| `chore/` | Maintenance | `chore/update-rust-deps` |
| `docs/` | Documentation | `docs/add-agent-guide` |
| `refactor/` | Code refactoring | `refactor/extract-chunker` |
| `perf/` | Performance improvements | `perf/optimize-hnsw-search` |
| `test/` | Test additions | `test/add-rag-pipeline-tests` |

### Commit Convention (Conventional Commits)
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `style` — Code style (formatting, semicolons, etc.)
- `refactor` — Code refactoring (no feature, no fix)
- `perf` — Performance improvement
- `test` — Adding or fixing tests
- `chore` — Maintenance tasks
- `ci` — CI/CD changes
- `build` — Build system changes

**Examples:**
```
feat(agent): add HITL approval gate for file writes
fix(lsp): handle server crash gracefully
docs(adr): add decision record for HNSW vector search
refactor(rag): extract chunker into separate module
perf(vector): optimize HNSW search for large indices
```

### Pull Request Process
1. Create feature branch from `main`
2. Make changes with conventional commits
3. Push branch to remote
4. Create PR targeting `main`
5. CI runs automatically (lint, test, build, E2E)
6. At least 1 review approval required
7. Squash-merge to keep main history clean
8. Delete branch after merge

### PR Template
```markdown
## Description
What does this PR do?

## Related Issues
- Fixes #123

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Screenshots (if UI changes)
[Before/After screenshots]

## Breaking Changes
- [ ] None
- [ ] Describe breaking changes
```

## Development Environment Setup

### Prerequisites
- Node.js 20+
- pnpm 9+
- Rust 1.75+
- Ollama (for AI features)

### Setup Script
```bash
# Clone repository
git clone https://github.com/procode/procode.git
cd procode

# Install dependencies
pnpm install

# Build Rust native modules
./scripts/build-native.sh

# Set up dev environment (LSP servers, Ollama models)
./scripts/setup-dev.sh

# Start development server
pnpm dev
```

### IDE Recommendations
- **ProCode** (once available) — obviously
- **VS Code** — during early development
- **Recommended extensions:** ESLint, Prettier, rust-analyzer, GitLens

## Daily Workflow

### Morning
1. Pull latest `main`
2. Rebase feature branch on `main`
3. Run `pnpm test` to verify baseline

### During Development
1. Make changes
2. Run `pnpm lint` and `pnpm typecheck` frequently
3. Run relevant tests: `pnpm test --filter=@procode/package-name`
4. Commit with conventional commit messages

### Before Push
1. Run full test suite: `pnpm test`
2. Run lint: `pnpm lint`
3. Run typecheck: `pnpm typecheck`
4. Run Rust tests: `cargo test --workspace`
5. Push and create PR

### Code Review
1. Respond to review comments promptly
2. Make requested changes
3. Re-request review after changes
4. Merge after approval
