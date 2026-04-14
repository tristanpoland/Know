// ActivityBar.tsx — Left-side icon strip (Obsidian-style)
import { useStore, SidebarView } from "../store";

interface ActivityItem {
  id: SidebarView;
  icon: string;
  label: string;
}

const ITEMS: ActivityItem[] = [
  { id: "files",    icon: "⊞",  label: "Explorer"  },
  { id: "search",   icon: "⌕",  label: "Search"    },
  { id: "rustdoc",  icon: "⚙",  label: "Rustdoc"   },
  { id: "graph",    icon: "⬡",  label: "Graph"     },
  { id: "settings", icon: "⚙",  label: "Settings"  },
];

export default function ActivityBar() {
  const sidebarView  = useStore((s) => s.sidebarView);
  const sidebarOpen  = useStore((s) => s.sidebarOpen);
  const setSidebarView = useStore((s) => s.setSidebarView);

  return (
    <aside
      style={{ backgroundColor: "var(--chrome-activity)", borderRight: "1px solid var(--border-subtle)" }}
      className="flex flex-col items-center w-12 shrink-0 py-1 select-none z-10"
    >
      {ITEMS.map((item) => {
        const active = sidebarView === item.id && sidebarOpen;
        return (
          <button
            key={item.id}
            onClick={() => setSidebarView(item.id)}
            title={item.label}
            style={{
              color: active ? "var(--accent)" : "var(--text-faint)",
              backgroundColor: active ? "var(--bg-selected)" : "transparent",
              borderRadius: "var(--radius-md)",
            }}
            className="relative flex items-center justify-center w-9 h-9 my-0.5 text-base transition-colors hover:text-[color:var(--text-normal)] hover:bg-[color:var(--bg-hover)]"
          >
            {active && (
              <span
                style={{ backgroundColor: "var(--accent)" }}
                className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r"
              />
            )}
            {item.icon}
          </button>
        );
      })}
    </aside>
  );
}
