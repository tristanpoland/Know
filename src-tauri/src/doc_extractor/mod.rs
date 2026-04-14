// doc_extractor/mod.rs — Documentation extraction agent (Agent C)
// Builds rustdoc-like structured documentation from parsed RustItems.
// Merges doc comments, resolves module hierarchy, and links symbols.

pub mod renderer;

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};

use crate::rust_parser::types::{RustItem, RustItemKind};

/// A fully structured documentation entry for a single symbol.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SymbolDoc {
    /// Qualified path of the symbol (e.g. `mycrate::utils::MyStruct`).
    pub qualified_path: String,
    /// Simple name of the symbol.
    pub name: String,
    /// Item kind.
    pub kind: RustItemKind,
    /// Rendered HTML documentation (converted from Markdown doc comments).
    pub doc_html: Option<String>,
    /// Raw documentation text.
    pub doc_text: Option<String>,
    /// Source file path.
    pub file_path: PathBuf,
    /// Line number in source.
    pub start_line: usize,
    /// Signature string (for functions/methods).
    pub signature: Option<String>,
    /// Module breadcrumb path.
    pub module_path: Vec<String>,
    /// Any `impl` block this symbol belongs to.
    pub impl_for: Option<String>,
    /// Trait being implemented (if any).
    pub impl_trait: Option<String>,
    /// Section links extracted from doc text (e.g. `# Examples`).
    pub sections: Vec<DocSection>,
}

/// A named section within documentation (e.g. Examples, Panics, Safety).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocSection {
    pub title: String,
    pub content: String,
}

/// A crate-level documentation structure (mirrors rustdoc output).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CrateDoc {
    /// Crate name.
    pub name: String,
    /// Module tree.
    pub modules: Vec<ModuleDoc>,
    /// All symbols indexed by qualified path.
    pub symbols: HashMap<String, SymbolDoc>,
}

/// Documentation for a module.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleDoc {
    pub path: Vec<String>,
    pub doc_text: Option<String>,
    pub doc_html: Option<String>,
    pub children: Vec<String>, // qualified paths of direct children
}

/// Build a `CrateDoc` from a collection of `RustItem`s.
pub fn build_crate_doc(crate_name: &str, items: &[RustItem]) -> CrateDoc {
    let mut doc = CrateDoc {
        name: crate_name.to_string(),
        modules: Vec::new(),
        symbols: HashMap::new(),
    };

    // Group items by module path
    let mut module_children: HashMap<String, Vec<String>> = HashMap::new();

    for item in items {
        let sym_doc = item_to_symbol_doc(item);
        let module_key = item.module_path.join("::");
        module_children
            .entry(module_key)
            .or_default()
            .push(item.qualified_path.clone());

        doc.symbols.insert(item.qualified_path.clone(), sym_doc);
    }

    // Build module list
    let mut seen_modules = std::collections::HashSet::new();
    for item in items {
        let key = item.module_path.join("::");
        if !seen_modules.contains(&key) {
            seen_modules.insert(key.clone());

            // Find module doc comment (from Module items at this path)
            let module_doc_item = items.iter().find(|i| {
                i.kind == RustItemKind::Module && i.module_path.join("::") == key
            });

            let (doc_text, doc_html) = module_doc_item
                .and_then(|i| i.docs.as_ref())
                .map(|d| {
                    let html = renderer::render_markdown(d);
                    (Some(d.clone()), Some(html))
                })
                .unwrap_or((None, None));

            doc.modules.push(ModuleDoc {
                path: item.module_path.clone(),
                doc_text,
                doc_html,
                children: module_children.get(&key).cloned().unwrap_or_default(),
            });
        }
    }

    // Sort modules by path depth
    doc.modules.sort_by_key(|m| m.path.len());

    doc
}

fn item_to_symbol_doc(item: &RustItem) -> SymbolDoc {
    let (doc_text, doc_html, sections) = match &item.docs {
        Some(d) => {
            let html = renderer::render_markdown(d);
            let secs = extract_sections(d);
            (Some(d.clone()), Some(html), secs)
        }
        None => (None, None, Vec::new()),
    };

    SymbolDoc {
        qualified_path: item.qualified_path.clone(),
        name: item.name.clone(),
        kind: item.kind.clone(),
        doc_html,
        doc_text,
        file_path: item.file_path.clone(),
        start_line: item.span.start_line,
        signature: item.signature.clone(),
        module_path: item.module_path.clone(),
        impl_for: item.impl_for.clone(),
        impl_trait: item.impl_trait.clone(),
        sections,
    }
}

/// Extract named sections (e.g. `# Examples`) from doc text.
fn extract_sections(doc: &str) -> Vec<DocSection> {
    let mut sections = Vec::new();
    let mut current_title: Option<String> = None;
    let mut current_content = String::new();

    for line in doc.lines() {
        if let Some(title) = line.strip_prefix("# ") {
            if let Some(t) = current_title.take() {
                sections.push(DocSection {
                    title: t,
                    content: current_content.trim().to_string(),
                });
                current_content.clear();
            }
            current_title = Some(title.trim().to_string());
        } else if current_title.is_some() {
            current_content.push_str(line);
            current_content.push('\n');
        }
    }

    if let Some(t) = current_title {
        sections.push(DocSection {
            title: t,
            content: current_content.trim().to_string(),
        });
    }

    sections
}
