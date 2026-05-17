# Native Modules

## Overview

ProCode uses Rust native modules exposed to Node.js via NAPI-RS bindings for performance-critical subsystems.

## Native Module Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Node.js (TypeScript)                  │
│                                                         │
│  import { init_file_watcher, parse_file } from          │
│    '@procode/native';                                   │
│                                                         │
│  const watcher = init_file_watcher('/path/to/workspace');│
│  const ast = parse_file('src/index.ts', 'typescript');   │
└──────────────────────┬──────────────────────────────────┘
                       │ NAPI-RS Bindings
┌──────────────────────▼──────────────────────────────────┐
│                    Rust Native Modules                   │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │procode-native│  │procode-graph │  │procode-vector│  │
│  │              │  │              │  │              │  │
│  │ File Watcher │  │ Graph Engine │  │ HNSW Index   │  │
│  │ AST Parser   │  │ Query Engine │  │ Similarity   │  │
│  │ Indexer      │  │ Serializer   │  │ Persistence  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐                                       │
│  │ procode-git  │                                       │
│  │              │                                       │
│  │ Blame        │                                       │
│  │ Diff         │                                       │
│  │ History      │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

## Module: procode-native

Main NAPI-RS binding crate — the bridge between Rust and Node.js.

### Dependencies
```toml
[dependencies]
napi = { version = "2.16", features = ["napi6"] }
napi-derive = "2.16"
notify = "6.1"
tree-sitter = "0.22"
tree-sitter-typescript = "0.21"
tree-sitter-rust = "0.21"
tree-sitter-python = "0.21"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

### Exports
```rust
// File Watcher
#[napi]
pub fn init_file_watcher(path: String, options: WatchOptions) -> napi::Result<WatcherHandle>

#[napi]
pub fn stop_watcher(handle: &WatcherHandle) -> napi::Result<()>

// AST Parser
#[napi]
pub fn parse_file(path: String, language: String) -> napi::Result<ASTResult>

#[napi]
pub fn incrementally_parse(original: ASTResult, edits: Vec<Edit>) -> napi::Result<ASTResult>

#[napi]
pub fn extract_symbols(ast: ASTResult) -> napi::Result<Vec<Symbol>>

#[napi]
pub fn extract_relationships(ast: ASTResult) -> napi::Result<Vec<Relationship>>

// Code Indexer
#[napi]
pub fn index_workspace(path: String) -> napi::Result<IndexResult>

#[napi]
pub fn index_incremental(changes: Vec<FileChange>) -> napi::Result<IndexResult>
```

## Module: procode-graph

Knowledge graph engine using petgraph.

### Dependencies
```toml
[dependencies]
napi = { version = "2.16", features = ["napi6"] }
napi-derive = "2.16"
petgraph = "0.6"
serde = { version = "1.0", features = ["derive"] }
surrealdb = { version = "1.0", features = ["kv-mem"] }
```

### Exports
```rust
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

#[napi]
pub fn graph_find_paths(graph: &GraphHandle, from: NodeId, to: NodeId) -> napi::Result<Vec<Vec<NodeId>>>

#[napi]
pub fn graph_remove_node(graph: &mut GraphHandle, id: NodeId) -> napi::Result<()>

#[napi]
pub fn graph_node_count(graph: &GraphHandle) -> napi::Result<u32>

#[napi]
pub fn graph_edge_count(graph: &GraphHandle) -> napi::Result<u32>

#[napi]
pub fn graph_save(graph: &GraphHandle, path: String) -> napi::Result<()>

#[napi]
pub fn graph_load(path: String) -> napi::Result<GraphHandle>
```

## Module: procode-vector

HNSW vector index for similarity search.

### Dependencies
```toml
[dependencies]
napi = { version = "2.16", features = ["napi6"] }
napi-derive = "2.16"
serde = { version = "1.0", features = ["derive"] }
memmap2 = "0.9"
```

### Exports
```rust
#[napi]
pub fn create_hnsw_index(dimensions: u32, m: u32, ef_construction: u32) -> napi::Result<IndexHandle>

#[napi]
pub fn hnsw_insert(index: &IndexHandle, id: String, vector: Vec<f32>) -> napi::Result<()>

#[napi]
pub fn hnsw_insert_batch(index: &IndexHandle, entries: Vec<IndexEntry>) -> napi::Result<()>

#[napi]
pub fn hnsw_search(index: &IndexHandle, vector: Vec<f32>, k: u32) -> napi::Result<Vec<SearchResult>>

#[napi]
pub fn hnsw_save(index: &IndexHandle, path: String) -> napi::Result<()>

#[napi]
pub fn hnsw_load(path: String) -> napi::Result<IndexHandle>

#[napi]
pub fn hnsw_count(index: &IndexHandle) -> napi::Result<u32>

#[napi]
pub fn cosine_similarity(a: Vec<f32>, b: Vec<f32>) -> napi::Result<f32>

#[napi]
pub fn dot_product(a: Vec<f32>, b: Vec<f32>) -> napi::Result<f32>
```

## Module: procode-git

Fast Git operations using libgit2.

### Dependencies
```toml
[dependencies]
napi = { version = "2.16", features = ["napi6"] }
napi-derive = "2.16"
git2 = "0.18"
serde = { version = "1.0", features = ["derive"] }
```

### Exports
```rust
#[napi]
pub fn git_blame(path: String, file_path: String) -> napi::Result<Vec<BlameLine>>

#[napi]
pub fn git_diff(path: String, old_rev: String, new_rev: String) -> napi::Result<Diff>

#[napi]
pub fn git_history(path: String, limit: u32) -> napi::Result<Vec<Commit>>

#[napi]
pub fn git_file_history(path: String, file_path: String, limit: u32) -> napi::Result<Vec<Commit>>

#[napi]
pub fn git_branches(path: String) -> napi::Result<Vec<Branch>>

#[napi]
pub fn git_status(path: String) -> napi::Result<Vec<StatusEntry>>
```

## Build & Distribution

### Development Build
```bash
cd native/procode-native
napi build --platform
```

### Production Build
```bash
cd native/procode-native
napi build --platform --release
```

### Cross-Compilation
```bash
# Using cross-rs for cross-platform builds
cross build --target x86_64-unknown-linux-gnu --release
cross build --target aarch64-apple-darwin --release
cross build --target x86_64-pc-windows-msvc --release
```

## Type Safety

NAPI-RS generates TypeScript types automatically:

```typescript
// Auto-generated from Rust definitions
// native/procode-native/index.d.ts

export interface WatchOptions {
  recursive: boolean;
  debounceMs: number;
  ignorePatterns: string[];
}

export interface ASTResult {
  language: string;
  symbols: Symbol[];
  relationships: Relationship[];
}

export function init_file_watcher(path: string, options: WatchOptions): WatcherHandle;
export function parse_file(path: string, language: string): ASTResult;
```

## Error Handling

All native module functions return `napi::Result<T>` which maps to TypeScript promises:

```rust
#[napi]
pub fn parse_file(path: String, language: String) -> napi::Result<ASTResult> {
    let grammar = get_grammar(&language)
        .map_err(|e| napi::Error::new(napi::Status::InvalidArg, format!("Unsupported language: {}", language)))?;

    let source = std::fs::read_to_string(&path)
        .map_err(|e| napi::Error::new(napi::Status::GenericFailure, format!("Failed to read file: {}", e)))?;

    // ... parsing logic
    Ok(result)
}
```
