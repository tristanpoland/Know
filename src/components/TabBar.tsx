// TabBar.tsx — Scrollable tab strip with close buttons
import { useRef } from "react";
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

export default function TabBar() {
  const tabs = useStore((s) => s.tabs);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--chrome-tabs)",
        borderBottom: "1px solid var(--border-subtle)",
        height: "40px",
        paddingTop: "4px",
        paddingLeft: "4px",
      }}
      className="flex items-end overflow-hidden shrink-0"
    >
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
    </div>
  );
}
