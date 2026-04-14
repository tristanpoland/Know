// components/StatusBar.tsx — Bottom status bar with repo info and actions
import { GitBranch, RefreshCw, Loader2 } from "lucide-react";
import { useStore } from "../store";
import "./StatusBar.css";

export function StatusBar() {
  const repoInfo = useStore((s) => s.repoInfo);
  const isLoading = useStore((s) => s.isLoading);
  const reindex = useStore((s) => s.reindex);

  if (!repoInfo) return null;

  return (
    <footer className="status-bar">
      <span className="status-item">
        <span className="status-dot green" />
        {repoInfo.name}
      </span>
      {repoInfo.branch && (
        <span className="status-item mono"><GitBranch size={11} style={{ marginRight: 3 }} />{repoInfo.branch}</span>
      )}
      {repoInfo.head_commit && (
        <span className="status-item mono dim">{repoInfo.head_commit}</span>
      )}
      <span className="status-separator" />
      <span className="status-item">
        {repoInfo.stats.total_symbols} symbols
      </span>
      <span className="status-item dim">
        {repoInfo.stats.total_files} files
      </span>
      <span className="status-separator" />
      <button
        className="status-btn"
        onClick={reindex}
        disabled={isLoading}
        title="Force full re-index"
      >
        {isLoading
          ? <><Loader2 size={10} className="animate-spin" style={{ marginRight: 3 }} />Indexing…</>
          : <><RefreshCw size={10} style={{ marginRight: 3 }} />Reindex</>}
      </button>
    </footer>
  );
}
