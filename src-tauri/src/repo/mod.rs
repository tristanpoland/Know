// repo/mod.rs — Git + filesystem layer (Agent A)
// Detects Git repo roots, builds file trees, and exposes repository metadata.

pub mod git;
pub mod file_tree;

use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};

/// Overall state of the currently opened repository.
#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct RepoState {
    /// Absolute path to the repository root (where .git lives).
    pub root: Option<PathBuf>,
    /// Repository name derived from the directory name.
    pub name: Option<String>,
    /// Current HEAD commit hash (short).
    pub head_commit: Option<String>,
    /// Current branch name.
    pub branch: Option<String>,
}

impl RepoState {
    /// Open a repository at the given path.
    pub fn open(path: &Path) -> anyhow::Result<Self> {
        let root = git::find_repo_root(path)?;
        let name = root
            .file_name()
            .map(|n| n.to_string_lossy().into_owned());
        let (head_commit, branch) = git::get_head_info(&root).unwrap_or_default();

        Ok(Self {
            root: Some(root),
            name,
            head_commit,
            branch,
        })
    }

    pub fn root(&self) -> Option<&Path> {
        self.root.as_deref()
    }
}
