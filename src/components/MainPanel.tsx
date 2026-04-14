// components/MainPanel.tsx — Central content area
// Routes between views: Code Editor, Rustdoc Explorer, Search, Graph
import React from "react";
import { useStore } from "../store";
import { CodeViewer } from "./CodeViewer";
import { RustdocExplorer } from "./RustdocExplorer";
import { SearchView } from "./SearchView";
import { GraphView } from "./GraphView";
import "./MainPanel.css";

export function MainPanel() {
  const activeView = useStore((s) => s.activeView);
  const openFile = useStore((s) => s.openFile);

  return (
    <main className="main-panel">
      {activeView === "rustdoc" ? (
        <RustdocExplorer />
      ) : activeView === "search" ? (
        <SearchView />
      ) : activeView === "graph" ? (
        <GraphView />
      ) : openFile ? (
        <CodeViewer file={openFile} />
      ) : (
        <EmptyEditor />
      )}
    </main>
  );
}

function EmptyEditor() {
  return (
    <div className="empty-editor">
      <div className="empty-editor-inner">
        <p>Select a file from the Explorer, or open the Rustdoc view.</p>
      </div>
    </div>
  );
}
