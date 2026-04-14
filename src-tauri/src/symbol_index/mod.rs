// symbol_index/mod.rs — Symbol registry (Agent B+C integration)
// Maintains a fast, in-memory registry of all known Rust symbols.
// Updated incrementally as files are parsed or changed.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use dashmap::DashMap;

use crate::rust_parser::types::{RustItem, RustItemKind};
use crate::doc_extractor::{CrateDoc, SymbolDoc, build_crate_doc};

/// The global symbol registry.
pub struct SymbolIndex {
    /// All parsed items, keyed by qualified path.
    items_by_path: HashMap<String, RustItem>,
    /// Items grouped by source file.
    items_by_file: HashMap<PathBuf, Vec<String>>,
    /// Compiled crate-level documentation.
    crate_doc: CrateDoc,
    /// Crate name (derived from root Cargo.toml).
    crate_name: String,
}

impl SymbolIndex {
    pub fn new() -> Self {
        Self {
            items_by_path: HashMap::new(),
            items_by_file: HashMap::new(),
            crate_doc: CrateDoc::default(),
            crate_name: String::from("unknown"),
        }
    }

    pub fn set_crate_name(&mut self, name: &str) {
        self.crate_name = name.to_string();
    }

    /// Index all items from a parsed file, replacing any previously indexed items for that file.
    pub fn index_file(&mut self, file_path: &Path, items: Vec<RustItem>) {
        // Remove old entries for this file
        if let Some(old_paths) = self.items_by_file.remove(file_path) {
            for qp in old_paths {
                self.items_by_path.remove(&qp);
            }
        }

        // Insert new entries
        let mut new_paths = Vec::with_capacity(items.len());
        for item in items {
            new_paths.push(item.qualified_path.clone());
            self.items_by_path.insert(item.qualified_path.clone(), item);
        }
        self.items_by_file.insert(file_path.to_path_buf(), new_paths);

        // Rebuild crate doc
        self.rebuild_crate_doc();
    }

    /// Remove all indexed items for a deleted file.
    pub fn remove_file(&mut self, file_path: &Path) {
        if let Some(old_paths) = self.items_by_file.remove(file_path) {
            for qp in old_paths {
                self.items_by_path.remove(&qp);
            }
        }
        self.rebuild_crate_doc();
    }

    /// Look up a symbol by its qualified path.
    pub fn get_item(&self, qualified_path: &str) -> Option<&RustItem> {
        self.items_by_path.get(qualified_path)
    }

    /// Look up documentation for a symbol.
    pub fn get_doc(&self, qualified_path: &str) -> Option<&SymbolDoc> {
        self.crate_doc.symbols.get(qualified_path)
    }

    /// Return all indexed items.
    pub fn all_items(&self) -> impl Iterator<Item = &RustItem> {
        self.items_by_path.values()
    }

    /// Return all items in a specific file.
    pub fn items_for_file(&self, path: &Path) -> Vec<&RustItem> {
        self.items_by_file
            .get(path)
            .map(|paths| {
                paths
                    .iter()
                    .filter_map(|qp| self.items_by_path.get(qp))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Return the full crate documentation.
    pub fn crate_doc(&self) -> &CrateDoc {
        &self.crate_doc
    }

    /// Search for symbols by name prefix (case-insensitive).
    pub fn search_by_name(&self, query: &str) -> Vec<&RustItem> {
        let q = query.to_lowercase();
        self.items_by_path
            .values()
            .filter(|item| item.name.to_lowercase().contains(&q))
            .collect()
    }

    /// Search for symbols of a specific kind.
    pub fn items_by_kind(&self, kind: &RustItemKind) -> Vec<&RustItem> {
        self.items_by_path
            .values()
            .filter(|item| &item.kind == kind)
            .collect()
    }

    /// Total number of indexed symbols.
    pub fn symbol_count(&self) -> usize {
        self.items_by_path.len()
    }

    fn rebuild_crate_doc(&mut self) {
        let all_items: Vec<RustItem> = self.items_by_path.values().cloned().collect();
        self.crate_doc = build_crate_doc(&self.crate_name, &all_items);
    }
}

/// Summary statistics about the index, returned to the UI.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexStats {
    pub total_symbols: usize,
    pub total_files: usize,
    pub crate_name: String,
}

impl SymbolIndex {
    pub fn stats(&self) -> IndexStats {
        IndexStats {
            total_symbols: self.items_by_path.len(),
            total_files: self.items_by_file.len(),
            crate_name: self.crate_name.clone(),
        }
    }
}
