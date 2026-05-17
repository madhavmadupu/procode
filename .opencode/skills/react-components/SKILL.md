---
name: react-components
description: React component architecture for ProCode — thin components, custom hooks, compound patterns, and state handling
---

# Skill: React Component Architecture

## When to Use

When building React components for ProCode's renderer process (`apps/desktop/src/renderer/`).

## Rules

1. **One file = one public component + its private subcomponents.** Never split a component and its subcomponents across files unless the subcomponent is reused elsewhere.
2. **Props interfaces above the component, named `[ComponentName]Props`.** Exported if the component is exported.
3. **No prop drilling beyond 2 levels.** Use Zustand store slices or React context (for deeply nested, co-located trees only).
4. **Compound component pattern for complex UI.** `<Panel>`, `<Panel.Header>`, `<Panel.Body>`, `<Panel.Footer>`.
5. **`useCallback` only when the callback is a dependency of a `useEffect` or passed to a memoized child.**
6. **`useMemo` only for expensive computations, not to avoid re-renders of simple values.**
7. **Always handle loading, error, and empty states.** No component that fetches data can show only the happy path.

## Examples

```typescript
// ✅ Correct component anatomy
interface AgentTaskCardProps {
  task: AgentTask
  onApprove: (actionId: string) => void
  onReject: (actionId: string) => void
}

export function AgentTaskCard({ task, onApprove, onReject }: AgentTaskCardProps) {
  if (task.status === 'queued') return <TaskCardSkeleton />
  if (task.status === 'failed') return <TaskCardError task={task} />

  return (
    <div className="agent-task-card" data-status={task.status}>
      <TaskCardHeader task={task} />
      <TaskCardSteps steps={task.steps} onApprove={onApprove} onReject={onReject} />
    </div>
  )
}
```

```typescript
// ✅ Thin component, logic in hook
export function FileExplorer() {
  const { tree, expandNode, selectFile } = useFileExplorer()
  return <Tree data={tree} onExpand={expandNode} onSelect={selectFile} />
}

// ✅ Hook owns logic
function useFileExplorer() {
  const workspace = useWorkspaceStore(s => s.rootUri)
  const files = trpc.fs.readDirectory.useQuery({ uri: workspace })
  // ... state and handlers
  return { tree, expandNode, selectFile }
}
```

## ProCode Context

- Components live in `apps/desktop/src/renderer/components/`
- Hooks live in `apps/desktop/src/renderer/hooks/`
- Zustand stores live in `apps/desktop/src/renderer/stores/`
- Use Tailwind CSS for styling, Radix UI for primitives
- No class components, ever
