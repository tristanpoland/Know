// repo/git.rs — Git integration using git2
// Detects repo roots and reads metadata without invoking external processes.

use std::path::{Path, PathBuf};
use anyhow::{Context, Result};

/// Walk upward from `start` until a `.git` directory is found.
pub fn find_repo_root(start: &Path) -> Result<PathBuf> {
    let repo = git2::Repository::discover(start)
        .with_context(|| format!("No Git repository found at or above: {}", start.display()))?;
    let workdir = repo
        .workdir()
        .with_context(|| "Repository has no working directory (bare repo?)")?;
    Ok(workdir.to_path_buf())
}

/// Returns (short_commit_hash, branch_name) for the current HEAD.
pub fn get_head_info(root: &Path) -> Result<(Option<String>, Option<String>)> {
    let repo = git2::Repository::open(root)?;
    let head = match repo.head() {
        Ok(h) => h,
        Err(_) => return Ok((None, None)),
    };

    let branch = if head.is_branch() {
        head.shorthand().map(|s| s.to_string())
    } else {
        Some("(detached HEAD)".to_string())
    };

    let commit = head.peel_to_commit().ok().map(|c| {
        let id = c.id();
        format!("{:.7}", id)
    });

    Ok((commit, branch))
}

/// List all tracked `.rs` and `.md` files in the repository.
pub fn list_tracked_files(root: &Path) -> Result<Vec<PathBuf>> {
    let repo = git2::Repository::open(root)?;
    let index = repo.index()?;

    let mut files = Vec::new();
    for entry in index.iter() {
        let path_bytes = entry.path.clone();
        let rel = match std::str::from_utf8(&path_bytes) {
            Ok(s) => PathBuf::from(s),
            Err(_) => continue,
        };
        let abs = root.join(&rel);
        let ext = rel.extension().and_then(|e| e.to_str()).unwrap_or("");
        if matches!(ext, "rs" | "md" | "toml") {
            files.push(abs);
        }
    }
    Ok(files)
}
