// components/CodeViewer.tsx — Read-only Monaco editor with dynamic theming
import { useEffect, useRef } from "react";
import MonacoEditor, { OnMount } from "@monaco-editor/react";
import type * as MonacoNS from "monaco-editor";
import { FileCode2, FileText, Settings2, File } from "lucide-react";
import { FileContent, useStore } from "../store";
import "./CodeViewer.css";

interface Props {
  file: FileContent | null;
  isLoading?: boolean;
}

const THEME_NAME = "know-dynamic";

function getCssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Convert any CSS colour (hex or rgba) to a 6- or 8-digit hex Monaco accepts. */
function toHex(cssVar: string): string {
  const val = getCssVar(cssVar);
  if (val.startsWith("#")) return val;
  const m = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) {
    const r = parseInt(m[1]).toString(16).padStart(2, "0");
    const g = parseInt(m[2]).toString(16).padStart(2, "0");
    const b = parseInt(m[3]).toString(16).padStart(2, "0");
    const a = m[4] !== undefined
      ? Math.round(parseFloat(m[4]) * 255).toString(16).padStart(2, "0")
      : "ff";
    return `#${r}${g}${b}${a}`;
  }
  return "#808080";
}

function buildMonacoTheme(): MonacoNS.editor.IStandaloneThemeData {
  const isDark = document.documentElement.getAttribute("data-theme-mode") !== "light";
  return {
    base: isDark ? "vs-dark" : "vs",
    inherit: false,
    rules: [
      { token: "",                        foreground: toHex("--code-text").slice(1),      background: toHex("--code-bg").slice(1) },
      { token: "keyword",                 foreground: toHex("--code-keyword").slice(1),   fontStyle: "bold" },
      { token: "keyword.control",         foreground: toHex("--code-keyword").slice(1),   fontStyle: "bold" },
      { token: "keyword.operator",        foreground: toHex("--code-operator").slice(1) },
      { token: "string",                  foreground: toHex("--code-string").slice(1) },
      { token: "string.escape",           foreground: toHex("--code-string").slice(1) },
      { token: "comment",                 foreground: toHex("--code-comment").slice(1),   fontStyle: "italic" },
      { token: "comment.line",            foreground: toHex("--code-comment").slice(1),   fontStyle: "italic" },
      { token: "comment.block",           foreground: toHex("--code-comment").slice(1),   fontStyle: "italic" },
      { token: "comment.doc",             foreground: toHex("--code-comment").slice(1),   fontStyle: "italic" },
      { token: "number",                  foreground: toHex("--code-number").slice(1) },
      { token: "type",                    foreground: toHex("--code-type").slice(1) },
      { token: "type.identifier",         foreground: toHex("--code-type").slice(1) },
      { token: "entity.name.type",        foreground: toHex("--code-type").slice(1) },
      { token: "identifier",              foreground: toHex("--code-text").slice(1) },
      { token: "variable",                foreground: toHex("--code-text").slice(1) },
      { token: "variable.predefined",     foreground: toHex("--code-keyword").slice(1) },
      { token: "delimiter",               foreground: toHex("--code-punct").slice(1) },
      { token: "delimiter.bracket",       foreground: toHex("--code-punct").slice(1) },
      { token: "delimiter.parenthesis",   foreground: toHex("--code-punct").slice(1) },
      { token: "operator",                foreground: toHex("--code-operator").slice(1) },
      { token: "attribute.name",          foreground: toHex("--code-attribute").slice(1) },
      { token: "attribute.value",         foreground: toHex("--code-string").slice(1) },
      { token: "tag",                     foreground: toHex("--code-keyword").slice(1) },
      { token: "constant",                foreground: toHex("--code-number").slice(1) },
      { token: "support.function",        foreground: toHex("--code-function").slice(1) },
      { token: "entity.name.function",    foreground: toHex("--code-function").slice(1) },
      { token: "regexp",                  foreground: toHex("--code-string").slice(1) },
      { token: "metatag",                 foreground: toHex("--code-comment").slice(1) },
      // Markdown
      { token: "keyword.md",              foreground: toHex("--code-keyword").slice(1),   fontStyle: "bold" },
      { token: "strong.md",               foreground: toHex("--code-text").slice(1),      fontStyle: "bold" },
      { token: "emphasis.md",             foreground: toHex("--code-text").slice(1),      fontStyle: "italic" },
      { token: "string.link.md",          foreground: toHex("--text-link").slice(1) },
      { token: "string.link.title.md",    foreground: toHex("--text-link").slice(1) },
      { token: "code.md",                 foreground: toHex("--code-string").slice(1) },
    ],
    colors: {
      "editor.background":                    toHex("--code-bg"),
      "editor.foreground":                    toHex("--code-text"),
      "editor.lineHighlightBackground":       toHex("--bg-hover"),
      "editor.lineHighlightBorder":           "#00000000",
      "editor.selectionBackground":           toHex("--bg-selected"),
      "editor.inactiveSelectionBackground":   toHex("--bg-hover"),
      "editorLineNumber.foreground":          toHex("--text-faint"),
      "editorLineNumber.activeForeground":    toHex("--text-muted"),
      "editorGutter.background":              toHex("--code-bg"),
      "editorCursor.foreground":              toHex("--accent"),
      "editorIndentGuide.background1":        toHex("--border-subtle"),
      "editorIndentGuide.activeBackground1":  toHex("--border-default"),
      "editorBracketMatch.background":        toHex("--accent-muted"),
      "editorBracketMatch.border":            toHex("--accent"),
      "editorWidget.background":              toHex("--bg-elevated"),
      "editorWidget.border":                  toHex("--border-default"),
      "editorHoverWidget.background":         toHex("--bg-elevated"),
      "editorHoverWidget.border":             toHex("--border-default"),
      "editorSuggestWidget.background":       toHex("--bg-elevated"),
      "editorSuggestWidget.border":           toHex("--border-default"),
      "editorSuggestWidget.selectedBackground": toHex("--bg-selected"),
      "minimap.background":                   toHex("--code-bg"),
      "scrollbar.shadow":                     "#00000000",
      "scrollbarSlider.background":           toHex("--text-faint") + "44",
      "scrollbarSlider.hoverBackground":      toHex("--text-faint") + "88",
      "scrollbarSlider.activeBackground":     toHex("--text-muted"),
    },
  };
}

function kindToLanguage(kind: string): string {
  switch (kind) {
    case "rust":     return "rust";
    case "markdown": return "markdown";
    case "toml":     return "ini";
    default:         return "plaintext";
  }
}

export default function CodeViewer({ file, isLoading }: Props) {
  const monacoRef = useRef<typeof MonacoNS | null>(null);
  const theme = useStore((s) => s.theme);

  // Re-define and re-apply Monaco theme whenever the Zustand theme changes
  useEffect(() => {
    const m = monacoRef.current;
    if (!m) return;
    m.editor.defineTheme(THEME_NAME, buildMonacoTheme());
    m.editor.setTheme(THEME_NAME);
  }, [theme]);

  const handleMount: OnMount = (_editor, monaco) => {
    monacoRef.current = monaco;
    monaco.editor.defineTheme(THEME_NAME, buildMonacoTheme());
    monaco.editor.setTheme(THEME_NAME);
  };

  if (isLoading) {
    return (
      <div style={{ color: "var(--text-faint)" }} className="flex items-center justify-center h-full text-sm">
        Loading…
      </div>
    );
  }

  if (!file) {
    return (
      <div style={{ color: "var(--text-faint)" }} className="flex items-center justify-center h-full text-sm">
        No file selected
      </div>
    );
  }

  const fileName = file.path.split(/[/\\]/).pop() ?? file.path;

  return (
    <div className="code-viewer">
      <div className="code-viewer-header">
        <span className="code-file-icon" style={{ display: "flex", alignItems: "center" }}>{kindIcon(file.kind)}</span>
        <span className="code-file-name">{fileName}</span>
        <span className="code-file-path">{file.path}</span>
      </div>
      <div className="code-editor-wrap">
        <MonacoEditor
          key={file.path}
          value={file.content}
          language={kindToLanguage(file.kind)}
          theme={THEME_NAME}
          onMount={handleMount}
          height="100%"
          options={{
            readOnly: true,
            domReadOnly: true,
            fontSize: 13,
            fontFamily: getCssVar("--font-mono") || "'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            lineNumbers: "on",
            minimap: { enabled: true, scale: 1 },
            scrollBeyondLastLine: false,
            wordWrap: "off",
            renderWhitespace: "none",
            guides: { indentation: true, bracketPairs: false },
            folding: true,
            contextmenu: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            renderLineHighlight: "line",
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            padding: { top: 8, bottom: 8 },
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          }}
        />
      </div>
    </div>
  );
}

function kindIcon(kind: string): JSX.Element {
  switch (kind) {
    case "rust":     return <FileCode2 size={14} color="var(--syntax-number)" />;
    case "markdown": return <FileText  size={14} color="var(--syntax-type)"   />;
    case "toml":     return <Settings2 size={14} color="var(--syntax-keyword)" />;
    default:         return <File      size={14} color="var(--text-faint)"    />;
  }
}
