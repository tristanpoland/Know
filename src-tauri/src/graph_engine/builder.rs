// graph_engine/builder.rs — Populates the KnowledgeGraph from parsed items and markdown.
// This is the integration point between Agent B/C output and the graph.

use std::path::{Path, PathBuf};
use pulldown_cmark::{Event, Parser, Tag, TagEnd};

use super::{Edge, KnowledgeGraph, Node};
use crate::rust_parser::types::{RustItem, RustItemKind};

/// Ingest all items from a Rust file into the graph.
pub fn ingest_rust_file(graph: &mut KnowledgeGraph, file_path: &Path, items: &[RustItem]) {
    let file_key = file_path.to_string_lossy().to_string();

    // Add the file node
    graph.add_node(
        file_key.clone(),
        Node::RustFile {
            path: file_path.to_path_buf(),
        },
    );

    for item in items {
        // Skip impl blocks as top-level nodes (they're represented by their methods)
        let item_key = item.qualified_path.clone();
        let kind_str = format!("{:?}", item.kind).to_lowercase();

        graph.add_node(
            item_key.clone(),
            Node::RustItem {
                qualified_path: item.qualified_path.clone(),
                name: item.name.clone(),
                kind: kind_str,
            },
        );

        // File → Defines → Item
        graph.add_edge(&file_key, &item_key, Edge::Defines);

        // Module → Contains → Item
        if !item.module_path.is_empty() {
            let parent_mod_key = item.module_path.join("::");
            graph.add_edge(&parent_mod_key, &item_key, Edge::Contains);
        }

        // Trait impl: ImplBlock → Implements → Trait
        if item.kind == RustItemKind::ImplBlock {
            if let Some(trait_name) = &item.impl_trait {
                graph.add_edge(&item_key, trait_name, Edge::Implements);
            }
        }
    }
}

/// Ingest a Markdown file into the graph, detecting links to Rust symbols.
pub fn ingest_markdown_file(
    graph: &mut KnowledgeGraph,
    file_path: &Path,
    content: &str,
    title: Option<String>,
) {
    let file_key = file_path.to_string_lossy().to_string();

    graph.add_node(
        file_key.clone(),
        Node::MarkdownFile {
            path: file_path.to_path_buf(),
            title,
        },
    );

    // Parse markdown looking for `[text](rust://qualified::path)` style links
    let parser = Parser::new(content);
    let mut in_link = false;
    let mut link_dest = String::new();

    for event in parser {
        match event {
            Event::Start(Tag::Link { dest_url, .. }) => {
                in_link = true;
                link_dest = dest_url.to_string();
            }
            Event::End(TagEnd::Link) => {
                if in_link {
                    if let Some(symbol_path) = link_dest.strip_prefix("rust://") {
                        // Markdown documents this Rust symbol
                        graph.add_edge(&file_key, symbol_path, Edge::Documents);
                    }
                    in_link = false;
                    link_dest.clear();
                }
            }
            _ => {}
        }
    }

    // Also scan for inline code references like `StructName` that might match known symbols
    // This is heuristic — we do a simple backtick scan
    extract_inline_code_refs(graph, &file_key, content);
}

/// Heuristic: find `backtick` references in markdown that match known symbols.
fn extract_inline_code_refs(graph: &mut KnowledgeGraph, file_key: &str, content: &str) {
    // Simple regex-free approach: find text between backticks
    let mut chars = content.chars().peekable();
    let mut in_code = false;
    let mut code_buf = String::new();

    while let Some(c) = chars.next() {
        if c == '`' {
            if in_code {
                // End of inline code — this is a potential symbol reference
                let sym = code_buf.trim().to_string();
                if !sym.is_empty() && looks_like_symbol(&sym) {
                    graph.add_edge(file_key, &sym, Edge::References);
                }
                code_buf.clear();
                in_code = false;
            } else {
                in_code = true;
            }
        } else if in_code {
            code_buf.push(c);
        }
    }
}

/// Heuristic: does this string look like a Rust symbol (PascalCase or path)?
fn looks_like_symbol(s: &str) -> bool {
    if s.is_empty() { return false; }
    // Must start with uppercase (struct/enum/trait) or contain `::`
    s.contains("::") || s.chars().next().map(|c| c.is_uppercase()).unwrap_or(false)
}

/// Extract title from markdown (first `# Heading` line).
pub fn extract_markdown_title(content: &str) -> Option<String> {
    content.lines().find_map(|line| {
        line.strip_prefix("# ").map(|t| t.trim().to_string())
    })
}
