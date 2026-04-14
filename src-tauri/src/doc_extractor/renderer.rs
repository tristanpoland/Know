// doc_extractor/renderer.rs — Markdown → HTML rendering for doc comments.
// Uses pulldown-cmark to render rustdoc-style documentation.

use pulldown_cmark::{html, Options, Parser};

/// Render a Markdown string to HTML using rustdoc-compatible options.
pub fn render_markdown(input: &str) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_SMART_PUNCTUATION);

    let parser = Parser::new_ext(input, options);
    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);
    html_output
}
