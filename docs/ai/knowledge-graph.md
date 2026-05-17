# Knowledge Graph

## Overview

The Knowledge Graph is ProCode's defining feature — a persistent, queryable semantic model of the entire codebase. Every symbol, dependency, commit, and architectural decision is indexed and made available for querying.

## Architecture

```
File Change Event (Rust file watcher)
          ↓
    Parse AST (Tree-sitter, Rust)
          ↓
    Extract Symbols & Relationships
          ↓
    Diff against existing graph nodes
          ↓
    Upsert nodes/edges in petgraph (in-memory)
          ↓
    Persist delta to SurrealDB (async)
          ↓
    Generate embeddings for changed symbols
          ↓
    Upsert embeddings in HNSW vector index
          ↓
    Notify TypeScript subscribers (IPC event)
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

## Graph Engine (Rust)

```rust
// native/procode-graph/src/graph.rs
pub struct KnowledgeGraph {
    graph: petgraph::Graph<KGNode, KGEdge>,
    node_index: HashMap<NodeId, NodeIndex>,
    symbol_index: HashMap<FullyQualifiedName, NodeId>,
}

impl KnowledgeGraph {
    pub fn new() -> Self { ... }

    pub fn query(&self, q: GraphQuery) -> Vec<QueryResult> { ... }

    pub fn upsert_node(&mut self, node: KGNode) -> NodeId { ... }

    pub fn upsert_edge(&mut self, from: NodeId, to: NodeId, edge: KGEdge) { ... }

    pub fn subgraph(&self, root: NodeId, depth: u32) -> KnowledgeGraph { ... }

    pub fn find_paths(&self, from: NodeId, to: NodeId) -> Vec<Vec<NodeId>> { ... }

    pub fn remove_node(&mut self, id: NodeId) { ... }

    pub fn node_count(&self) -> usize { ... }

    pub fn edge_count(&self) -> usize { ... }
}
```

## Indexing Pipeline

### AST Extraction

Tree-sitter parses source files and extracts:

1. **Symbols** — Functions, classes, interfaces, variables
2. **Relationships** — Imports, calls, implements, extends
3. **Metadata** — Line numbers, language, visibility

### Incremental Updates

On file change:
1. Identify changed region in AST (Tree-sitter incremental parsing)
2. Compute diff between old and new nodes
3. Upsert changed nodes/edges in petgraph
4. Remove deleted nodes/edges
5. Generate embeddings for changed symbols
6. Persist delta to SurrealDB

### Performance

| Metric | Target |
|--------|--------|
| Full index (100k lines) | < 30 seconds |
| Incremental update | < 50ms |
| Graph query | < 20ms |
| Subgraph extraction | < 10ms |

## TypeScript API

```typescript
// packages/knowledge-graph/src/GraphClient.ts
class GraphClient {
  async query(q: GraphQuery): Promise<QueryResult[]> { ... }

  async getNode(nodeId: string): Promise<KGNode> { ... }

  async getNeighbors(nodeId: string, depth: number): Promise<KGNode[]> { ... }

  async getSubgraph(rootNodeId: string, depth: number): Promise<Subgraph> { ... }

  async findPaths(from: string, to: string): Promise<Path[]> { ... }

  subscribe(filter: EventFilter, cb: Callback): Disposable { ... }
}

// packages/knowledge-graph/src/GraphQuery.ts
class GraphQueryBuilder {
  nodes(type?: NodeType[]): this { ... }
  edges(type?: EdgeType[]): this { ... }
  where(condition: Condition): this { ... }
  limit(n: number): this { ... }
  build(): GraphQuery { ... }
}

// Example usage:
const results = await graph.query(
  new GraphQueryBuilder()
    .nodes(['function'])
    .edges(['CALLS'])
    .where({ name: 'authenticate' })
    .limit(10)
    .build()
);
```

## Graph Sync with SurrealDB

The in-memory petgraph is the source of truth for queries. SurrealDB provides persistence:

```rust
// native/procode-graph/src/serializer.rs
pub struct GraphSerializer {
    db: SurrealDBClient,
}

impl GraphSerializer {
    pub async fn persist_delta(&self, delta: GraphDelta) -> Result<()> {
        for node in delta.added_nodes {
            self.db.create("kg_node", node).await?;
        }
        for edge in delta.added_edges {
            self.db.create("kg_edge", edge).await?;
        }
        for id in delta.removed_nodes {
            self.db.delete(("kg_node", id)).await?;
        }
        Ok(())
    }

    pub async fn load(&self) -> Result<KnowledgeGraph> {
        let nodes = self.db.query("SELECT * FROM kg_node").await?;
        let edges = self.db.query("SELECT * FROM kg_edge").await?;
        Ok(KnowledgeGraph::from(nodes, edges))
    }
}
```

## Knowledge Graph Explorer UI

A force-directed graph visualization using D3-force:

### Features
- **Pan, zoom** — Navigate large graphs
- **Click-to-navigate** — Click node to open in editor
- **Filter sidebar** — Show/hide node/edge types
- **Search** — Fuzzy match on symbol names
- **Time-travel slider** — View graph at any git ref
- **Focus mode** — Show subgraph around selected node
- **Node colors** — Colored by type (function=blue, class=green, etc.)
- **Edge styles** — Different styles by relationship type (solid=Calls, dashed=Imports)

### Query Examples

```typescript
// Find all functions that call "authenticate"
graph.query(
  new GraphQueryBuilder()
    .nodes(['function'])
    .edges(['CALLS'])
    .where({ target: 'authenticate' })
    .build()
);

// Find all files that import a specific module
graph.query(
  new GraphQueryBuilder()
    .nodes(['file'])
    .edges(['IMPORTS'])
    .where({ target: 'src/auth/middleware.ts' })
    .build()
);

// Find co-changed symbols (frequently committed together)
graph.query(
  new GraphQueryBuilder()
    .nodes(['function', 'class'])
    .edges(['CO_CHANGED'])
    .where({ weight: { gte: 0.8 } })
    .build()
);
```
