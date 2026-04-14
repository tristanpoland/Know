// components/SearchView.tsx — Unified full-text search interface (Agent E UI)
import React, { useState, useCallback } from "react";
import { useStore, SearchResult } from "../store";
import "./SearchView.css";

export function SearchView() {
  const runSearch = useStore((s) => s.runSearch);
  const searchResults = useStore((s) => s.searchResults);
  const openFilePath = useStore((s) => s.openFilePath);
  const selectSymbol = useStore((s) => s.selectSymbol);
  const setActiveView = useStore((s) => s.setActiveView);

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(
    async (q: string) => {
      setQuery(q);
      if (q.trim().length < 2) return;
      setIsSearching(true);
      await runSearch(q);
      setIsSearching(false);
    },
    [runSearch]
  );

  const handleResultClick = async (result: SearchResult) => {
    if (result.kind === "rust_symbol" || result.kind === "doc_comment") {
      await selectSymbol(result.path);
      setActiveView("rustdoc");
    } else {
      await openFilePath(result.path);
      setActiveView("explorer");
    }
  };

  return (
    <div className="search-view">
      <div className="search-header">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search symbols, docs, and files…"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          {isSearching && <span className="search-spinner">⟳</span>}
        </div>
      </div>

      <div className="search-results">
        {searchResults.length === 0 && query.length >= 2 && !isSearching && (
          <div className="search-empty">No results for "{query}"</div>
        )}
        {searchResults.length === 0 && query.length < 2 && (
          <div className="search-hint">
            <p>Type at least 2 characters to search across:</p>
            <ul>
              <li>🦀 Rust symbols and their documentation</li>
              <li>📝 Markdown files</li>
              <li>📦 Module paths and signatures</li>
            </ul>
          </div>
        )}
        {searchResults.map((result, i) => (
          <SearchResultRow
            key={`${result.path}-${i}`}
            result={result}
            onClick={() => handleResultClick(result)}
          />
        ))}
      </div>

      {searchResults.length > 0 && (
        <div className="search-footer">{searchResults.length} results</div>
      )}
    </div>
  );
}

function SearchResultRow({
  result,
  onClick,
}: {
  result: SearchResult;
  onClick: () => void;
}) {
  const kindColor: Record<string, string> = {
    rust_symbol: "#4dabf7",
    doc_comment: "#69db7c",
    markdown: "#ffa94d",
    rust_source: "#cc5de8",
  };

  const kindLabel: Record<string, string> = {
    rust_symbol: "symbol",
    doc_comment: "docs",
    markdown: "markdown",
    rust_source: "source",
  };

  const color = kindColor[result.kind] ?? "#909296";
  const label = kindLabel[result.kind] ?? result.kind;

  // Extract just the filename or last segment
  const shortPath = result.path.split(/[/\\]/).pop() ?? result.path;

  return (
    <button className="search-result-row" onClick={onClick}>
      <div className="search-result-header">
        <span className="result-kind-badge" style={{ color, borderColor: color }}>
          {label}
        </span>
        <span className="result-title">{result.title}</span>
        <span className="result-score">{(result.score * 100).toFixed(0)}%</span>
      </div>
      <div className="result-path">{shortPath}{result.line > 0 ? `:${result.line}` : ""}</div>
      {result.snippet && (
        <div className="result-snippet">{result.snippet}</div>
      )}
    </button>
  );
}
