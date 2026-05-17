# Data Models

## Workspace SQLite Schema

### Core Tables

```sql
-- Workspace metadata
CREATE TABLE workspace (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_opened_at INTEGER NOT NULL,
  settings_json TEXT
);

-- Open editor state
CREATE TABLE editor_state (
  workspace_id TEXT NOT NULL,
  uri TEXT NOT NULL,
  group_id INTEGER NOT NULL,
  is_pinned INTEGER DEFAULT 0,
  cursor_line INTEGER,
  cursor_col INTEGER,
  scroll_top REAL,
  PRIMARY KEY (workspace_id, uri)
);

-- Breakpoints
CREATE TABLE breakpoints (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  uri TEXT NOT NULL,
  line INTEGER NOT NULL,
  condition TEXT,
  hit_count INTEGER,
  log_message TEXT,
  enabled INTEGER DEFAULT 1
);

-- Agent memory (long-term)
CREATE TABLE agent_memory (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,  -- 'insight' | 'preference' | 'decision'
  content TEXT NOT NULL,
  embedding_id TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER
);

-- Agent task history
CREATE TABLE agent_tasks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,        -- 'queued' | 'running' | 'done' | 'failed'
  agent_type TEXT,
  plan_json TEXT,
  result_summary TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

-- Code chunks (RAG)
CREATE TABLE code_chunks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  file_uri TEXT NOT NULL,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  chunk_type TEXT NOT NULL,    -- 'function' | 'class' | 'file' | 'window'
  start_line INTEGER,
  end_line INTEGER,
  symbol_name TEXT,
  language TEXT,
  node_id TEXT,                -- Knowledge graph node ID
  has_embedding INTEGER DEFAULT 0,
  indexed_at INTEGER NOT NULL
);

-- FTS5 index for BM25 search
CREATE VIRTUAL TABLE code_fts USING fts5(
  content,
  symbol_name,
  file_uri UNINDEXED,
  chunk_id UNINDEXED,
  tokenize="porter unicode61"
);
```

## Knowledge Graph Schema (SurrealDB)

```surql
DEFINE TABLE kg_node SCHEMAFULL;
DEFINE FIELD id       ON kg_node TYPE string;
DEFINE FIELD type     ON kg_node TYPE string;  -- 'file' | 'function' | 'class' | ...
DEFINE FIELD name     ON kg_node TYPE string;
DEFINE FIELD fqn      ON kg_node TYPE string;  -- fully qualified name
DEFINE FIELD file_uri ON kg_node TYPE option<string>;
DEFINE FIELD start_line ON kg_node TYPE option<int>;
DEFINE FIELD end_line   ON kg_node TYPE option<int>;
DEFINE FIELD language   ON kg_node TYPE option<string>;
DEFINE FIELD metadata   ON kg_node FLEXIBLE TYPE option<object>;
DEFINE FIELD updated_at ON kg_node TYPE datetime;

DEFINE TABLE kg_edge SCHEMAFULL;
DEFINE FIELD in          ON kg_edge TYPE record<kg_node>;
DEFINE FIELD out         ON kg_edge TYPE record<kg_node>;
DEFINE FIELD type        ON kg_edge TYPE string;  -- 'CALLS' | 'IMPORTS' | ...
DEFINE FIELD weight      ON kg_edge TYPE option<float>;
DEFINE FIELD metadata    ON kg_edge FLEXIBLE TYPE option<object>;
```

## Node Types

```
Symbol Nodes
├── File           — every source file in the workspace
├── Module         — logical module/package boundary
├── Function       — named function or method
├── Class          — class definition
├── Interface      — TypeScript interface / abstract type
├── Variable       — module-level or exported variable
├── Type           — type alias, enum, union type
└── Constant       — exported constants

Infrastructure Nodes
├── Dependency     — npm/cargo package dependency
├── GitCommit      — commit in the repo history
├── TestSuite      — test file → test cases
└── ConfigFile     — tsconfig, package.json, Cargo.toml
```

## Edge Types

```
Code Structure
├── CONTAINS       — File → Function, Class → Method
├── IMPORTS        — File → File (import/require/use)
├── CALLS          — Function → Function (call graph)
├── IMPLEMENTS     — Class → Interface
├── EXTENDS        — Class → Class, Interface → Interface
└── EXPORTS        — File → Symbol

Semantic
├── TESTS          — TestSuite → Function/Class
├── DOCUMENTS      — DocComment → Symbol
├── DEPENDS_ON     — Module → Dependency
└── SIMILAR_TO     — Symbol → Symbol (embedding similarity)

Temporal
├── MODIFIED_BY    — Symbol → GitCommit
├── CREATED_IN     — Symbol → GitCommit
└── CO_CHANGED     — Symbol → Symbol (co-committed frequently)
```

## TypeScript Type Definitions

```typescript
// packages/types/src/editor.types.ts
interface EditorState {
  uri: string;
  groupId: number;
  isPinned: boolean;
  cursorLine: number;
  cursorCol: number;
  scrollTop: number;
}

interface BufferState {
  uri: string;
  content: string;
  isDirty: boolean;
  languageId: string;
  version: number;
}

// packages/types/src/git.types.ts
interface GitStatus {
  uri: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
  staged: boolean;
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  parents: string[];
}

// packages/types/src/agent.types.ts
interface AgentTask {
  id: string;
  description: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  agentType: string;
  plan: TaskStep[];
  resultSummary?: string;
  createdAt: number;
  completedAt?: number;
}

interface TaskStep {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  agentType: string;
}

// packages/types/src/graph.types.ts
interface KGNode {
  id: string;
  type: NodeType;
  name: string;
  fqn: string;
  fileUri?: string;
  startLine?: number;
  endLine?: number;
  language?: string;
  metadata?: Record<string, unknown>;
}

interface KGEdge {
  from: string;
  to: string;
  type: EdgeType;
  weight?: number;
  metadata?: Record<string, unknown>;
}

type NodeType = 'file' | 'module' | 'function' | 'class' | 'interface' | 'variable' | 'type' | 'constant' | 'dependency' | 'gitCommit' | 'testSuite' | 'configFile';

type EdgeType = 'CONTAINS' | 'IMPORTS' | 'CALLS' | 'IMPLEMENTS' | 'EXTENDS' | 'EXPORTS' | 'TESTS' | 'DOCUMENTS' | 'DEPENDS_ON' | 'SIMILAR_TO' | 'MODIFIED_BY' | 'CREATED_IN' | 'CO_CHANGED';
```

## Database Storage Locations

All databases stored in `~/.procode/workspaces/<workspace-id>/`:

```
~/.procode/
└── workspaces/
    └── <workspace-id>/
        ├── workspace.db          # SQLite (workspace state)
        ├── surrealdb/            # SurrealDB (knowledge graph)
        │   └── data/
        ├── vector.index          # HNSW index (Rust, disk-backed)
        └── lsp-cache/            # LevelDB (LSP caches)
```
