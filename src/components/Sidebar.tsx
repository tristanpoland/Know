// components/Sidebar.tsx — Left sidebar with nav tabs and file explorer
import React, { useState } from "react";
import { useStore, ActiveView } from "../store";
import { FileExplorer } from "./FileExplorer";
import "./Sidebar.css";

const NAV_ITEMS: { id: ActiveView; label: string; icon: string }[] = [
  { id: "explorer", label: "Explorer", icon: "📁" },
  { id: "rustdoc", label: "Rustdoc", icon: "📖" },
  { id: "search", label: "Search", icon: "🔍" },
  { id: "graph", label: "Graph", icon: "🕸" },
];

export function Sidebar() {
  const activeView = useStore((s) => s.activeView);
  const setActiveView = useStore((s) => s.setActiveView);
  const repoInfo = useStore((s) => s.repoInfo);

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-btn ${activeView === item.id ? "active" : ""}`}
            onClick={() => setActiveView(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-content">
        {activeView === "explorer" && (
          <>
            {repoInfo && (
              <div className="sidebar-header">
                <span className="repo-name">{repoInfo.name}</span>
                {repoInfo.branch && (
                  <span className="branch-badge">{repoInfo.branch}</span>
                )}
              </div>
            )}
            <FileExplorer />
          </>
        )}
        {activeView !== "explorer" && null}
      </div>
    </aside>
  );
}
