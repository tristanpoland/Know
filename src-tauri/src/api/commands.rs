// api/commands.rs — Tauri IPC command handlers (Agent F)
// All Tauri commands are defined here and exposed to the frontend.

use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::AppState;
use crate::repo::{RepoState, file_tree};
use crate::repo::file_tree::FileNode;
use crate::rust_parser::types::RustItem;
use crate::doc_extractor::{CrateDoc, SymbolDoc};
use crate::graph_engine::SerializableGraph;
use crate::search::{SearchQuery, SearchResult};
use crate::symbol_index::IndexStats;

use super::indexer;

type AppStateGuard<'a> = State<'a, AppState>;

// ─── Request / Response types ────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct OpenRepoRequest {
    pub path: String,
}

#[derive(Debug, Serialize)]
pub struct RepoInfo {
    pub root: String,
    pub name: String,
    pub branch: Option<String>,
    pub head_commit: Option<String>,
    pub stats: IndexStats,
}

#[derive(Debug, Deserialize)]
pub struct OpenFileRequest {
    pub path: String,
}

#[derive(Debug, Serialize)]
pub struct FileContent {
    pub path: String,
    pub content: String,
    pub kind: String,
}

#[derive(Debug, Deserialize)]
pub struct GetSymbolsRequest {
    pub file_path: Option<String>,
    pub kind_filter: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GetDocsRequest {
    pub qualified_path: String,
}

// ─── Commands ────────────────────────────────────────────────────────────────

/// Open a Git repository at `path`, index all Rust and Markdown files,
/// and return basic repository information.
#[tauri::command]
pub fn open_repo(
    request: OpenRepoRequest,
    state: AppStateGuard<'_>,
) -> Result<RepoInfo, String> {
    let path = PathBuf::from(&request.path);

    let repo_state = RepoState::open(&path).map_err(|e| e.to_string())?;
    let root = repo_state
        .root()
        .ok_or("No repo root")?
        .to_path_buf();

    // Store repo state
    state.repo.write().clone_from(&repo_state);

    // Run full indexing pipeline
    indexer::index_repository(&state, &root).map_err(|e| e.to_string())?;

    let stats = state.symbol_index.read().stats();

    Ok(RepoInfo {
        root: root.to_string_lossy().into_owned(),
        name: repo_state.name.clone().unwrap_or_default(),
        branch: repo_state.branch.clone(),
        head_commit: repo_state.head_commit.clone(),
        stats,
    })
}

/// Return the file tree for the currently open repository.
#[tauri::command]
pub fn get_repo_tree(state: AppStateGuard<'_>) -> Result<Vec<FileNode>, String> {
    let root = state.repo.read().root().map(|p| p.to_path_buf());

    match root {
        Some(r) => Ok(file_tree::build_tree(&r)),
        None => Err("No repository is open".to_string()),
    }
}

/// Read the raw content of a file.
#[tauri::command]
pub fn open_file(request: OpenFileRequest) -> Result<FileContent, String> {
    let path = PathBuf::from(&request.path);

    if !path.exists() {
        return Err(format!("File not found: {}", path.display()));
    }

    // Validate the path doesn't escape a safe boundary (basic traversal check)
    let canonical = path.canonicalize().map_err(|e| e.to_string())?;
    if canonical.to_string_lossy().contains("..") {
        return Err("Invalid path".to_string());
    }

    // Refuse files larger than 2 MiB to avoid UI freezes
    const MAX_BYTES: u64 = 2 * 1024 * 1024;
    let meta = std::fs::metadata(&canonical).map_err(|e| e.to_string())?;
    if meta.len() > MAX_BYTES {
        return Err(format!(
            "File is too large to display ({} KiB). Only files under 2 MiB are supported.",
            meta.len() / 1024
        ));
    }

    // Read raw bytes first so we can detect binary content
    let bytes = std::fs::read(&canonical).map_err(|e| e.to_string())?;

    // Heuristic: if more than 0.3 % of the first 8 KiB are null bytes, treat as binary
    let probe = &bytes[..bytes.len().min(8192)];
    let null_count = probe.iter().filter(|&&b| b == 0).count();
    if null_count > probe.len() / 333 {
        return Err("Binary file — cannot display in editor.".to_string());
    }

    let content = String::from_utf8(bytes)
        .map_err(|_| "File is not valid UTF-8 (binary or non-UTF-8 encoded).".to_string())?;

    let kind = match canonical.extension().and_then(|e| e.to_str()) {
        Some("rs") => "rust",
        Some("md") => "markdown",
        Some("toml") => "toml",
        _ => "text",
    };

    Ok(FileContent {
        path: canonical.to_string_lossy().into_owned(),
        content,
        kind: kind.to_string(),
    })
}

/// Return all Rust symbols for the repo or a specific file.
#[tauri::command]
pub fn get_rust_symbols(
    request: GetSymbolsRequest,
    state: AppStateGuard<'_>,
) -> Result<Vec<RustItem>, String> {
    let index = state.symbol_index.read();

    let items: Vec<RustItem> = if let Some(file_path) = request.file_path {
        let path = PathBuf::from(file_path);
        index
            .items_for_file(&path)
            .into_iter()
            .cloned()
            .collect()
    } else {
        let mut all: Vec<RustItem> = index.all_items().cloned().collect();

        // Apply kind filter if specified
        if let Some(kind_str) = request.kind_filter {
            all.retain(|item| {
                format!("{:?}", item.kind).to_lowercase() == kind_str.to_lowercase()
            });
        }

        all.sort_by(|a, b| a.qualified_path.cmp(&b.qualified_path));
        all
    };

    Ok(items)
}

/// Return the documentation for a specific symbol by its qualified path.
#[tauri::command]
pub fn get_docs_for_symbol(
    request: GetDocsRequest,
    state: AppStateGuard<'_>,
) -> Result<Option<SymbolDoc>, String> {
    let index = state.symbol_index.read();

    Ok(index.get_doc(&request.qualified_path).cloned())
}

/// Execute a full-text + symbol search query.
#[tauri::command]
pub fn search(query: SearchQuery, state: AppStateGuard<'_>) -> Result<Vec<SearchResult>, String> {
    let engine = state.search.read();
    engine.search(&query).map_err(|e| e.to_string())
}

/// Return the serializable knowledge graph for visualization.
#[tauri::command]
pub fn get_graph(state: AppStateGuard<'_>) -> Result<SerializableGraph, String> {
    let graph = state.graph.read();
    Ok(graph.to_serializable())
}

/// Force a full re-index of the current repository.
#[tauri::command]
pub fn reindex(state: AppStateGuard<'_>) -> Result<IndexStats, String> {
    let root = state.repo.read().root().map(|p| p.to_path_buf());

    match root {
        Some(r) => {
            indexer::index_repository(&state, &r).map_err(|e| e.to_string())?;
            let stats = state.symbol_index.read().stats();
            Ok(stats)
        }
        None => Err("No repository is open".to_string()),
    }
}
