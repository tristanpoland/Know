// ActivityBar.tsx — Left-side icon strip (Obsidian-style)
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useStore, SidebarView } from "../store";

// Which items open a dedicated tab instead of a sidebar panel
const TAB_ITEMS = new Set<SidebarView>(["rustdoc", "graph", "settings"]);

// Heroicons-style SVG paths (24×24 viewBox, stroke-based)
const ICONS: Record<SidebarView, JSX.Element> = {
  files: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
      <path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414A1 1 0 0120 8.414V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
      <circle cx={11} cy={11} r={7} />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  rustdoc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z" />
    </svg>
  ),
  graph: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
      <circle cx={18} cy={5} r={2} />
      <circle cx={6} cy={12} r={2} />
      <circle cx={18} cy={19} r={2} />
      <path d="M8 11.5l8-5M8 12.5l8 5" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  ),
};

const ITEMS: { id: SidebarView; label: string }[] = [
  { id: "files",    label: "Explorer"  },
  { id: "search",   label: "Search"    },
  { id: "rustdoc",  label: "Rustdoc"   },
  { id: "graph",    label: "Graph"     },
  { id: "settings", label: "Settings"  },
];

export default function ActivityBar() {
  const sidebarView      = useStore((s) => s.sidebarView);
  const sidebarOpen      = useStore((s) => s.sidebarOpen);
  const setSidebarView   = useStore((s) => s.setSidebarView);
  const openSpecialTab   = useStore((s) => s.openSpecialTab);

  const win = getCurrentWindow();

  const handleClick = (id: SidebarView) => {
    if (TAB_ITEMS.has(id)) {
      openSpecialTab(id as "rustdoc" | "graph" | "settings");
    } else {
      setSidebarView(id);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    win.startDragging();
  };

  return (
    <aside
      onMouseDown={onMouseDown}
      style={{
        backgroundColor: "var(--chrome-activity)",
        borderRight: "1px solid var(--border-subtle)",
        width: 48,
      }}
      className="flex flex-col items-center shrink-0 py-2 select-none z-10"
    >
      {ITEMS.map((item) => {
        const active = !TAB_ITEMS.has(item.id) && sidebarView === item.id && sidebarOpen;
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            title={item.label}
            style={{
              color: active ? "var(--accent)" : "var(--text-faint)",
              backgroundColor: active ? "var(--bg-selected)" : "transparent",
              borderRadius: "var(--radius-md)",
              boxShadow: active ? "inset 0 0 0 1px var(--border-default)" : "none",
              transition: "color 120ms ease, background-color 120ms ease",
            }}
            className="relative flex items-center justify-center w-9 h-9 my-0.5 hover:text-(--text-normal) hover:bg-(--bg-hover)"
          >
            {active && (
              <span
                style={{ backgroundColor: "var(--accent)", borderRadius: "0 2px 2px 0" }}
                className="absolute left-0 top-2 bottom-2 w-0.5"
              />
            )}
            {ICONS[item.id]}
          </button>
        );
      })}
    </aside>
  );
}
