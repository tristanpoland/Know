// components/RustdocExplorer.tsx — Rustdoc-style symbol browser (Core MVP Feature)
// Three-pane layout: module tree | symbol list | symbol detail
import React, { useState, useMemo } from "react";
import { useStore, RustItem, RustItemKind, SymbolDoc } from "../store";
import "./RustdocExplorer.css";

const KIND_COLORS: Record<string, string> = {
  struct: "#4dabf7",
  enum: "#69db7c",
  trait: "#cc5de8",
  function: "#ffa94d",
  method: "#ffd43b",
  impl_block: "#909296",
  module: "#74c0fc",
  type_alias: "#63e6be",
  constant: "#ff6b6b",
  static: "#ff6b6b",
  macro: "#da77f2",
  use: "#909296",
};

const KIND_ORDER: RustItemKind[] = [
  "module", "struct", "enum", "trait", "type_alias",
  "function", "method", "constant", "static", "macro",
];

type KindFilter = RustItemKind | "all";

export function RustdocExplorer() {
  const rustSymbols = useStore((s) => s.rustSymbols);
  const selectedSymbol = useStore((s) => s.selectedSymbol);
  const selectSymbol = useStore((s) => s.selectSymbol);
  const openFilePath = useStore((s) => s.openFilePath);
  const setActiveView = useStore((s) => s.setActiveView);
  const repoInfo = useStore((s) => s.repoInfo);

  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [nameFilter, setNameFilter] = useState("");

  // Build module list
  const modules = useMemo(() => {
    const mods = new Set<string>(["all"]);
    for (const item of rustSymbols) {
      if (item.module_path.length > 0) {
        mods.add(item.module_path.join("::"));
      } else {
        mods.add("(root)");
      }
    }
    return Array.from(mods).sort();
  }, [rustSymbols]);

  // Filter symbols
  const filtered = useMemo(() => {
    let items = rustSymbols;

    if (kindFilter !== "all") {
      items = items.filter((i) => i.kind === kindFilter);
    }

    if (moduleFilter !== "all") {
      if (moduleFilter === "(root)") {
        items = items.filter((i) => i.module_path.length === 0);
      } else {
        items = items.filter((i) => i.module_path.join("::") === moduleFilter);
      }
    }

    if (nameFilter) {
      const q = nameFilter.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.qualified_path.toLowerCase().includes(q)
      );
    }

    // Sort by kind order then name
    items = [...items].sort((a, b) => {
      const ka = KIND_ORDER.indexOf(a.kind);
      const kb = KIND_ORDER.indexOf(b.kind);
      if (ka !== kb) return ka - kb;
      return a.name.localeCompare(b.name);
    });

    return items;
  }, [rustSymbols, kindFilter, moduleFilter, nameFilter]);

  const handleJumpToSource = async () => {
    if (!selectedSymbol) return;
    await openFilePath(selectedSymbol.file_path);
    setActiveView("explorer");
  };

  return (
    <div className="rustdoc-explorer">
      {/* Left: Module tree */}
      <div className="rustdoc-modules">
        <div className="rustdoc-panel-header">
          {repoInfo?.name ?? "Crate"}
        </div>
        <div className="module-list">
          {modules.map((mod) => (
            <button
              key={mod}
              className={`module-item ${moduleFilter === mod ? "active" : ""}`}
              onClick={() => setModuleFilter(mod)}
            >
              <span className="module-icon">📦</span>
              <span className="module-name">{mod}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Symbol list */}
      <div className="rustdoc-symbols">
        <div className="rustdoc-panel-header">
          <input
            className="symbol-search"
            placeholder="Filter symbols…"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </div>
        <div className="kind-filters">
          {(["all", ...KIND_ORDER] as (KindFilter)[]).map((k) => (
            <button
              key={k}
              className={`kind-chip ${kindFilter === k ? "active" : ""}`}
              style={
                k !== "all"
                  ? { borderColor: KIND_COLORS[k] ?? "transparent" }
                  : {}
              }
              onClick={() => setKindFilter(k)}
            >
              {k === "all" ? "All" : k}
            </button>
          ))}
        </div>
        <div className="symbol-list">
          {filtered.length === 0 ? (
            <div className="symbol-empty">No symbols found</div>
          ) : (
            filtered.map((item) => (
              <SymbolRow
                key={item.qualified_path}
                item={item}
                isSelected={selectedSymbol?.qualified_path === item.qualified_path}
                onClick={() => selectSymbol(item.qualified_path)}
              />
            ))
          )}
        </div>
        <div className="symbol-count">{filtered.length} symbols</div>
      </div>

      {/* Right: Symbol detail */}
      <div className="rustdoc-detail">
        {selectedSymbol ? (
          <SymbolDetail doc={selectedSymbol} onJumpToSource={handleJumpToSource} />
        ) : (
          <div className="detail-empty">
            <p>Select a symbol to see its documentation</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SymbolRow({
  item,
  isSelected,
  onClick,
}: {
  item: RustItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = KIND_COLORS[item.kind] ?? "#909296";

  return (
    <button
      className={`symbol-row ${isSelected ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="symbol-kind-badge" style={{ color, borderColor: color }}>
        {kindAbbrev(item.kind)}
      </span>
      <div className="symbol-info">
        <span className="symbol-name">{item.name}</span>
        {item.module_path.length > 0 && (
          <span className="symbol-path">{item.module_path.join("::")}</span>
        )}
      </div>
      {item.docs && <span className="symbol-has-doc" title="Has documentation">●</span>}
    </button>
  );
}

function SymbolDetail({
  doc,
  onJumpToSource,
}: {
  doc: SymbolDoc;
  onJumpToSource: () => void;
}) {
  const color = KIND_COLORS[doc.kind] ?? "#909296";

  return (
    <div className="symbol-detail">
      <div className="detail-header">
        <span className="detail-kind" style={{ color }}>
          {doc.kind}
        </span>
        <h2 className="detail-name">{doc.name}</h2>
        {doc.signature && (
          <pre className="detail-signature">{doc.signature}</pre>
        )}
        <div className="detail-meta">
          {doc.module_path.length > 0 && (
            <span className="detail-module">{doc.module_path.join("::")}</span>
          )}
          {doc.impl_trait && (
            <span className="detail-impl-trait">impl {doc.impl_trait}</span>
          )}
        </div>
        <button className="jump-to-source-btn" onClick={onJumpToSource} title={`${doc.file_path}:${doc.start_line}`}>
          Jump to source (line {doc.start_line})
        </button>
      </div>

      <div className="detail-body">
        {doc.doc_html ? (
          <div
            className="rustdoc-html"
            dangerouslySetInnerHTML={{ __html: doc.doc_html }}
          />
        ) : (
          <div className="no-docs">No documentation available.</div>
        )}

        {doc.sections.length > 0 && (
          <div className="doc-sections">
            {doc.sections.map((section) => (
              <div key={section.title} className="doc-section">
                <h3 className="doc-section-title">{section.title}</h3>
                <pre className="doc-section-content">{section.content}</pre>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="detail-footer">
        <span className="detail-path">{doc.qualified_path}</span>
      </div>
    </div>
  );
}

function kindAbbrev(kind: RustItemKind): string {
  const map: Record<RustItemKind, string> = {
    struct: "str",
    enum: "enm",
    trait: "trt",
    function: "fn",
    method: "mth",
    impl_block: "imp",
    module: "mod",
    type_alias: "typ",
    constant: "cst",
    static: "stc",
    macro: "mac",
    use: "use",
  };
  return map[kind] ?? kind.slice(0, 3);
}
