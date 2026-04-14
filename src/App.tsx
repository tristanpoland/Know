// App.tsx — Root layout component
import React from "react";
import { Sidebar } from "./components/Sidebar";
import { MainPanel } from "./components/MainPanel";
import { StatusBar } from "./components/StatusBar";
import { ErrorBanner } from "./components/ErrorBanner";
import { useStore } from "./store";
import "./styles/App.css";

export default function App() {
  const repoInfo = useStore((s) => s.repoInfo);

  return (
    <div className="app-root">
      <ErrorBanner />
      {!repoInfo ? (
        <WelcomeScreen />
      ) : (
        <>
          <div className="app-body">
            <Sidebar />
            <MainPanel />
          </div>
          <StatusBar />
        </>
      )}
    </div>
  );
}

function WelcomeScreen() {
  const openRepo = useStore((s) => s.openRepo);
  const isLoading = useStore((s) => s.isLoading);

  const handleOpen = async () => {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({ directory: true, multiple: false, title: "Open Repository" });
    if (selected && typeof selected === "string") {
      await openRepo(selected);
    }
  };

  return (
    <div className="welcome">
      <div className="welcome-inner">
        <div className="welcome-logo">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="12" fill="#4dabf7" fillOpacity="0.12" />
            <text x="28" y="38" textAnchor="middle" fontSize="28" fill="#4dabf7" fontWeight="700">K</text>
          </svg>
        </div>
        <h1 className="welcome-title">Know</h1>
        <p className="welcome-subtitle">
          Local-first Git-native documentation &amp; code intelligence for Rust
        </p>
        <button
          className="welcome-btn"
          onClick={handleOpen}
          disabled={isLoading}
        >
          {isLoading ? "Opening…" : "Open Repository"}
        </button>
        <p className="welcome-hint">Select a directory containing a Git repository</p>
      </div>
    </div>
  );
}
