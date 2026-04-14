// WelcomeView.tsx — Shown on the welcome tab or when no repo is open
import { useStore } from "../store";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

export default function WelcomeView() {
  const openRepo  = useStore((s) => s.openRepo);
  const repoInfo  = useStore((s) => s.repoInfo);
  const isLoading = useStore((s) => s.isLoading);

  const handleOpen = async () => {
    const selected = await openDialog({ directory: true, multiple: false });
    if (typeof selected === "string" && selected) {
      await openRepo(selected);
    }
  };

  return (
    <div
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-normal)" }}
      className="flex flex-col items-center justify-center h-full gap-6 select-none"
    >
      <div className="flex flex-col items-center gap-3">
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
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)" }}
            className="px-6 py-4 text-center"
          >
            <p style={{ color: "var(--text-muted)" }} className="text-xs mb-1">Opened repository</p>
            <p style={{ color: "var(--accent)" }} className="font-mono text-sm font-medium">{repoInfo.name}</p>
            <p style={{ color: "var(--text-faint)" }} className="text-xs mt-1 font-mono">{repoInfo.root}</p>
          </div>
          <p style={{ color: "var(--text-faint)" }} className="text-xs">
            Use the explorer to browse files or search with ⌕
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleOpen}
            disabled={isLoading}
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--text-on-accent)",
              borderRadius: "var(--radius-md)",
            }}
            className="px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Opening…" : "Open Repository…"}
          </button>

          <div style={{ color: "var(--text-faint)" }} className="text-xs space-y-1 text-center">
            <p>Open a Cargo workspace to get started.</p>
            <p>Know will index Rust symbols and docs automatically.</p>
          </div>
        </div>
      )}

      <div
        style={{ color: "var(--text-faint)", borderTop: "1px solid var(--border-subtle)" }}
        className="absolute bottom-0 w-full py-3 text-center text-xs"
      >
        Know — built with Tauri + Rust
      </div>
    </div>
  );
}
