# User Journeys

## 1. First Launch & Workspace Setup

**Actor:** New user (any persona)  
**Trigger:** Opens ProCode for the first time

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Opens ProCode | Welcome screen with "Open Folder" and "Clone Repository" |
| 2 | Selects project folder | ProCode scans workspace, detects languages |
| 3 | Prompts to install language servers | Shows recommended LSP servers for detected languages |
| 4 | Prompts to set up Ollama | Checks if Ollama is installed, offers guided setup |
| 5 | Indexing begins | Progress bar shows indexing status, editor is usable immediately |
| 6 | Indexing complete | Status bar shows "Indexed: 1,234 files | Graph: 5,678 nodes" |

**Success Criteria:** User can edit code within 5 seconds of opening folder, full indexing completes in background within 30 seconds for 100k-line codebase.

---

## 2. AI-Assisted Code Generation

**Actor:** Alex (Senior Developer)  
**Trigger:** Needs to implement a new feature

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Opens AI Chat panel (`Ctrl+L`) | Chat panel opens with codebase context loaded |
| 2 | Types: "Add rate limiting middleware to the auth router" | Intent classifier routes to ArchitectAgent for planning |
| 3 | ArchitectAgent analyzes existing auth patterns | Queries knowledge graph for middleware patterns, existing auth files |
| 4 | Returns implementation plan | Shows plan with files to modify, new files to create |
| 5 | User approves plan | CoderAgent takes over, generates code |
| 6 | CoderAgent proposes file changes | Diff viewer shows proposed changes |
| 7 | User reviews and accepts changes | Files are written, Git stage updated |
| 8 | ReviewerAgent auto-reviews changes | Flags any issues, suggests improvements |
| 9 | User makes final adjustments | Commits changes via Source Control panel |

**Success Criteria:** Feature implemented in under 5 minutes with full codebase context, user maintains full control via HITL gates.

---

## 3. Debugging a Production Issue

**Actor:** Jordan (DevOps Engineer)  
**Trigger:** Production error report with stack trace

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Pastes stack trace into AI Chat | DebuggerAgent analyzes stack trace |
| 2 | Queries knowledge graph for error location | Finds relevant files, call graph, recent changes |
| 3 | DebuggerAgent identifies likely cause | "Error originates from line 47 in auth.ts — null check missing" |
| 4 | User opens file at error location | Monaco editor navigates to file, highlights line |
| 5 | DebuggerAgent suggests fix | Shows proposed code change with explanation |
| 6 | User accepts fix | File updated, test suite runs automatically |
| 7 | TestAgent generates regression test | Proposes test case to prevent future occurrence |
| 8 | User reviews and commits | Changes committed with descriptive message |

**Success Criteria:** Root cause identified in under 2 minutes, fix proposed with regression test.

---

## 4. Onboarding to a New Codebase

**Actor:** Sam (Junior Developer)  
**Trigger:** First day on a new project

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Opens project in ProCode | Indexing begins, editor usable immediately |
| 2 | Opens Knowledge Graph Explorer | Visual graph shows codebase structure |
| 3 | Filters to show only top-level modules | Sees 8 main modules with relationships |
| 4 | Clicks on "auth" module | Subgraph expands: 12 files, 34 functions, dependencies |
| 5 | Selects a function, clicks "Explain Code" | Plain-English explanation appears |
| 6 | Uses `@symbol` mention in AI Chat | Asks "How does the auth flow work?" |
| 7 | AI responds with full flow explanation | References actual files, functions, data flow |
| 8 | Makes first code change with AI assistance | Inline AI catches issues, suggests improvements |

**Success Criteria:** Junior developer understands codebase structure within 30 minutes, makes first contribution within 2 hours.

---

## 5. Code Review Workflow

**Actor:** Maya (Tech Lead)  
**Trigger:** Pull request needs review

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Opens PR branch in ProCode | Git panel shows changed files |
| 2 | ReviewerAgent auto-analyzes changes | Flags: potential null pointer, missing error handling, style inconsistency |
| 3 | Maya reviews AI findings | Agrees with 3 of 4 flags, dismisses 1 |
| 4 | Checks knowledge graph for impact | Graph shows 4 downstream consumers of changed function |
| 5 | Reviews diff in detail | Uses diff editor with AI explanations for complex changes |
| 6 | Approves PR with comments | Comments include AI-generated suggestions |

**Success Criteria:** Code review completed in under 10 minutes with comprehensive coverage, including impact analysis.

---

## 6. Refactoring a Legacy Module

**Actor:** Alex (Senior Developer)  
**Trigger:** Needs to refactor a tightly-coupled module

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Queries knowledge graph for module dependencies | Graph shows 23 files depend on the module |
| 2 | Uses "Find All References" across codebase | Lists all call sites, imports, implementations |
| 3 | Asks ArchitectAgent for refactoring plan | Returns step-by-step plan with risk assessment |
| 4 | Spawns CoderAgent for incremental changes | Each change goes through HITL approval |
| 5 | TestAgent validates after each change | Runs test suite, reports pass/fail |
| 6 | ReviewerAgent checks final state | Confirms no regressions, improved modularity metrics |

**Success Criteria:** Refactoring completed with zero regressions, all tests passing, improved modularity scores.
