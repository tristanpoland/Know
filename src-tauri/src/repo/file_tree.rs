// repo/file_tree.rs — Builds a hierarchical file tree from the repository.

use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use walkdir::WalkDir;

/// A node in the repository file tree.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    /// Display name of this entry.
    pub name: String,
    /// Absolute path.
    pub path: PathBuf,
    /// Whether this node is a directory.
    pub is_dir: bool,
    /// File kind classification.
    pub kind: FileKind,
    /// Children (non-empty only for directories).
    pub children: Vec<FileNode>,
}

/// Classifies files we care about.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum FileKind {
    RustSource,
    Markdown,
    Toml,
    Other,
    Directory,
}

impl FileKind {
    fn from_path(path: &Path) -> Self {
        if path.is_dir() {
            return FileKind::Directory;
        }
        match path.extension().and_then(|e| e.to_str()) {
            Some("rs") => FileKind::RustSource,
            Some("md") => FileKind::Markdown,
            Some("toml") => FileKind::Toml,
            _ => FileKind::Other,
        }
    }
}

/// Build a file tree rooted at `root`, respecting common ignore patterns.
pub fn build_tree(root: &Path) -> Vec<FileNode> {
    build_node(root, root)
        .map(|n| n.children)
        .unwrap_or_default()
}

fn build_node(root: &Path, path: &Path) -> Option<FileNode> {
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| path.to_string_lossy().into_owned());

    if should_ignore(&name, path) {
        return None;
    }

    if path.is_dir() {
        let mut children: Vec<FileNode> = std::fs::read_dir(path)
            .ok()?
            .filter_map(|entry| {
                let entry = entry.ok()?;
                build_node(root, &entry.path())
            })
            .collect();

        children.sort_by(|a, b| {
            // Directories first, then alphabetical.
            match (a.is_dir, b.is_dir) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.name.cmp(&b.name),
            }
        });

        Some(FileNode {
            name,
            path: path.to_path_buf(),
            is_dir: true,
            kind: FileKind::Directory,
            children,
        })
    } else {
        Some(FileNode {
            name,
            path: path.to_path_buf(),
            is_dir: false,
            kind: FileKind::from_path(path),
            children: Vec::new(),
        })
    }
}

/// Returns `true` for directories and files that should be excluded from the tree.
fn should_ignore(name: &str, path: &Path) -> bool {
    let ignored_dirs = [
        "target", ".git", "node_modules", ".cargo", "dist", "build", "__pycache__",
        ".idea", ".vscode",
    ];
    let ignored_files = [".DS_Store", "Thumbs.db"];

    if path.is_dir() {
        ignored_dirs.contains(&name)
    } else {
        ignored_files.contains(&name)
    }
}

/// Flatten a tree into a sorted list of all file paths matching a predicate.
pub fn flatten_files<'a>(
    nodes: &'a [FileNode],
    predicate: impl Fn(&FileNode) -> bool + Copy,
) -> Vec<&'a FileNode> {
    let mut result = Vec::new();
    for node in nodes {
        if !node.is_dir && predicate(node) {
            result.push(node);
        }
        if node.is_dir {
            result.extend(flatten_files(&node.children, predicate));
        }
    }
    result
}
