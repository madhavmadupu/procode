---
name: git-operations
description: Git operations for ProCode — conventional commits, atomic changes, diff-before-commit, and branch conventions
---

# Skill: Git Operations

## When to Use

When performing git operations on behalf of the user.

## Rules

1. **Always show a diff summary before committing.** Never commit silently.
2. **Use `git add -p` semantics** — commit only logically related changes together.
3. **Write commit messages that explain WHY, not just WHAT.**
4. **Conventional Commits format, always.**
5. **For complex changes, propose an atomic commit sequence** before executing it. Let the user review the plan.

## Commit Message Format

```
<type>(<scope>): <description>

<body explaining WHY, not just WHAT>

Closes #<issue>
```

### Example
```
feat(knowledge-graph): add co-change edge detection via git log analysis

Adds a new edge type CO_CHANGED that connects symbols frequently modified
together across commits. This enables the ArchitectAgent to suggest
coordinated refactors and helps detect hidden coupling.

Closes #142
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

## ProCode Rules

- NEVER commit directly to `main`
- NEVER stage unrelated changes in the same commit
- Each commit is atomic and semantically coherent
