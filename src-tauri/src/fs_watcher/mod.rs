// fs_watcher/mod.rs — Incremental file watching (Agent A - file events)
// Uses notify + debouncing to emit change events without full repo reindexing.

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

use anyhow::Result;
use notify::RecursiveMode;
use notify_debouncer_mini::{new_debouncer, DebouncedEvent, DebouncedEventKind};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

/// The kind of filesystem change that occurred.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum FileChangeKind {
    Created,
    Modified,
    Deleted,
    Renamed { to: PathBuf },
}

/// A single file change event emitted to downstream consumers.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChangeEvent {
    pub path: PathBuf,
    pub kind: FileChangeKind,
}

impl FileChangeEvent {
    /// Whether this event involves a Rust source file.
    pub fn is_rust(&self) -> bool {
        self.path.extension().and_then(|e| e.to_str()) == Some("rs")
    }

    /// Whether this event involves a Markdown file.
    pub fn is_markdown(&self) -> bool {
        self.path.extension().and_then(|e| e.to_str()) == Some("md")
    }
}

/// Starts watching `root` for changes.
/// Returns a receiver that emits batched `FileChangeEvent` vectors.
pub fn start_watcher(
    root: PathBuf,
) -> Result<mpsc::UnboundedReceiver<Vec<FileChangeEvent>>> {
    let (tx, rx) = mpsc::unbounded_channel::<Vec<FileChangeEvent>>();

    std::thread::spawn(move || {
        let (debounce_tx, debounce_rx) = std::sync::mpsc::channel();

        let mut debouncer = new_debouncer(Duration::from_millis(300), debounce_tx)
            .expect("Failed to create debouncer");

        debouncer
            .watcher()
            .watch(&root, RecursiveMode::Recursive)
            .expect("Failed to start file watcher");

        for result in debounce_rx {
            match result {
                Ok(events) => {
                    let changes: Vec<FileChangeEvent> = events
                        .iter()
                        .filter_map(|e| convert_event(e))
                        .filter(|e| is_relevant(&e.path))
                        .collect();

                    if !changes.is_empty() {
                        let _ = tx.send(changes);
                    }
                }
                Err(errors) => {
                    log::warn!("File watcher error: {:?}", errors);
                }
            }
        }
    });

    Ok(rx)
}

fn convert_event(event: &DebouncedEvent) -> Option<FileChangeEvent> {
    // notify_debouncer_mini collapses events into Any/AnyContinuous;
    // treat all as Modified — the indexer will re-parse the file regardless.
    let path = event.path.clone();
    let kind = match event.kind {
        DebouncedEventKind::Any | DebouncedEventKind::AnyContinuous => FileChangeKind::Modified,
        _ => FileChangeKind::Modified,
    };
    Some(FileChangeEvent { path, kind })
}

fn is_relevant(path: &Path) -> bool {
    // Ignore target/ and hidden directories
    let path_str = path.to_string_lossy();
    if path_str.contains("/target/") || path_str.contains("\\target\\") {
        return false;
    }
    if path_str.contains("/.git/") || path_str.contains("\\.git\\") {
        return false;
    }
    match path.extension().and_then(|e| e.to_str()) {
        Some("rs") | Some("md") | Some("toml") => true,
        _ => false,
    }
}
