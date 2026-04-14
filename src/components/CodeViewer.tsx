// components/CodeViewer.tsx — Syntax-highlighted code/markdown viewer using CodeMirror
import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { rust } from "@codemirror/lang-rust";
import { markdown } from "@codemirror/lang-markdown";
import { FileCode2, FileText, Settings2, File } from "lucide-react";
import { FileContent, useStore } from "../store";
import "./CodeViewer.css";

interface Props {
  file: FileContent | null;
  isLoading?: boolean;
}

function getCssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function buildCmTheme() {
  const isDark = document.documentElement.getAttribute("data-theme-mode") === "dark";

  const editorTheme = EditorView.theme({
    "&": { color: getCssVar("--code-text"), backgroundColor: getCssVar("--code-bg"), height: "100%" },
    ".cm-content": { caretColor: getCssVar("--accent") },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: getCssVar("--accent") },
    "&.cm-focused .cm-cursor": { borderLeftColor: getCssVar("--accent") },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: getCssVar("--bg-selected"),
    },
    ".cm-activeLine": { backgroundColor: getCssVar("--bg-hover") },
    ".cm-gutters": {
      backgroundColor: getCssVar("--code-bg"),
      color: getCssVar("--text-faint"),
      border: "none",
      borderRight: `1px solid ${getCssVar("--border-subtle")}`,
    },
    ".cm-activeLineGutter": { backgroundColor: getCssVar("--bg-hover") },
    ".cm-lineNumbers .cm-gutterElement": { padding: "0 12px 0 8px", minWidth: "32px" },
    ".cm-foldPlaceholder": { backgroundColor: getCssVar("--bg-elevated"), color: getCssVar("--text-muted"), border: "none" },
    ".cm-tooltip": { backgroundColor: getCssVar("--bg-elevated"), border: `1px solid ${getCssVar("--border-default")}`, color: getCssVar("--text-normal") },
    ".cm-matchingBracket": { outline: `1px solid ${getCssVar("--accent")}`, color: "inherit !important" },
    ".cm-searchMatch": { backgroundColor: getCssVar("--accent-muted"), outline: `1px solid ${getCssVar("--accent")}` },
  }, { dark: isDark });

  const highlightStyle = syntaxHighlighting(HighlightStyle.define([
    { tag: tags.keyword,                               color: getCssVar("--code-keyword"), fontWeight: "bold" },
    { tag: [tags.string, tags.special(tags.string)],  color: getCssVar("--code-string") },
    { tag: tags.comment,                               color: getCssVar("--code-comment"), fontStyle: "italic" },
    { tag: [tags.number, tags.bool, tags.null],        color: getCssVar("--code-number") },
    { tag: [tags.typeName, tags.className],            color: getCssVar("--code-type") },
    { tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], color: getCssVar("--code-function") },
    { tag: [tags.punctuation, tags.bracket],           color: getCssVar("--code-punct") },
    { tag: [tags.operator, tags.operatorKeyword],      color: getCssVar("--code-operator") },
    { tag: [tags.attributeName, tags.attributeValue],  color: getCssVar("--code-attribute") },
    { tag: tags.propertyName,                          color: getCssVar("--code-attribute") },
    { tag: tags.variableName,                          color: getCssVar("--code-text") },
    { tag: tags.self,                                  color: getCssVar("--code-keyword") },
    { tag: tags.heading,                               color: getCssVar("--code-keyword"), fontWeight: "bold" },
    { tag: tags.emphasis,                              fontStyle: "italic" },
    { tag: tags.strong,                                fontWeight: "bold" },
    { tag: tags.link,                                  color: getCssVar("--text-link"), textDecoration: "underline" },
    { tag: tags.meta,                                  color: getCssVar("--code-comment") },
    { tag: tags.invalid,                               color: getCssVar("--color-red") },
  ]));

  return [editorTheme, highlightStyle];
}

export default function CodeViewer({ file, isLoading }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef   = useRef<EditorView | null>(null);
  const cmTheme   = useRef(new Compartment());

  const theme = useStore((s) => s.theme);

  // Create / recreate editor when the file changes
  useEffect(() => {
    if (!editorRef.current || !file) return;

    const extensions = [
      basicSetup,
      cmTheme.current.of(buildCmTheme()),
      EditorView.editable.of(false),
      EditorView.lineWrapping,
    ];

    if (file.kind === "rust")     extensions.push(rust());
    else if (file.kind === "markdown") extensions.push(markdown());

    const state = EditorState.create({ doc: file.content, extensions });
    const view  = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;

    return () => { view.destroy(); viewRef.current = null; };
  }, [file?.path, file?.kind]);

  // Update content without recreating the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !file) return;
    const current = view.state.doc.toString();
    if (current !== file.content) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: file.content } });
    }
  }, [file?.content]);

  // Hot-swap the CodeMirror theme whenever the Zustand theme changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: cmTheme.current.reconfigure(buildCmTheme()) });
  }, [theme]);

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
      <div className="code-editor-wrap" ref={editorRef} />
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
