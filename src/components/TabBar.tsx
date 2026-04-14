// TabBar.tsx — Scrollable tab strip with close buttons
import { useRef } from "react";
import { useStore, Tab } from "../store";

function TabChip({ tab }: { tab: Tab }) {
  const activeTabId = useStore((s) => s.activeTabId);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const closeTab     = useStore((s) => s.closeTab);
  const active = tab.id === activeTabId;

  const FILE_ICONS: Record<string, string> = {
    rust_source: "🦀", markdown: "📝", toml: "⚙", other: "📄",
  };
  const TYPE_ICONS: Record<string, string> = {
    welcome: "🏠", rustdoc: "📚", search: "🔍", graph: "🕸", settings: "⚙",
  };
  const icon = tab.type === "file"
    ? FILE_ICONS[tab.fileKind ?? "other"] ?? "📄"
    : TYPE_ICONS[tab.type] ?? "📄";

  return (
    <div
      role="tab"
      aria-selected={active}
      onClick={() => setActiveTab(tab.id)}
      style={{
        backgroundColor: active ? "var(--bg-surface)" : "transparent",
        borderBottom: active ? "1px solid var(--accent)" : "1px solid transparent",
        color: active ? "var(--text-normal)" : "var(--text-muted)",
        borderRight: "1px solid var(--border-subtle)",
      }}
      className="flex items-center gap-1.5 px-3 h-full shrink-0 max-w-45 cursor-pointer select-none group hover:bg-(--bg-hover) transition-colors"
    >
      <span className="text-xs shrink-0">{icon}</span>
      <span className="truncate text-xs flex-1">{tab.title}</span>
      {!tab.isPinned && (
        <button
          onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
          style={{ color: "var(--text-faint)" }}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-(--text-normal) w-4 h-4 flex items-center justify-center rounded"
          aria-label="Close tab"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function TabBar() {
  const tabs = useStore((s) => s.tabs);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll tab bar with mouse wheel
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
        height: "35px",
      }}
      className="flex items-stretch overflow-hidden shrink-0"
    >
      <div
        ref={scrollRef}
        onWheel={onWheel}
        role="tablist"
        className="flex items-stretch overflow-x-auto overflow-y-hidden flex-1"
        style={{ scrollbarWidth: "none" }}
      >
        {tabs.map((tab) => (
          <TabChip key={tab.id} tab={tab} />
        ))}
      </div>
    </div>
  );
}
