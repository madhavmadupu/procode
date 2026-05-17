# Rule: IPC Pattern

Every cross-process operation between renderer and main process follows this exact pattern:

## 1. Define Types (Shared)

Define in `packages/types/` — shared between renderer and main:

```typescript
export interface ReadFileRequest { uri: string }
export interface ReadFileResponse { content: string; encoding: string }
```

## 2. Implement Handler (Main Process)

Implement in `apps/desktop/src/main/ipc/` — always validate input with Zod:

```typescript
const readFileHandler = t.procedure
  .input(z.object({ uri: z.string().url() }))
  .query(async ({ input }) => {
    return fileSystemService.readFile(input.uri)
  })
```

## 3. Consume (Renderer)

Consume via tRPC client in renderer:

```typescript
const { data, isLoading } = trpc.fs.readFile.useQuery({ uri })
```

## Rules

- All IPC is typed end-to-end via tRPC
- Zod validation on ALL inputs in IPC handlers
- NEVER bypass IPC by importing main-process modules into renderer
- Network requests and file system operations ONLY in main process
- Renderer is sandboxed: contextIsolation: true, nodeIntegration: false
