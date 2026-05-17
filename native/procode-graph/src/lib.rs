use petgraph::graph::{DiGraph, NodeIndex};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    pub id: String,
    pub name: String,
    pub path: String,
    pub node_type: String,
    pub range: Option<GraphRange>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphRange {
    pub start: GraphPosition,
    pub end: GraphPosition,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphPosition {
    pub line: usize,
    pub col: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    pub source: String,
    pub target: String,
    pub edge_type: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphQuery {
    pub node_type: Option<String>,
    pub edge_type: Option<String>,
    pub path_pattern: Option<String>,
    pub name_pattern: Option<String>,
    pub max_depth: Option<usize>,
}

pub struct KnowledgeGraph {
    graph: DiGraph<GraphNode, GraphEdge>,
    node_index: HashMap<String, NodeIndex>,
}

impl KnowledgeGraph {
    pub fn new() -> Self {
        Self {
            graph: DiGraph::new(),
            node_index: HashMap::new(),
        }
    }

    pub fn add_node(&mut self, node: GraphNode) {
        let idx = self.graph.add_node(node.clone());
        self.node_index.insert(node.id, idx);
    }

    pub fn add_edge(&mut self, edge: GraphEdge) {
        if let (Some(&from_idx), Some(&to_idx)) = (
            self.node_index.get(&edge.source),
            self.node_index.get(&edge.target),
        ) {
            self.graph.add_edge(from_idx, to_idx, edge);
        }
    }

    pub fn remove_node(&mut self, id: &str) {
        if let Some(&idx) = self.node_index.get(id) {
            self.graph.remove_node(idx);
            self.node_index.remove(id);
        }
    }

    pub fn remove_edge(&mut self, source: &str, target: &str) {
        if let (Some(&source_idx), Some(&target_idx)) = (
            self.node_index.get(source),
            self.node_index.get(target),
        ) {
            if let Some(edge_idx) = self.graph.find_edge(source_idx, target_idx) {
                self.graph.remove_edge(edge_idx);
            }
        }
    }

    pub fn get_node(&self, id: &str) -> Option<&GraphNode> {
        self.node_index
            .get(id)
            .and_then(|idx| self.graph.node_weight(*idx))
    }

    pub fn get_incoming_edges(&self, node_id: &str, edge_type: Option<&str>) -> Vec<&GraphEdge> {
        let mut edges = Vec::new();

        if let Some(&idx) = self.node_index.get(node_id) {
            for edge in self.graph.edges_directed(idx, petgraph::Direction::Incoming) {
                if let Some(filter_type) = edge_type {
                    if edge.weight().edge_type == filter_type {
                        edges.push(edge.weight());
                    }
                } else {
                    edges.push(edge.weight());
                }
            }
        }

        edges
    }

    pub fn get_outgoing_edges(&self, node_id: &str, edge_type: Option<&str>) -> Vec<&GraphEdge> {
        let mut edges = Vec::new();

        if let Some(&idx) = self.node_index.get(node_id) {
            for edge in self.graph.edges_directed(idx, petgraph::Direction::Outgoing) {
                if let Some(filter_type) = edge_type {
                    if edge.weight().edge_type == filter_type {
                        edges.push(edge.weight());
                    }
                } else {
                    edges.push(edge.weight());
                }
            }
        }

        edges
    }

    pub fn get_connected_nodes(&self, node_id: &str, depth: usize) -> Vec<&GraphNode> {
        let mut visited = HashMap::new();
        let mut result = Vec::new();

        if let Some(&start_idx) = self.node_index.get(node_id) {
            self.dfs(start_idx, depth, &mut visited, &mut result);
        }

        result
            .into_iter()
            .filter(|node| node.id != node_id)
            .collect()
    }

    pub fn query(&self, query: GraphQuery) -> Vec<&GraphNode> {
        let mut results = Vec::new();

        for (id, &idx) in &self.node_index {
            let node = &self.graph[idx];

            if let Some(ref node_type) = query.node_type {
                if node.node_type != *node_type {
                    continue;
                }
            }

            if let Some(ref path_pattern) = query.path_pattern {
                if !node.path.contains(path_pattern) {
                    continue;
                }
            }

            if let Some(ref name_pattern) = query.name_pattern {
                if !node.name.contains(name_pattern) {
                    continue;
                }
            }

            if let Some(max_depth) = query.max_depth {
                let connected = self.get_connected_nodes(id, max_depth);
                if connected.is_empty() && max_depth > 0 {
                    continue;
                }
            }

            results.push(node);
        }

        results
    }

    pub fn node_count(&self) -> usize {
        self.graph.node_count()
    }

    pub fn edge_count(&self) -> usize {
        self.graph.edge_count()
    }

    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        let nodes: Vec<&GraphNode> = self.graph.node_weights().collect();
        let edges: Vec<&GraphEdge> = self.graph.edge_weights().collect();

        serde_json::to_string(&serde_json::json!({
            "nodes": nodes,
            "edges": edges,
        }))
    }

    fn dfs(
        &self,
        idx: NodeIndex,
        depth: usize,
        visited: &mut HashMap<NodeIndex, bool>,
        result: &mut Vec<&GraphNode>,
    ) {
        if depth == 0 || visited.contains_key(&idx) {
            return;
        }

        visited.insert(idx, true);

        if let Some(node) = self.graph.node_weight(idx) {
            result.push(node);
        }

        for neighbor in self.graph.neighbors(idx) {
            self.dfs(neighbor, depth - 1, visited, result);
        }
    }
}

impl Default for KnowledgeGraph {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_node() {
        let mut graph = KnowledgeGraph::new();
        graph.add_node(GraphNode {
            id: "test".to_string(),
            name: "test_fn".to_string(),
            path: "/test.rs".to_string(),
            node_type: "function".to_string(),
            range: None,
            metadata: None,
        });
        assert_eq!(graph.node_count(), 1);
    }

    #[test]
    fn test_add_edge() {
        let mut graph = KnowledgeGraph::new();
        graph.add_node(GraphNode {
            id: "a".to_string(),
            name: "fn_a".to_string(),
            path: "/test.rs".to_string(),
            node_type: "function".to_string(),
            range: None,
            metadata: None,
        });
        graph.add_node(GraphNode {
            id: "b".to_string(),
            name: "fn_b".to_string(),
            path: "/test.rs".to_string(),
            node_type: "function".to_string(),
            range: None,
            metadata: None,
        });
        graph.add_edge(GraphEdge {
            source: "a".to_string(),
            target: "b".to_string(),
            edge_type: "calls".to_string(),
            metadata: None,
        });
        assert_eq!(graph.edge_count(), 1);
    }

    #[test]
    fn test_query_by_type() {
        let mut graph = KnowledgeGraph::new();
        graph.add_node(GraphNode {
            id: "fn1".to_string(),
            name: "my_function".to_string(),
            path: "/src/lib.rs".to_string(),
            node_type: "function".to_string(),
            range: None,
            metadata: None,
        });
        graph.add_node(GraphNode {
            id: "cls1".to_string(),
            name: "MyClass".to_string(),
            path: "/src/lib.rs".to_string(),
            node_type: "class".to_string(),
            range: None,
            metadata: None,
        });

        let results = graph.query(GraphQuery {
            node_type: Some("function".to_string()),
            edge_type: None,
            path_pattern: None,
            name_pattern: None,
            max_depth: None,
        });

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].node_type, "function");
    }
}
