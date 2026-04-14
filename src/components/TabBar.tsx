// TabBar.tsx — Scrollable tab strip with close buttons + custom titlebar
import { useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useStore, Tab } from "../store";

// Small SVG icon components for file kinds / tab types
function FileIcon({ kind }: { kind?: string }) {
  const color = kind === "rust" || kind === "rust_source"
    ? "#f78c6c"
    : kind === "markdown"
    ? "#82aaff"
    : kind === "toml"
    ? "#c792ea"
    : "currentColor";
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={13} height={13} style={{ flexShrink: 0 }}>
      <path d="M10 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5L10 2z" />
      <path d="M10 2v3h3" />
    </svg>
  );
}

function TabTypeIcon({ type }: { type: Tab["type"] }) {
  switch (type) {
    case "rustdoc":
      return (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={13} height={13} style={{ flexShrink: 0 }}>
          <path d="M8 3.5v9M8 3.5C7.1 2.98 6.1 2.75 5 2.75S2.9 2.98 2 3.5v9c.9-.52 1.9-.75 3-.75s2.1.23 3 .75m0-9C8.9 2.98 9.9 2.75 11 2.75s2.1.23 3 .75v9c-.9-.52-1.9-.75-3-.75s-2.1.23-3 .75" />
        </svg>
      );
    case "graph":
      return (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={13} height={13} style={{ flexShrink: 0 }}>
          <circle cx={12} cy={4} r={1.5} />
          <circle cx={4} cy={8} r={1.5} />
          <circle cx={12} cy={12} r={1.5} />
          <path d="M5.4 7.3l5.1-2.6M5.4 8.7l5.1 2.6" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={13} height={13} style={{ flexShrink: 0 }}>
          <circle cx={7} cy={7} r={4} />
          <path d="M13 13l-2.9-2.9" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={13} height={13} style={{ flexShrink: 0 }}>
          <circle cx={8} cy={8} r={2} />
          <path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.75 3.75l.7.7M11.55 11.55l.7.7M3.75 12.25l.7-.7M11.55 4.45l.7-.7" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" width={13} height={13} style={{ flexShrink: 0 }}>
          <rect x={2} y={2} width={12} height={12} rx={2} />
          <path d="M5 8h6M5 5.5h6M5 10.5h4" />
        </svg>
      );
  }
}

function TabChip({ tab }: { tab: Tab }) {
  const activeTabId  = useStore((s) => s.activeTabId);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const closeTab     = useStore((s) => s.closeTab);
  const active = tab.id === activeTabId;

  return (
    <div
      role="tab"
      aria-selected={active}
      onClick={() => setActiveTab(tab.id)}
      style={active ? {
        backgroundColor: "var(--bg-surface)",
        borderTop: "2px solid var(--accent)",
        borderLeft: "1px solid var(--border-default)",
        borderRight: "1px solid var(--border-default)",
        borderBottom: "1px solid var(--bg-surface)",
        borderRadius: "7px 7px 0 0",
        color: "var(--text-normal)",
        position: "relative",
        zIndex: 1,
        marginBottom: "-1px",
        height: "36px",
        paddingLeft: "10px",
        paddingRight: "10px",
      } : {
        backgroundColor: "transparent",
        borderTop: "2px solid transparent",
        borderBottom: "1px solid transparent",
        color: "var(--text-muted)",
        height: "32px",
        paddingLeft: "10px",
        paddingRight: "10px",
      }}
      className="flex items-center gap-1.5 shrink-0 max-w-48 cursor-pointer select-none group hover:bg-(--bg-hover) transition-colors"
    >
      {tab.type === "file"
        ? <FileIcon kind={tab.fileKind} />
        : <TabTypeIcon type={tab.type} />
      }
      <span className="truncate text-xs flex-1 leading-none">{tab.title}</span>
      {!tab.isPinned && (
        <button
          onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
          style={{ color: "var(--text-faint)", width: 16, height: 16 }}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-(--text-normal) flex items-center justify-center rounded-sm"
          aria-label="Close tab"
        >
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" width={10} height={10}>
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Inline SVG window control buttons
function WinBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 40,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.45)",
        flexShrink: 0,
        transition: "background 100ms ease, color 100ms ease",
      }}
      className={danger ? "hover:bg-red-600 hover:text-white!" : "hover:bg-white/10 hover:text-white!"}
      aria-label={label}
    >
      {label === "Close" && (
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" width={11} height={11}>
          <path d="M1 1l10 10M11 1L1 11" />
        </svg>
      )}
      {label === "Maximize" && (
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4} width={10} height={10}>
          <rect x={1} y={1} width={10} height={10} rx={1.5} />
        </svg>
      )}
      {label === "Minimize" && (
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" width={10} height={10}>
          <path d="M1 6h10" />
        </svg>
      )}
    </button>
  );
}

export default function TabBar() {
  const tabs = useStore((s) => s.tabs);
  const scrollRef = useRef<HTMLDivElement>(null);

  const win = getCurrentWindow();

  const onWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  // Programmatic drag: fire startDragging() unless the click landed on a
  // tab, button, or other interactive element.
  const onBarMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, [role="tab"], input, a, select')) return;
    win.startDragging();
  };

  return (
    <div
      onMouseDown={onBarMouseDown}
      style={{
        backgroundColor: "var(--chrome-tabs)",
        borderBottom: "1px solid var(--border-subtle)",
        height: "40px",
        paddingTop: "4px",
        paddingLeft: "4px",
        display: "flex",
        alignItems: "flex-end",
        flexShrink: 0,
        overflow: "hidden",
        cursor: "default",
      }}
    >
      {/* Tab strip — flex-1, scroll horizontally */}
      <div
        ref={scrollRef}
        onWheel={onWheel}
        role="tablist"
        className="flex items-end overflow-x-auto overflow-y-hidden flex-1 h-full"
        style={{ scrollbarWidth: "none" }}
      >
        {tabs.map((tab) => (
          <TabChip key={tab.id} tab={tab} />
        ))}
      </div>

      {/* App title — sits in drag region, clicking it also drags */}
      <div
        style={{
          color: "rgba(255,255,255,0.25)",
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: "0.04em",
          paddingRight: 8,
          paddingBottom: 6,
          whiteSpace: "nowrap",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        Know
      </div>

      {/* Window controls — must NOT have data-tauri-drag-region */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          height: "100%",
          paddingBottom: 4,
          flexShrink: 0,
        }}
      >
        <WinBtn label="Minimize" onClick={() => win.minimize()} />
        <WinBtn label="Maximize" onClick={() => win.toggleMaximize()} />
        <WinBtn label="Close" onClick={() => win.close()} danger />
      </div>
    </div>
  );
}
