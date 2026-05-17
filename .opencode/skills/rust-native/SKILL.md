---
name: rust-native
description: Rust native module development for ProCode — NAPI-RS bindings, doc comments, error handling, and SAFETY comments
---

# Skill: Rust Native Module Development

## When to Use

When writing Rust code in `native/` crates for NAPI-RS bindings to Node.js.

## Rules

1. **Every public function is documented with `///` doc comments.** The doc comment must describe what the function does, its panics (if any), and an example.
2. **Every `Result` error must be handled or explicitly propagated with `?`.** No silent discards.
3. **Use `Arc<Mutex<T>>` for shared state across NAPI calls.** Never use raw `static mut`.
4. **Benchmark before optimizing.** Use `criterion` for micro-benchmarks. Don't guess; measure.
5. **Prefer iterators over index loops.** `iter().filter().map().collect()` is idiomatic and optimizer-friendly.
6. **Log with `tracing` crate, not `println!`.** Structured logging only.
7. **Never use `unwrap()` in library code.** Use `expect()` with a message or proper error handling.
8. **Every `unsafe` block requires a `// SAFETY:` comment.** Must pass Clippy audit.

## Examples

```rust
/// Queries the knowledge graph for all nodes reachable from `root` within `depth` hops.
///
/// # Arguments
/// * `root` - The fully qualified name of the starting node.
/// * `depth` - Maximum traversal depth (1 = direct neighbors only).
///
/// # Errors
/// Returns `GraphError::NodeNotFound` if `root` does not exist in the graph.
///
/// # Example
/// ```rust
/// let results = graph.reachable("src/auth/middleware.ts::validateToken", 2)?;
/// ```
pub fn reachable(&self, root: &str, depth: u32) -> Result<Vec<KGNode>, GraphError> {
    let start = self.symbol_index.get(root)
        .ok_or_else(|| GraphError::NodeNotFound(root.to_string()))?;

    let mut visited = HashSet::new();
    let mut queue = VecDeque::from([(*start, 0u32)]);
    let mut results = Vec::new();

    while let Some((idx, current_depth)) = queue.pop_front() {
        if !visited.insert(idx) || current_depth > depth { continue; }
        results.push(self.graph[idx].clone());
        if current_depth < depth {
            self.graph.neighbors(idx)
                .for_each(|n| queue.push_back((n, current_depth + 1)));
        }
    }

    Ok(results)
}
```

```rust
// ✅ NAPI-RS bridge pattern
#[napi]
pub struct KnowledgeGraphHandle {
  inner: Arc<Mutex<KnowledgeGraph>>,
}

#[napi]
impl KnowledgeGraphHandle {
  #[napi(constructor)]
  pub fn new() -> Self { ... }

  #[napi]
  pub fn query(&self, query: String) -> napi::Result<Vec<QueryResult>> {
    let graph = self.inner.lock()
        .map_err(|e| napi::Error::from_reason(e.to_string()))?;
    Ok(graph.query(&query))
  }
}
```

## ProCode Context

- Crates: `native/procode-native`, `native/procode-graph`, `native/procode-vector`, `native/procode-git`
- Error handling: `anyhow` for application crates, `thiserror` for library crates
- Graph: `petgraph` with `StableDiGraph`
- File watch: `notify-rs` with `RecommendedWatcher`
- AST: `tree-sitter` with language grammars as separate crates
- Git: `git2-rs` (`Repository::open`, `Blame::file`)
