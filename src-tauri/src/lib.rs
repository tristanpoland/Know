// lib.rs — Know library root
// Orchestrates all backend modules and the Tauri application.

pub mod repo;
pub mod fs_watcher;
pub mod rust_parser;
pub mod doc_extractor;
pub mod symbol_index;
pub mod graph_engine;
pub mod search;
pub mod api;

use parking_lot::RwLock;
use std::sync::Arc;
use tauri::Manager;

use symbol_index::SymbolIndex;
use graph_engine::KnowledgeGraph;
use search::SearchEngine;
use repo::RepoState;

/// Global application state managed by Tauri.
/// Each field is individually lock-guarded for fine-grained concurrency.
pub struct AppState {
    pub repo: RwLock<RepoState>,
    pub symbol_index: RwLock<SymbolIndex>,
    pub graph: RwLock<KnowledgeGraph>,
    pub search: RwLock<SearchEngine>,
}

// Safety: RwLock<T> is Sync when T: Send.
unsafe impl Sync for AppState {}
unsafe impl Send for AppState {}

impl AppState {
    pub fn new() -> anyhow::Result<Self> {
        Ok(Self {
            repo: RwLock::new(RepoState::default()),
            symbol_index: RwLock::new(SymbolIndex::new()),
            graph: RwLock::new(KnowledgeGraph::new()),
            search: RwLock::new(SearchEngine::new()?),
        })
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    let state = AppState::new().expect("Failed to initialize app state");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(Arc::new(state))
        .invoke_handler(tauri::generate_handler![
            api::commands::open_repo,
            api::commands::get_repo_tree,
            api::commands::open_file,
            api::commands::get_rust_symbols,
            api::commands::get_docs_for_symbol,
            api::commands::search,
            api::commands::get_graph,
            api::commands::reindex,
        ])
        .setup(|app| {
            let _window = app.get_webview_window("main").unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Know application");
}
