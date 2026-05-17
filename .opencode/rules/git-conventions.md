# Rule: Git Conventions

## Branch Rules

- NEVER commit directly to `main`. All changes go through a feature branch and PR.

## Commit Rules

- NEVER generate commit messages without a Conventional Commits prefix (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`, `breaking:`).
- NEVER stage unrelated changes in the same commit. Each commit is atomic and semantically coherent.

## Commit Message Format

```
<type>(<scope>): <description>

<body explaining WHY, not just WHAT>

Closes #<issue>
```

### Types
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
- `breaking` — Breaking change

### Example
```
feat(knowledge-graph): add co-change edge detection via git log analysis

Adds a new edge type CO_CHANGED that connects symbols frequently modified
together across commits. This enables the ArchitectAgent to suggest
coordinated refactors and helps detect hidden coupling.

Closes #142
```
