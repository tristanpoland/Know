// components/FileExplorer.tsx — Hierarchical file tree (Agent G)
import { useState } from "react";
import { useStore, FileNode } from "../store";
import "./FileExplorer.css";

export function FileExplorer() {
  const fileTree = useStore((s) => s.fileTree);
  const loadSymbols = useStore((s) => s.loadSymbols);
  const openFileTab = useStore((s) => s.openFileTab);

  const handleFileClick = async (node: FileNode) => {
    if (node.is_dir) return;
    openFileTab(node.path, node.name, node.kind);
    if (node.kind === "rust_source") {
      await loadSymbols(node.path);
    }
  };

  if (fileTree.length === 0) {
    return <div className="explorer-empty">No files found</div>;
  }

  return (
    <div className="file-explorer">
      {fileTree.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          depth={0}
          onFileClick={handleFileClick}
        />
      ))}
    </div>
  );
}

function FileTreeNode({
  node,
  depth,
  onFileClick,
}: {
  node: FileNode;
  depth: number;
  onFileClick: (n: FileNode) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const tabs = useStore((s) => s.tabs);
  const activeTabId = useStore((s) => s.activeTabId);
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isActive = activeTab?.type === "file" && activeTab?.path === node.path;

  const indent = depth * 12;

  if (node.is_dir) {
    return (
      <div>
        <button
          className="tree-row dir-row"
          style={{ paddingLeft: 8 + indent }}
          onClick={() => setExpanded((e) => !e)}
        >
          <span className="tree-arrow">{expanded ? "▾" : "▸"}</span>
          <span className="tree-icon">📂</span>
          <span className="tree-name">{node.name}</span>
        </button>
        {expanded && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                onFileClick={onFileClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      className={`tree-row file-row ${isActive ? "active" : ""}`}
      style={{ paddingLeft: 8 + indent + 16 }}
      onClick={() => onFileClick(node)}
      title={node.path}
    >
      <span className="tree-icon">{fileIcon(node.kind)}</span>
      <span className="tree-name">{node.name}</span>
    </button>
  );
}

function fileIcon(kind: string): string {
  switch (kind) {
    case "rust_source": return "🦀";
    case "markdown": return "📝";
    case "toml": return "⚙";
    default: return "📄";
  }
}

export default FileExplorer;