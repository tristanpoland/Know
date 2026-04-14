// api/indexer.rs — Repository indexing pipeline
// Orchestrates: file discovery → parse → doc extract → graph → search index

use std::path::Path;
use anyhow::Result;

use crate::AppState;
use crate::repo::file_tree::{build_tree, flatten_files, FileKind};
use crate::rust_parser;
use crate::graph_engine::builder::{ingest_rust_file, ingest_markdown_file, extract_markdown_title};

/// Index an entire repository from scratch.
pub fn index_repository(state: &AppState, root: &Path) -> Result<()> {
    let crate_name = root
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| "unknown".to_string());

    let tree = build_tree(root);

    let rust_files: Vec<_> = flatten_files(&tree, |n| n.kind == FileKind::RustSource)
        .into_iter()
        .map(|n| n.path.clone())
        .collect();

    let md_files: Vec<_> = flatten_files(&tree, |n| n.kind == FileKind::Markdown)
        .into_iter()
        .map(|n| n.path.clone())
        .collect();

    state.symbol_index.write().set_crate_name(&crate_name);

    // Parse and index all Rust files
    for file_path in &rust_files {
        match rust_parser::parse_file(file_path) {
            Ok(items) => {
                state.symbol_index.write().index_file(file_path, items.clone());

                {
                    let mut graph = state.graph.write();
                    ingest_rust_file(&mut graph, file_path, &items);
                }

                {
                    let mut search = state.search.write();
                    for item in &items {
                        let _ = search.index_symbol(item);
                    }
                }
            }
            Err(e) => {
                log::warn!("Failed to parse {}: {}", file_path.display(), e);
            }
        }
    }

    // Index all Markdown files
    for file_path in &md_files {
        match std::fs::read_to_string(file_path) {
            Ok(content) => {
                let title = extract_markdown_title(&content)
                    .unwrap_or_else(|| {
                        file_path.file_stem()
                            .map(|s| s.to_string_lossy().into_owned())
                            .unwrap_or_else(|| "Untitled".to_string())
                    });

                {
                    let mut graph = state.graph.write();
                    ingest_markdown_file(&mut graph, file_path, &content, Some(title.clone()));
                }

                {
                    let mut search = state.search.write();
                    let _ = search.index_markdown(file_path, &title, &content);
                }
            }
            Err(e) => {
                log::warn!("Failed to read markdown {}: {}", file_path.display(), e);
            }
        }
    }

    state.search.write().commit()?;

    log::info!(
        "Indexed {} Rust files + {} Markdown files",
        rust_files.len(),
        md_files.len()
    );

    Ok(())
}

/// Re-index a single file after a change event.
pub fn reindex_file(state: &AppState, file_path: &Path) -> Result<()> {
    let ext = file_path.extension().and_then(|e| e.to_str());

    match ext {
        Some("rs") => {
            match rust_parser::parse_file(file_path) {
                Ok(items) => {
                    state.symbol_index.write().index_file(file_path, items.clone());

                    {
                        let mut graph = state.graph.write();
                        graph.remove_file(&file_path.to_path_buf());
                        ingest_rust_file(&mut graph, file_path, &items);
                    }

                    {
                        let mut search = state.search.write();
                        let _ = search.remove_file(&file_path.to_path_buf());
                        for item in &items {
                            let _ = search.index_symbol(item);
                        }
                        let _ = search.commit();
                    }
                }
                Err(e) => {
                    log::warn!("Failed to re-parse {}: {}", file_path.display(), e);
                }
            }
        }
        Some("md") => {
            if let Ok(content) = std::fs::read_to_string(file_path) {
                let title = extract_markdown_title(&content)
                    .unwrap_or_else(|| "Untitled".to_string());

                {
                    let mut graph = state.graph.write();
                    graph.remove_file(&file_path.to_path_buf());
                    ingest_markdown_file(&mut graph, file_path, &content, Some(title.clone()));
                }

                {
                    let mut search = state.search.write();
                    let _ = search.remove_file(&file_path.to_path_buf());
                    let _ = search.index_markdown(&file_path.to_path_buf(), &title, &content);
                    let _ = search.commit();
                }
            }
        }
        _ => {}
    }

    Ok(())
}
