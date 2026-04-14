// store.ts — Zustand global state store
// Manages all application state visible to the UI.

import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Theme } from "./theme/types";
import {
  BUILT_IN_THEMES,
  OBSIDIAN_DARK,
  applyTheme,
  loadStoredThemeId,
  saveThemeId,
  loadCustomThemes,
  saveCustomThemes,
} from "./theme/defaults";

// ─── Workspace cache helpers ─────────────────────────────────────────────────

const WORKSPACE_CACHE_KEY = "know-recent-workspaces";
const WORKSPACE_CACHE_MAX = 10;

function loadRecentWorkspaces(): string[] {
  try {
    const raw = localStorage.getItem(WORKSPACE_CACHE_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch { /* ignore */ }
  return [];
}

function saveRecentWorkspaces(paths: string[]): void {
  localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(paths));
}

function pushWorkspace(existing: string[], path: string): string[] {
  const deduped = existing.filter((p) => p !== path);
  return [path, ...deduped].slice(0, WORKSPACE_CACHE_MAX);
}

// ─── Tab types ───────────────────────────────────────────────────────────────

export type TabType = "welcome" | "file" | "rustdoc" | "search" | "graph" | "settings";

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  /** File path for file tabs */
  path?: string;
  /** File kind for file tabs: 'rust' | 'markdown' | 'toml' | 'text' */
  fileKind?: string;
  isPinned: boolean;
}

// ─── Types (mirroring Rust backend models) ──────────────────────────────────

export type FileKind = "rust_source" | "markdown" | "toml" | "other" | "directory";

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  kind: FileKind;
  children: FileNode[];
}

export interface Span {
  start_line: number;
  end_line: number;
  start_col: number;
  end_col: number;
}

export type RustItemKind =
  | "struct" | "enum" | "trait" | "function" | "method"
  | "impl_block" | "module" | "type_alias" | "constant" | "static" | "macro" | "use";

export interface RustItem {
  name: string;
  qualified_path: string;
  kind: RustItemKind;
  docs: string | null;
  file_path: string;
  span: Span;
  impl_for: string | null;
  impl_trait: string | null;
  visibility: "public" | "public_crate" | "public_super" | "private";
  generics: string | null;
  signature: string | null;
  module_path: string[];
}

export interface DocSection {
  title: string;
  content: string;
}

export interface SymbolDoc {
  qualified_path: string;
  name: string;
  kind: RustItemKind;
  doc_html: string | null;
  doc_text: string | null;
  file_path: string;
  start_line: number;
  signature: string | null;
  module_path: string[];
  impl_for: string | null;
  impl_trait: string | null;
  sections: DocSection[];
}

export interface ModuleDoc {
  path: string[];
  doc_text: string | null;
  doc_html: string | null;
  children: string[];
}

export interface CrateDoc {
  name: string;
  modules: ModuleDoc[];
  symbols: Record<string, SymbolDoc>;
}

export interface FileContent {
  path: string;
  content: string;
  kind: string;
}

export interface SearchResult {
  kind: "rust_symbol" | "doc_comment" | "markdown" | "rust_source";
  title: string;
  path: string;
  snippet: string;
  score: number;
  line: number;
}

export interface RepoInfo {
  root: string;
  name: string;
  branch: string | null;
  head_commit: string | null;
  stats: { total_symbols: number; total_files: number; crate_name: string };
}

// ─── Store ───────────────────────────────────────────────────────────────────

export type SidebarView = "files" | "search" | "rustdoc" | "graph" | "settings";

// Initialise theme from localStorage
const _customThemes = loadCustomThemes();
const _allThemes = [...BUILT_IN_THEMES, ..._customThemes];
const _storedId = loadStoredThemeId();
const _initialTheme = _allThemes.find((t) => t.id === _storedId) ?? OBSIDIAN_DARK;

const SPECIAL_TAB_IDS: Record<string, string> = {
  welcome: "tab-welcome",
  rustdoc: "tab-rustdoc",
  search:  "tab-search",
  graph:   "tab-graph",
  settings:"tab-settings",
};

function makeTab(partial: Omit<Tab, "id">): Tab {
  return { ...partial, id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
}

interface KnowStore {
  // ── Theme ─────────────────────────────────────────────────────────────────
  theme: Theme;
  allThemes: Theme[];
  setTheme: (id: string) => void;
  addCustomTheme: (t: Theme) => void;
  removeCustomTheme: (id: string) => void;

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (tab: Omit<Tab, "id">) => string;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  openFileTab: (path: string, title: string, fileKind?: string) => void;
  openSpecialTab: (type: Exclude<TabType, "file">) => void;

  // ── Sidebar ───────────────────────────────────────────────────────────────
  sidebarOpen: boolean;
  sidebarView: SidebarView;
  sidebarWidth: number;
  setSidebarView: (v: SidebarView) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;

  // ── Repo ──────────────────────────────────────────────────────────────────
  repoInfo: RepoInfo | null;
  fileTree: FileNode[];
  isLoading: boolean;
  error: string | null;

  // ── Workspace history ─────────────────────────────────────────────────────
  recentWorkspaces: string[];
  addRecentWorkspace: (path: string) => void;
  clearRecentWorkspaces: () => void;

  // ── File content cache ────────────────────────────────────────────────────
  openFileContents: Record<string, FileContent>;

  // ── Rustdoc ───────────────────────────────────────────────────────────────
  rustSymbols: RustItem[];
  selectedSymbol: SymbolDoc | null;
  crateDoc: CrateDoc | null;

  // ── Search ────────────────────────────────────────────────────────────────
  searchQuery: string;
  searchResults: SearchResult[];

  // ── Actions ───────────────────────────────────────────────────────────────
  openRepo: (path: string) => Promise<void>;
  loadFileTree: () => Promise<void>;
  openFilePath: (path: string) => Promise<void>;
  loadSymbols: (filePath?: string) => Promise<void>;
  selectSymbol: (qualifiedPath: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  runSearch: (q: string) => Promise<void>;
  reindex: () => Promise<void>;
  clearError: () => void;
}

export const useStore = create<KnowStore>((set, get) => {
  // Apply initial theme immediately
  applyTheme(_initialTheme);

  // Load workspace cache
  const _recentWorkspaces = loadRecentWorkspaces();

  // Schedule auto-reopen of last workspace after store is initialised
  if (_recentWorkspaces.length > 0) {
    setTimeout(() => get().openRepo(_recentWorkspaces[0]), 0);
  }

  return {
    // ── Theme ───────────────────────────────────────────────────────────────
    theme: _initialTheme,
    allThemes: _allThemes,

    setTheme: (id: string) => {
      const t = get().allThemes.find((x) => x.id === id);
      if (!t) return;
      applyTheme(t);
      saveThemeId(id);
      set({ theme: t });
    },

    addCustomTheme: (t: Theme) => {
      const existing = get().allThemes.filter((x) => x.id !== t.id);
      const next = [...existing, t];
      const customs = next.filter((x) => !BUILT_IN_THEMES.some((b) => b.id === x.id));
      saveCustomThemes(customs);
      set({ allThemes: next });
    },

    removeCustomTheme: (id: string) => {
      const next = get().allThemes.filter((x) => x.id !== id);
      const customs = next.filter((x) => !BUILT_IN_THEMES.some((b) => b.id === x.id));
      saveCustomThemes(customs);
      set({ allThemes: next });
      if (get().theme.id === id) {
        get().setTheme(OBSIDIAN_DARK.id);
      }
    },

    // ── Tabs ────────────────────────────────────────────────────────────────
    tabs: [{ id: "tab-welcome", type: "welcome", title: "Welcome", isPinned: false }],
    activeTabId: "tab-welcome",

    openTab: (partial) => {
      const tab = makeTab(partial);
      set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
      return tab.id;
    },

    closeTab: (id: string) => {
      const { tabs, activeTabId } = get();
      const idx = tabs.findIndex((t) => t.id === id);
      if (idx === -1) return;
      const pinned = tabs[idx].isPinned;
      if (pinned) return; // can't close pinned tabs

      const next = tabs.filter((t) => t.id !== id);
      let nextActive = activeTabId;
      if (activeTabId === id) {
        nextActive = next[Math.min(idx, next.length - 1)]?.id ?? null;
      }
      // Open welcome if no tabs remain
      if (next.length === 0) {
        const welcome: Tab = { id: "tab-welcome", type: "welcome", title: "Welcome", isPinned: false };
        set({ tabs: [welcome], activeTabId: "tab-welcome" });
      } else {
        set({ tabs: next, activeTabId: nextActive });
      }
    },

    setActiveTab: (id: string) => set({ activeTabId: id }),

    openFileTab: (path: string, title: string, fileKind?: string) => {
      const { tabs } = get();
      // Reuse existing tab for same path
      const existing = tabs.find((t) => t.type === "file" && t.path === path);
      if (existing) {
        set({ activeTabId: existing.id });
        return;
      }
      const tab = makeTab({ type: "file", title, path, fileKind, isPinned: false });
      set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }));
      get().openFilePath(path);
    },

    openSpecialTab: (type) => {
      const id = SPECIAL_TAB_IDS[type];
      const { tabs } = get();
      if (tabs.find((t) => t.id === id)) {
        set({ activeTabId: id });
        return;
      }
      const LABELS: Record<string, string> = {
        welcome: "Welcome", rustdoc: "Rustdoc", search: "Search",
        graph: "Graph", settings: "Settings",
      };
      const tab: Tab = { id, type, title: LABELS[type] ?? type, isPinned: false };
      set((s) => ({ tabs: [...s.tabs, tab], activeTabId: id }));
    },

    // ── Sidebar ─────────────────────────────────────────────────────────────
    sidebarOpen: true,
    sidebarView: "files",
    sidebarWidth: 260,

    setSidebarView: (v: SidebarView) => {
      const { sidebarView, sidebarOpen } = get();
      if (sidebarView === v) {
        set({ sidebarOpen: !sidebarOpen });
      } else {
        set({ sidebarView: v, sidebarOpen: true });
      }
    },

    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    setSidebarWidth: (w: number) => set({ sidebarWidth: Math.max(180, Math.min(600, w)) }),

    // ── Repo ────────────────────────────────────────────────────────────────
    repoInfo: null,
    fileTree: [],
    isLoading: false,
    error: null,
    openFileContents: {},

    // ── Workspace history ────────────────────────────────────────────────────
    recentWorkspaces: _recentWorkspaces,

    addRecentWorkspace: (path: string) => {
      const next = pushWorkspace(get().recentWorkspaces, path);
      saveRecentWorkspaces(next);
      set({ recentWorkspaces: next });
    },

    clearRecentWorkspaces: () => {
      saveRecentWorkspaces([]);
      set({ recentWorkspaces: [] });
    },

    openRepo: async (path: string) => {
      set({ isLoading: true, error: null });
      try {
        const info = await invoke<RepoInfo>("open_repo", { request: { path } });
        set({ repoInfo: info });
        get().addRecentWorkspace(path);
        await get().loadFileTree();
        await get().loadSymbols();
      } catch (e) {
        set({ error: String(e) });
      } finally {
        set({ isLoading: false });
      }
    },

    loadFileTree: async () => {
      try {
        const tree = await invoke<FileNode[]>("get_repo_tree");
        set({ fileTree: tree });
      } catch (e) {
        set({ error: String(e) });
      }
    },

    openFilePath: async (path: string) => {
      try {
        const file = await invoke<FileContent>("open_file", { request: { path } });
        set((s) => ({ openFileContents: { ...s.openFileContents, [path]: file } }));
      } catch (e) {
        set({ error: String(e) });
      }
    },

    // ── Rustdoc ─────────────────────────────────────────────────────────────
    rustSymbols: [],
    selectedSymbol: null,
    crateDoc: null,

    loadSymbols: async (filePath?: string) => {
      try {
        const symbols = await invoke<RustItem[]>("get_rust_symbols", {
          request: { file_path: filePath ?? null, kind_filter: null },
        });
        set({ rustSymbols: symbols });
      } catch (e) {
        set({ error: String(e) });
      }
    },

    selectSymbol: async (qualifiedPath: string) => {
      try {
        const doc = await invoke<SymbolDoc | null>("get_docs_for_symbol", {
          request: { qualified_path: qualifiedPath },
        });
        set({ selectedSymbol: doc });
      } catch (e) {
        set({ error: String(e) });
      }
    },

    // ── Search ──────────────────────────────────────────────────────────────
    searchQuery: "",
    searchResults: [],

    setSearchQuery: (q: string) => set({ searchQuery: q }),

    runSearch: async (q: string) => {
      if (!q.trim()) { set({ searchResults: [] }); return; }
      try {
        const results = await invoke<SearchResult[]>("search", {
          query: { query: q, limit: 30, kinds: null },
        });
        set({ searchResults: results });
      } catch (e) {
        set({ error: String(e) });
      }
    },

    reindex: async () => {
      set({ isLoading: true });
      try {
        await invoke("reindex");
        await get().loadSymbols();
      } catch (e) {
        set({ error: String(e) });
      } finally {
        set({ isLoading: false });
      }
    },

    clearError: () => set({ error: null }),
  };
});
