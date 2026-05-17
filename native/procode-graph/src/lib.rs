use petgraph::graph::{DiGraph, NodeIndex};
use serde::{Deserialize, Serialize};

/// Node in the knowledge graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    pub id: String,
    pub name: String,
    pub path: String,
    pub node_type: String,
}

/// Edge type in the knowledge graph
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    pub edge_type: String,
}

/// Knowledge graph wrapper around petgraph
pub struct KnowledgeGraph {
    graph: DiGraph<GraphNode, GraphEdge>,
    node_index: std::collections::HashMap<String, NodeIndex>,
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

    pub fn add_edge(&mut self, from: &str, to: &str, edge: GraphEdge) {
        if let (Some(from_idx), Some(to_idx)) =
            (self.node_index.get(from), self.node_index.get(to))
        {
            self.graph.add_edge(*from_idx, *to_idx, edge);
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
        });
        assert_eq!(graph.graph.node_count(), 1);
    }
}
