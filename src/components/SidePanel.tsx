// SidePanel.tsx — Collapsible sidebar container that routes to the active view
import { useRef, useCallback } from "react";
import { useStore } from "../store";
import FileExplorer from "./FileExplorer";
import SearchView from "./SearchView";
import RustdocExplorer from "./RustdocExplorer";
import GraphView from "./GraphView";
import { ThemeEditor } from "../theme/ThemeEditor";

export default function SidePanel() {
  const sidebarOpen  = useStore((s) => s.sidebarOpen);
  const sidebarView  = useStore((s) => s.sidebarView);
  const sidebarWidth = useStore((s) => s.sidebarWidth);
  const setSidebarWidth = useStore((s) => s.setSidebarWidth);

  const dragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      setSidebarWidth(ev.clientX - 48); // 48 = activity bar width
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [setSidebarWidth]);

  if (!sidebarOpen) return null;

  const PANEL_TITLES: Record<string, string> = {
    files: "EXPLORER",
    search: "SEARCH",
    rustdoc: "RUSTDOC",
    graph: "DEPENDENCY GRAPH",
    settings: "THEMES & SETTINGS",
  };

  return (
    <div
      style={{
        width: sidebarWidth,
        backgroundColor: "var(--chrome-sidebar)",
        borderRight: "1px solid var(--border-subtle)",
      }}
      className="flex flex-col shrink-0 overflow-hidden relative"
    >
      {/* Header */}
      <div
        style={{
          color: "var(--text-faint)",
          fontSize: "11px",
          letterSpacing: "0.08em",
          borderBottom: "1px solid var(--border-subtle)",
        }}
        className="px-3 py-2 font-semibold select-none shrink-0"
      >
        {PANEL_TITLES[sidebarView] ?? sidebarView.toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {sidebarView === "files"    && <FileExplorer />}
        {sidebarView === "search"   && <SearchView />}
        {sidebarView === "rustdoc"  && <RustdocExplorer />}
        {sidebarView === "graph"    && <GraphView />}
        {sidebarView === "settings" && <ThemeEditor />}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        style={{ cursor: "col-resize", width: "4px", right: 0 }}
        className="absolute top-0 bottom-0 hover:bg-[color:var(--accent)] opacity-0 hover:opacity-40 transition-opacity z-10"
      />
    </div>
  );
}
