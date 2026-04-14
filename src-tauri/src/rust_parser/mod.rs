// rust_parser/mod.rs — AST parsing engine (Agent B)
// Parses Rust source files using `syn` and extracts structured items with docs.

pub mod visitor;
pub mod types;

use std::path::{Path, PathBuf};
use anyhow::{Context, Result};

pub use types::{RustItem, RustItemKind, Span};

/// Parse a single `.rs` file and return all extracted items.
pub fn parse_file(path: &Path) -> Result<Vec<RustItem>> {
    let source = std::fs::read_to_string(path)
        .with_context(|| format!("Cannot read file: {}", path.display()))?;
    parse_source(&source, path)
}

/// Parse Rust source text and extract all items with their documentation.
pub fn parse_source(source: &str, path: &Path) -> Result<Vec<RustItem>> {
    let syntax_tree = syn::parse_file(source)
        .with_context(|| format!("syn parse error in: {}", path.display()))?;

    let mut items = Vec::new();
    let mut vis = visitor::ItemVisitor::new(path.to_path_buf());
    vis.visit_file(&syntax_tree);
    items.extend(vis.into_items());

    Ok(items)
}
