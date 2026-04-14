// App.tsx — Root layout: Obsidian-style activity bar + sidebar + tabs
import { useStore } from "./store";
import { ErrorBanner } from "./components/ErrorBanner";
import ActivityBar from "./components/ActivityBar";
import SidePanel from "./components/SidePanel";
import TabBar from "./components/TabBar";
import WelcomeView from "./components/WelcomeView";
import CodeViewer from "./components/CodeViewer";
import RustdocExplorer from "./components/RustdocExplorer";
import SearchView from "./components/SearchView";
import GraphView from "./components/GraphView";
import { ThemeEditor } from "./theme/ThemeEditor";
import { StatusBar } from "./components/StatusBar";

function TabContent() {
  const tabs        = useStore((s) => s.tabs);
  const activeTabId = useStore((s) => s.activeTabId);
  const openFileContents = useStore((s) => s.openFileContents);
  const activeTab   = tabs.find((t) => t.id === activeTabId);

  if (!activeTab) {
    return <WelcomeView />;
  }

  switch (activeTab.type) {
    case "welcome":
      return <WelcomeView />;
    case "file": {
      const file = activeTab.path ? openFileContents[activeTab.path] : undefined;
      return (
        <CodeViewer
          file={file ?? null}
          isLoading={!file && !!activeTab.path}
        />
      );
    }
    case "rustdoc":
      return <RustdocExplorer />;
    case "search":
      return <SearchView />;
    case "graph":
      return <GraphView />;
    case "settings":
      return <ThemeEditor />;
    default:
      return <WelcomeView />;
  }
}

export default function App() {
  return (
    <div
      style={{ backgroundColor: "var(--bg-base)", color: "var(--text-normal)" }}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Content row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity bar */}
        <ActivityBar />

        {/* Side panel */}
        <SidePanel />

        {/* Main editor area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <TabBar />
          <div className="flex-1 overflow-hidden">
            <TabContent />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Toast notifications — fixed overlay, position independent */}
      <ErrorBanner />
    </div>
  );
}

