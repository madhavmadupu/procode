# Code Review Guidelines

## Philosophy

Code reviews are about **quality, knowledge sharing, and consistency** — not gatekeeping. Every review should leave the codebase better than it was found.

## Review Checklist

### Correctness
- [ ] Does the code do what the PR description says?
- [ ] Are edge cases handled?
- [ ] Are error cases handled gracefully?
- [ ] Are there any obvious bugs or logic errors?

### Architecture
- [ ] Does this follow the established architecture patterns?
- [ ] Is the code in the right package/module?
- [ ] Are dependencies appropriate (no circular deps)?
- [ ] Does this introduce unnecessary complexity?

### Performance
- [ ] Are there any obvious performance issues?
- [ ] Is async/await used correctly?
- [ ] Are expensive operations off the main thread?
- [ ] Is caching used appropriately?

### Security
- [ ] Are inputs validated (Zod schemas for IPC)?
- [ ] Are there any security vulnerabilities?
- [ ] Does this follow the process isolation model?
- [ ] Are agent operations going through HITL gates?

### Testing
- [ ] Are there tests for the new functionality?
- [ ] Do tests cover edge cases?
- [ ] Are tests readable and maintainable?
- [ ] Does CI pass?

### Code Quality
- [ ] Is the code readable and well-organized?
- [ ] Are variable/function names descriptive?
- [ ] Are there any `any` types (should use `unknown`)?
- [ ] Are there any `unsafe` blocks without `// SAFETY:` comments?
- [ ] Does this follow TypeScript strict mode?
- [ ] Does this pass Clippy (`#![deny(clippy::all)]`)?

### Documentation
- [ ] Are public APIs documented?
- [ ] Are complex algorithms explained?
- [ ] Is there a `// SAFETY:` comment for every `unsafe` block?
- [ ] Are Rust public APIs documented with `///` doc comments?

## Review Response Times

| Priority | Response Time | Examples |
|----------|--------------|----------|
| Urgent (hotfix) | 1 hour | Production bug, security issue |
| High | 4 hours | Blocked feature, release blocker |
| Normal | 24 hours | Standard feature, bug fix |
| Low | 48 hours | Documentation, refactoring |

## Review Comments

### Types of Comments
- **Nit** — Minor suggestion, not blocking (e.g., naming, formatting)
- **Suggestion** — Improvement recommendation, discuss but not blocking
- **Question** — Seeking clarification, not necessarily a problem
- **Blocking** — Must be addressed before merge

### Comment Tone
- Be constructive, not critical
- Explain why, not just what
- Use questions for uncertain feedback
- Acknowledge good patterns

**Good:**
> "Consider extracting this into a separate function — it would make the error handling clearer and easier to test."

**Bad:**
> "This function is too long."

### Resolving Comments
- Author resolves comment after addressing it
- Reviewer resolves comment if satisfied with response
- Unresolved blocking comments prevent merge

## Self-Review Before Requesting Review

Before requesting a review, the author should:

1. Read through their own diff
2. Check for typos, debug code, console.logs
3. Verify tests pass locally
4. Ensure PR description is clear
5. Add screenshots for UI changes
6. Link related issues

## Reviewer Assignment

### Rust Code
- At least one reviewer with Rust experience
- Focus on: memory safety, error handling, performance

### TypeScript Code
- At least one reviewer familiar with the package
- Focus on: type safety, architecture, testing

### UI Components
- At least one reviewer with React/Tailwind experience
- Focus on: accessibility, responsiveness, design system compliance

### Native Modules (NAPI-RS)
- At least one reviewer with NAPI-RS experience
- Focus on: type conversions, memory management, cross-platform compatibility

## Merge Requirements

- [ ] CI passes (lint, test, build, E2E, benchmarks)
- [ ] At least 1 approval
- [ ] No unresolved blocking comments
- [ ] PR description is complete
- [ ] No merge conflicts with main
- [ ] Squash-merge (not regular merge)
