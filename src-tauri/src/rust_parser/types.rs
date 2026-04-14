// rust_parser/types.rs — Core data model for parsed Rust items.
// This is the global contract shared across all agents.

use std::path::PathBuf;
use serde::{Deserialize, Serialize};

/// The kind of Rust item extracted from the AST.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RustItemKind {
    Struct,
    Enum,
    Trait,
    Function,
    Method,
    ImplBlock,
    Module,
    TypeAlias,
    Constant,
    Static,
    Macro,
    Use,
}

/// Source location (line-based, 1-indexed).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Span {
    pub start_line: usize,
    pub end_line: usize,
    pub start_col: usize,
    pub end_col: usize,
}

impl Default for Span {
    fn default() -> Self {
        Self { start_line: 1, end_line: 1, start_col: 0, end_col: 0 }
    }
}

/// A fully-resolved Rust item extracted from AST parsing.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RustItem {
    /// Item's simple name (e.g. `MyStruct`).
    pub name: String,
    /// Fully qualified path within the module hierarchy (e.g. `mycrate::utils::MyStruct`).
    pub qualified_path: String,
    /// What kind of item this is.
    pub kind: RustItemKind,
    /// Extracted documentation comment (cleaned of `///` prefixes).
    pub docs: Option<String>,
    /// Absolute path to the source file.
    pub file_path: PathBuf,
    /// Source location within the file.
    pub span: Span,
    /// For impl blocks: the type being implemented.
    pub impl_for: Option<String>,
    /// For trait impls: the trait being implemented.
    pub impl_trait: Option<String>,
    /// Visibility (pub, pub(crate), private).
    pub visibility: Visibility,
    /// Generic parameters (rendered as a string, e.g. `<T: Clone>`).
    pub generics: Option<String>,
    /// For functions/methods: parameter list as a string.
    pub signature: Option<String>,
    /// Parent module path.
    pub module_path: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Visibility {
    Public,
    PublicCrate,
    PublicSuper,
    Private,
}

impl RustItem {
    pub fn display_path(&self) -> &str {
        &self.qualified_path
    }
}
