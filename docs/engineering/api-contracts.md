# API Contracts

## IPC API (tRPC over Electron IPC)

### File System Router
```typescript
const fsRouter = t.router({
  readFile: t.procedure
    .input(z.object({ uri: z.string() }))
    .query(async ({ input }) => { ... }),

  writeFile: t.procedure
    .input(z.object({ uri: z.string(), content: z.string() }))
    .mutation(async ({ input }) => { ... }),

  readDirectory: t.procedure
    .input(z.object({ uri: z.string() }))
    .query(async ({ input }) => { ... }),

  stat: t.procedure
    .input(z.object({ uri: z.string() }))
    .query(async ({ input }) => { ... }),

  watch: t.procedure
    .input(z.object({ uri: z.string(), options: watchOptionsSchema }))
    .subscription(async ({ input }) => { ... }),
});
```

### Git Router
```typescript
const gitRouter = t.router({
  status: t.procedure.query(async () => { ... }),

  diff: t.procedure
    .input(z.object({ uri: z.string() }))
    .query(async ({ input }) => { ... }),

  stage: t.procedure
    .input(z.object({ uris: z.array(z.string()) }))
    .mutation(async ({ input }) => { ... }),

  unstage: t.procedure
    .input(z.object({ uris: z.array(z.string()) }))
    .mutation(async ({ input }) => { ... }),

  commit: t.procedure
    .input(z.object({ message: z.string(), amend: z.boolean().optional() }))
    .mutation(async ({ input }) => { ... }),

  branches: t.procedure.query(async () => { ... }),

  checkout: t.procedure
    .input(z.object({ branch: z.string() }))
    .mutation(async ({ input }) => { ... }),

  log: t.procedure
    .input(z.object({ limit: z.number(), uri: z.string().optional() }))
    .query(async ({ input }) => { ... }),

  blame: t.procedure
    .input(z.object({ uri: z.string() }))
    .query(async ({ input }) => { ... }),
});
```

### Agent Router
```typescript
const agentRouter = t.router({
  spawn: t.procedure
    .input(agentConfigSchema)
    .mutation(async ({ input }) => { ... }),

  getTask: t.procedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }) => { ... }),

  approveAction: t.procedure
    .input(z.object({ actionId: z.string() }))
    .mutation(async ({ input }) => { ... }),

  rejectAction: t.procedure
    .input(z.object({ actionId: z.string() }))
    .mutation(async ({ input }) => { ... }),

  listTasks: t.procedure.query(async () => { ... }),

  streamTask: t.procedure
    .input(z.object({ taskId: z.string() }))
    .subscription(async ({ input }) => { ... }),
});
```

### Knowledge Graph Router
```typescript
const graphRouter = t.router({
  query: t.procedure
    .input(graphQuerySchema)
    .query(async ({ input }) => { ... }),

  getNode: t.procedure
    .input(z.object({ nodeId: z.string() }))
    .query(async ({ input }) => { ... }),

  getNeighbors: t.procedure
    .input(z.object({ nodeId: z.string(), depth: z.number() }))
    .query(async ({ input }) => { ... }),

  getSubgraph: t.procedure
    .input(z.object({ rootNodeId: z.string(), depth: z.number() }))
    .query(async ({ input }) => { ... }),

  indexStatus: t.procedure.query(async () => { ... }),
});
```

### RAG Router
```typescript
const ragRouter = t.router({
  search: t.procedure
    .input(z.object({ query: z.string(), topK: z.number() }))
    .query(async ({ input }) => { ... }),

  indexWorkspace: t.procedure.mutation(async () => { ... }),

  getChunk: t.procedure
    .input(z.object({ chunkId: z.string() }))
    .query(async ({ input }) => { ... }),
});
```

### Settings Router
```typescript
const settingsRouter = t.router({
  get: t.procedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => { ... }),

  set: t.procedure
    .input(z.object({ key: z.string(), value: z.unknown() }))
    .mutation(async ({ input }) => { ... }),

  getAll: t.procedure.query(async () => { ... }),

  reset: t.procedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => { ... }),
});
```

## LLM Client Interface

```typescript
interface LLMClient {
  chat(options: ChatOptions): AsyncGenerator<string>;
  complete(options: CompleteOptions): Promise<string>;
  embed(text: string): Promise<Float32Array>;
}

interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  systemPrompt?: string;
  tools?: Tool[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
}

interface CompleteOptions {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}
```

## NAPI-RS Native Module Interface

```rust
// native/procode-native/src/lib.rs
#[napi]
pub fn init_file_watcher(path: String, options: WatchOptions) -> napi::Result<WatcherHandle>

#[napi]
pub fn parse_file(path: String, language: String) -> napi::Result<ASTResult>

#[napi]
pub fn incrementally_parse(original: ASTResult, edits: Vec<Edit>) -> napi::Result<ASTResult>

// native/procode-graph/src/lib.rs
#[napi]
pub fn create_graph() -> napi::Result<GraphHandle>

#[napi]
pub fn graph_upsert_node(graph: &GraphHandle, node: KGNode) -> napi::Result<NodeId>

#[napi]
pub fn graph_upsert_edge(graph: &GraphHandle, from: NodeId, to: NodeId, edge: KGEdge) -> napi::Result<()>

#[napi]
pub fn graph_query(graph: &GraphHandle, query: GraphQuery) -> napi::Result<Vec<QueryResult>>

#[napi]
pub fn graph_subgraph(graph: &GraphHandle, root: NodeId, depth: u32) -> napi::Result<SubgraphData>

// native/procode-vector/src/lib.rs
#[napi]
pub fn create_hnsw_index(dimensions: u32, m: u32, ef_construction: u32) -> napi::Result<IndexHandle>

#[napi]
pub fn hnsw_insert(index: &IndexHandle, id: String, vector: Vec<f32>) -> napi::Result<()>

#[napi]
pub fn hnsw_search(index: &IndexHandle, vector: Vec<f32>, k: u32) -> napi::Result<Vec<SearchResult>>

#[napi]
pub fn hnsw_save(index: &IndexHandle, path: String) -> napi::Result<()>

#[napi]
pub fn hnsw_load(path: String) -> napi::Result<IndexHandle>
```

## Event System

### Main → Renderer Events
```typescript
interface Events {
  'file-changed': { uri: string; type: 'created' | 'modified' | 'deleted' };
  'git-status-changed': { status: GitStatus[] };
  'indexing-progress': { total: number; indexed: number; file: string };
  'agent-task-updated': { taskId: string; status: string; step: TaskStep };
  'diagnostics-changed': { uri: string; diagnostics: Diagnostic[] };
  'lsp-status-changed': { language: string; status: string };
  'ollama-status-changed': { status: 'running' | 'stopped' | 'error' };
}
```
