// graph_engine/mod.rs — Unified knowledge graph (Agent D)
// Represents the relationships between MarkdownFiles, RustFiles, and RustItems.
// Built on petgraph for efficient traversal and querying.

pub mod builder;

use std::collections::HashMap;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use petgraph::graph::{DiGraph, NodeIndex};
use petgraph::Direction;

/// A node in the knowledge graph.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Node {
    MarkdownFile { path: PathBuf, title: Option<String> },
    RustFile { path: PathBuf },
    RustItem { qualified_path: String, name: String, kind: String },
}

/// An edge in the knowledge graph, representing a relationship between nodes.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Edge {
    /// A file defines a symbol (RustFile → RustItem).
    Defines,
    /// A symbol references another symbol (RustItem → RustItem).
    References,
    /// A markdown doc documents a symbol (MarkdownFile → RustItem).
    Documents,
    /// An impl block implements a trait (RustItem[ImplBlock] → RustItem[Trait]).
    Implements,
    /// Module containment (RustItem[Module] → RustItem).
    Contains,
}

/// The unified knowledge graph.
pub struct KnowledgeGraph {
    graph: DiGraph<Node, Edge>,
    /// Map from node key → node index for de-duplication.
    node_index_map: HashMap<String, NodeIndex>,
}

impl KnowledgeGraph {
    pub fn new() -> Self {
        Self {
            graph: DiGraph::new(),
            node_index_map: HashMap::new(),
        }
    }

    /// Add or retrieve a node by its unique key.
    pub fn add_node(&mut self, key: String, node: Node) -> NodeIndex {
        if let Some(&idx) = self.node_index_map.get(&key) {
            // Update the node data in place
            self.graph[idx] = node;
            idx
        } else {
            let idx = self.graph.add_node(node);
            self.node_index_map.insert(key, idx);
            idx
        }
    }

    /// Add a directed edge between two nodes (by key).
    pub fn add_edge(&mut self, from_key: &str, to_key: &str, edge: Edge) {
        let from = match self.node_index_map.get(from_key) {
            Some(&idx) => idx,
            None => return,
        };
        let to = match self.node_index_map.get(to_key) {
            Some(&idx) => idx,
            None => return,
        };
        // Avoid duplicate edges of the same kind
        let already = self.graph.edges_connecting(from, to).any(|e| {
            std::mem::discriminant(e.weight()) == std::mem::discriminant(&edge)
        });
        if !already {
            self.graph.add_edge(from, to, edge);
        }
    }

    /// Return all nodes connected from a given key with a specific edge type.
    pub fn neighbors_of(&self, key: &str, direction: Direction) -> Vec<&Node> {
        match self.node_index_map.get(key) {
            Some(&idx) => self
                .graph
                .neighbors_directed(idx, direction)
                .map(|n| &self.graph[n])
                .collect(),
            None => Vec::new(),
        }
    }

    /// Return a serializable representation of the full graph for the UI.
    pub fn to_serializable(&self) -> SerializableGraph {
        let nodes: Vec<SerializableNode> = self
            .graph
            .node_indices()
            .map(|idx| SerializableNode {
                id: idx.index(),
                data: self.graph[idx].clone(),
            })
            .collect();

        let edges: Vec<SerializableEdge> = self
            .graph
            .edge_indices()
            .filter_map(|eidx| {
                let (from, to) = self.graph.edge_endpoints(eidx)?;
                Some(SerializableEdge {
                    from: from.index(),
                    to: to.index(),
                    data: self.graph[eidx].clone(),
                })
            })
            .collect();

        SerializableGraph { nodes, edges }
    }

    /// Remove all nodes and edges associated with a specific file path.
    pub fn remove_file(&mut self, path: &PathBuf) {
        let file_key = path.to_string_lossy().to_string();
        let prefix = format!("{}::", file_key);

        let to_remove: Vec<String> = self
            .node_index_map
            .keys()
            .filter(|k| *k == &file_key || k.starts_with(&prefix))
            .cloned()
            .collect();

        for key in to_remove {
            if let Some(idx) = self.node_index_map.remove(&key) {
                self.graph.remove_node(idx);
                // petgraph invalidates indices on removal; rebuild map
                self.rebuild_index_map();
                return; // Must restart after removal due to index invalidation
            }
        }
    }

    fn rebuild_index_map(&mut self) {
        self.node_index_map.clear();
        for idx in self.graph.node_indices() {
            let key = node_key(&self.graph[idx]);
            self.node_index_map.insert(key, idx);
        }
    }

    pub fn node_count(&self) -> usize {
        self.graph.node_count()
    }

    pub fn edge_count(&self) -> usize {
        self.graph.edge_count()
    }
}

fn node_key(node: &Node) -> String {
    match node {
        Node::MarkdownFile { path, .. } => path.to_string_lossy().to_string(),
        Node::RustFile { path } => path.to_string_lossy().to_string(),
        Node::RustItem { qualified_path, .. } => qualified_path.clone(),
    }
}

/// Serializable forms for IPC transfer to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializableGraph {
    pub nodes: Vec<SerializableNode>,
    pub edges: Vec<SerializableEdge>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializableNode {
    pub id: usize,
    pub data: Node,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SerializableEdge {
    pub from: usize,
    pub to: usize,
    pub data: Edge,
}
