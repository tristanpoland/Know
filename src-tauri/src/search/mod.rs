// search/mod.rs — Full-text and symbol search (Agent E)
// Uses tantivy for full-text search across Rust source, docs, and markdown.

use std::path::PathBuf;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use tantivy::{
    collector::TopDocs,
    doc,
    query::QueryParser,
    schema::{Schema, SchemaBuilder, FAST, STORED, TEXT},
    Index, IndexWriter, TantivyDocument,
};

use crate::rust_parser::types::RustItem;

const HEAP_SIZE: usize = 50_000_000; // 50 MB

/// A single search result.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    /// What kind of content matched.
    pub kind: SearchResultKind,
    /// Display title (symbol name or file name).
    pub title: String,
    /// Qualified path or file path.
    pub path: String,
    /// Snippet of the matched content.
    pub snippet: String,
    /// Relevance score from tantivy.
    pub score: f32,
    /// Line number hint (0 if unavailable).
    pub line: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SearchResultKind {
    RustSymbol,
    DocComment,
    Markdown,
    RustSource,
}

/// Parameters for a search query.
#[derive(Debug, Clone, Deserialize)]
pub struct SearchQuery {
    pub query: String,
    pub limit: Option<usize>,
    pub kinds: Option<Vec<String>>,
}

/// The search engine wrapping a tantivy index.
pub struct SearchEngine {
    index: Index,
    schema: SearchSchema,
    writer: Option<IndexWriter>,
}

struct SearchSchema {
    schema: Schema,
    kind: tantivy::schema::Field,
    title: tantivy::schema::Field,
    path: tantivy::schema::Field,
    body: tantivy::schema::Field,
    line: tantivy::schema::Field,
}

impl SearchEngine {
    pub fn new() -> Result<Self> {
        let mut builder = SchemaBuilder::new();
        let kind = builder.add_text_field("kind", STORED | FAST);
        let title = builder.add_text_field("title", TEXT | STORED);
        let path = builder.add_text_field("path", STORED | FAST);
        let body = builder.add_text_field("body", TEXT | STORED);
        let line = builder.add_u64_field("line", STORED | FAST);
        let schema = builder.build();

        let index = Index::create_in_ram(schema.clone());

        Ok(Self {
            index,
            schema: SearchSchema { schema, kind, title, path, body, line },
            writer: None,
        })
    }

    fn writer(&mut self) -> Result<&mut IndexWriter> {
        if self.writer.is_none() {
            self.writer = Some(
                self.index
                    .writer(HEAP_SIZE)
                    .context("Failed to create tantivy writer")?,
            );
        }
        Ok(self.writer.as_mut().unwrap())
    }

    /// Index a Rust symbol and its documentation.
    pub fn index_symbol(&mut self, item: &RustItem) -> Result<()> {
        let writer = self.writer()?;

        // Delete existing document with this path
        let path_term = tantivy::Term::from_field_text(
            self.schema.path,
            &item.qualified_path,
        );
        writer.delete_term(path_term);

        let body = item.docs.as_deref().unwrap_or_default();
        let kind = format!("{:?}", item.kind).to_lowercase();

        writer.add_document(doc!(
            self.schema.kind => kind.as_str(),
            self.schema.title => item.name.as_str(),
            self.schema.path => item.qualified_path.as_str(),
            self.schema.body => body,
            self.schema.line => item.span.start_line as u64,
        ))?;

        Ok(())
    }

    /// Index a Markdown file's content.
    pub fn index_markdown(&mut self, file_path: &PathBuf, title: &str, content: &str) -> Result<()> {
        let writer = self.writer()?;
        let path_str = file_path.to_string_lossy();

        let path_term = tantivy::Term::from_field_text(self.schema.path, &path_str);
        writer.delete_term(path_term);

        writer.add_document(doc!(
            self.schema.kind => "markdown",
            self.schema.title => title,
            self.schema.path => path_str.as_ref(),
            self.schema.body => content,
            self.schema.line => 0u64,
        ))?;

        Ok(())
    }

    /// Commit all pending index writes.
    pub fn commit(&mut self) -> Result<()> {
        if let Some(writer) = &mut self.writer {
            writer.commit().context("Failed to commit search index")?;
        }
        Ok(())
    }

    /// Execute a full-text search query.
    pub fn search(&self, query: &SearchQuery) -> Result<Vec<SearchResult>> {
        let reader = self
            .index
            .reader()
            .context("Failed to open index reader")?;
        let searcher = reader.searcher();

        let limit = query.limit.unwrap_or(25).min(100);

        let query_parser = QueryParser::for_index(
            &self.index,
            vec![self.schema.title, self.schema.body],
        );

        let parsed_query = query_parser
            .parse_query(&escape_query(&query.query))
            .context("Failed to parse search query")?;

        let top_docs = searcher
            .search(&parsed_query, &TopDocs::with_limit(limit))
            .context("Search execution failed")?;

        let mut results = Vec::new();
        for (score, doc_addr) in top_docs {
            if let Ok(retrieved) = searcher.doc::<TantivyDocument>(doc_addr) {
                let get_text = |field: tantivy::schema::Field| -> String {
                    retrieved
                        .get_first(field)
                        .and_then(|v| v.as_str())
                        .unwrap_or_default()
                        .to_string()
                };
                let get_u64 = |field: tantivy::schema::Field| -> u64 {
                    retrieved.get_first(field).and_then(|v| v.as_u64()).unwrap_or(0)
                };

                let kind_str = get_text(self.schema.kind);
                let kind = match kind_str.as_str() {
                    "markdown" => SearchResultKind::Markdown,
                    k if k.contains("fn") || k.contains("method") => SearchResultKind::RustSymbol,
                    _ => SearchResultKind::RustSymbol,
                };

                let body = get_text(self.schema.body);
                let snippet = body.chars().take(200).collect::<String>();

                results.push(SearchResult {
                    kind,
                    title: get_text(self.schema.title),
                    path: get_text(self.schema.path),
                    snippet,
                    score,
                    line: get_u64(self.schema.line) as usize,
                });
            }
        }

        Ok(results)
    }

    /// Remove all indexed content for a specific file path.
    pub fn remove_file(&mut self, path: &PathBuf) -> Result<()> {
        let writer = self.writer()?;
        let path_str = path.to_string_lossy();
        let path_term = tantivy::Term::from_field_text(self.schema.path, &path_str);
        writer.delete_term(path_term);
        Ok(())
    }
}

/// Escape special characters in user query to prevent tantivy parse errors.
fn escape_query(q: &str) -> String {
    // For MVP: just trim and replace problematic chars
    q.chars()
        .map(|c| match c {
            '+' | '-' | '&' | '|' | '!' | '(' | ')' | '{' | '}' | '[' | ']'
            | '^' | '"' | '~' | '*' | '?' | ':' | '\\' | '/' => ' ',
            c => c,
        })
        .collect::<String>()
        .trim()
        .to_string()
}
