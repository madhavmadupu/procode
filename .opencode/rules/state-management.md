# Rule: State Management Pattern

## Zustand Slice Pattern

One store per domain. Packages own types, renderer owns stores.

```typescript
// ✅ Correct — slice pattern with subscribeWithSelector
const useEditorStore = create<EditorState>()(
  subscribeWithSelector((set, get) => ({
    openFiles: [],
    activeUri: null,
    openFile: (uri: string) => set(state => ({
      openFiles: [...state.openFiles.filter(f => f.uri !== uri), { uri }],
      activeUri: uri,
    })),
  }))
)
```

## Rules

- One store per domain: `editor.store.ts`, `workspace.store.ts`, `git.store.ts`, `agent.store.ts`, `settings.store.ts`
- NO barrel exports from stores
- NO god stores — each store owns one domain
- Types defined in packages, stores defined in renderer
- Use `subscribeWithSelector` middleware for selective subscriptions
- No immer unless dealing with complex nested state updates

## Store Locations

- `apps/desktop/src/renderer/stores/editor.store.ts`
- `apps/desktop/src/renderer/stores/workspace.store.ts`
- `apps/desktop/src/renderer/stores/git.store.ts`
- `apps/desktop/src/renderer/stores/agent.store.ts`
- `apps/desktop/src/renderer/stores/settings.store.ts`

## Anti-Patterns

```typescript
// ❌ Wrong — god store with everything
const useStore = create({ editor: {}, git: {}, agent: {}, settings: {} })

// ❌ Wrong — barrel exports from stores
export * from './editor.store'
export * from './git.store'

// ❌ Wrong — immer for simple state
const useStore = create()(immer((set) => ({ ... })))
```
