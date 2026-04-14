// store.ts — Zustand global state store
// Manages all application state visible to the UI.

import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

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

export type ActiveView = "explorer" | "rustdoc" | "search" | "graph";

interface KnowStore {
  // Repo state
  repoInfo: RepoInfo | null;
  fileTree: FileNode[];
  isLoading: boolean;
  error: string | null;

  // Editor state
  openFile: FileContent | null;
  activeView: ActiveView;

  // Rustdoc explorer
  rustSymbols: RustItem[];
  selectedSymbol: SymbolDoc | null;
  crateDoc: CrateDoc | null;

  // Search
  searchQuery: string;
  searchResults: SearchResult[];

  // Actions
  openRepo: (path: string) => Promise<void>;
  loadFileTree: () => Promise<void>;
  openFilePath: (path: string) => Promise<void>;
  loadSymbols: (filePath?: string) => Promise<void>;
  selectSymbol: (qualifiedPath: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  runSearch: (q: string) => Promise<void>;
  setActiveView: (view: ActiveView) => void;
  reindex: () => Promise<void>;
  clearError: () => void;
}

export const useStore = create<KnowStore>((set, get) => ({
  repoInfo: null,
  fileTree: [],
  isLoading: false,
  error: null,
  openFile: null,
  activeView: "explorer",
  rustSymbols: [],
  selectedSymbol: null,
  crateDoc: null,
  searchQuery: "",
  searchResults: [],

  openRepo: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const info = await invoke<RepoInfo>("open_repo", { request: { path } });
      set({ repoInfo: info });
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
      set({ openFile: file });
    } catch (e) {
      set({ error: String(e) });
    }
  },

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

  setSearchQuery: (q: string) => {
    set({ searchQuery: q });
  },

  runSearch: async (q: string) => {
    if (!q.trim()) {
      set({ searchResults: [] });
      return;
    }
    try {
      const results = await invoke<SearchResult[]>("search", {
        query: { query: q, limit: 30, kinds: null },
      });
      set({ searchResults: results });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  setActiveView: (view: ActiveView) => set({ activeView: view }),

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
}));
