---
name: typescript-types
description: TypeScript type design for ProCode — domain modeling, discriminated unions, branded types, and satisfies patterns
---

# Skill: TypeScript Type Design

## When to Use

When writing TypeScript types, interfaces, type aliases, or discriminated unions for the ProCode codebase.

## Rules

1. **Model the domain, not the data shape.** Types should express what something IS, not just what fields it has.
2. **Use discriminated unions for state machines.** If a thing can be in multiple states, model them all explicitly.
3. **Prefer interfaces for object shapes that will be implemented.** Prefer type aliases for unions, intersections, and computed types.
4. **Use branded types for IDs.** Never use `string` for a file URI, node ID, or commit hash.
5. **Use `satisfies` for config objects.** Lets you get inference while still checking against the type.
6. **Use `const` assertions for exhaustive checks.**

## Examples

```typescript
// ✅ Model a file's edit state as a discriminated union
type FileState =
  | { status: 'clean'; uri: FileUri }
  | { status: 'modified'; uri: FileUri; pendingChanges: Change[] }
  | { status: 'conflict'; uri: FileUri; conflicts: MergeConflict[] }
  | { status: 'saving'; uri: FileUri; pendingChanges: Change[] }

// ❌ Never do this — boolean soup with any
type FileState = {
  uri: string
  modified: boolean
  conflict: boolean
  saving: boolean
  pendingChanges?: any[]
}
```

```typescript
// ✅ Branded types for IDs
type FileUri = string & { readonly _brand: 'FileUri' }
type NodeId = string & { readonly _brand: 'NodeId' }
type CommitHash = string & { readonly _brand: 'CommitHash' }

// ✅ satisfies for config objects
const defaultSettings = {
  autoSave: true,
  fontSize: 14,
  theme: 'dark',
} satisfies ProCodeSettings;
```

## ProCode Context

- All types live in `packages/types/src/` and are exported via `package.json#exports`
- Use `never` for exhaustive switch checks
- No `any` anywhere — use `unknown` with type guards
