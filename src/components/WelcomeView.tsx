// WelcomeView.tsx — Shown on the welcome tab or when no repo is open
import { useStore } from "../store";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

export default function WelcomeView() {
  const openRepo          = useStore((s) => s.openRepo);
  const repoInfo          = useStore((s) => s.repoInfo);
  const isLoading         = useStore((s) => s.isLoading);
  const recentWorkspaces  = useStore((s) => s.recentWorkspaces);

  const handleOpen = async () => {
    const selected = await openDialog({ directory: true, multiple: false });
    if (typeof selected === "string" && selected) {
      await openRepo(selected);
    }
  };

  // Extract a short display name from a path
  const shortName = (p: string) => p.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? p;

  return (
    <div
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-normal)" }}
      className="flex flex-col items-center justify-center h-full gap-6 select-none"
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <div style={{ color: "var(--accent)" }} className="text-5xl font-bold tracking-tight">
          Know
        </div>
        <p style={{ color: "var(--text-muted)" }} className="text-sm">
          Local-first Rust documentation IDE
        </p>
      </div>

      {repoInfo ? (
        <div className="flex flex-col items-center gap-2">
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
            }}
            className="px-6 py-4 text-center"
          >
            <p style={{ color: "var(--text-muted)" }} className="text-xs mb-1">Opened repository</p>
            <p style={{ color: "var(--accent)" }} className="font-mono text-sm font-medium">{repoInfo.name}</p>
            <p style={{ color: "var(--text-faint)" }} className="text-xs mt-1 font-mono">{repoInfo.root}</p>
          </div>
          <p style={{ color: "var(--text-faint)" }} className="text-xs">
            Use the explorer to browse files or search with the sidebar
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5">
          {/* Open button */}
          <button
            onClick={handleOpen}
            disabled={isLoading}
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--text-on-accent)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-glow)",
            }}
            className="px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Opening…" : "Open Repository…"}
          </button>

          {/* Recent workspaces */}
          {recentWorkspaces.length > 0 && (
            <div className="flex flex-col items-center gap-1.5 w-72">
              <p style={{ color: "var(--text-faint)" }} className="text-xs mb-1 self-start">
                Recent
              </p>
              {recentWorkspaces.map((path) => (
                <button
                  key={path}
                  onClick={() => openRepo(path)}
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-normal)",
                    textAlign: "left",
                    transition: "border-color 120ms ease, background-color 120ms ease",
                  }}
                  className="w-full px-3 py-2 flex flex-col gap-0.5 hover:bg-(--bg-hover) hover:border-(--border-default)"
                >
                  <span className="text-xs font-medium truncate">{shortName(path)}</span>
                  <span style={{ color: "var(--text-faint)" }} className="text-xs font-mono truncate">{path}</span>
                </button>
              ))}
            </div>
          )}

          {recentWorkspaces.length === 0 && (
            <p style={{ color: "var(--text-faint)" }} className="text-xs text-center">
              Open a Cargo workspace to get started.
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        style={{ color: "var(--text-faint)", borderTop: "1px solid var(--border-subtle)" }}
        className="absolute bottom-0 w-full py-3 text-center text-xs"
      >
        Know — built with Tauri + Rust
      </div>
    </div>
  );
}
