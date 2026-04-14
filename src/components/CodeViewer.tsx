// components/CodeViewer.tsx — Syntax-highlighted code/markdown viewer using CodeMirror
import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { rust } from "@codemirror/lang-rust";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { FileContent } from "../store";
import "./CodeViewer.css";

interface Props {
  file: FileContent | null;
  isLoading?: boolean;
}

export default function CodeViewer({ file, isLoading }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current || !file) return;

    const extensions = [
      basicSetup,
      oneDark,
      EditorView.editable.of(false),
      EditorView.lineWrapping,
    ];

    if (file.kind === "rust") {
      extensions.push(rust());
    } else if (file.kind === "markdown") {
      extensions.push(markdown());
    }

    const state = EditorState.create({
      doc: file.content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [file?.path, file?.content, file?.kind]);

  // Update content when file changes without recreating the editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !file) return;
    const current = view.state.doc.toString();
    if (current !== file.content) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: file.content },
      });
    }
  }, [file?.content]);

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
        <span className="code-file-icon">{kindIcon(file.kind)}</span>
        <span className="code-file-name">{fileName}</span>
        <span className="code-file-path">{file.path}</span>
      </div>
      <div className="code-editor-wrap" ref={editorRef} />
    </div>
  );
}

function kindIcon(kind: string): string {
  switch (kind) {
    case "rust": return "🦀";
    case "markdown": return "📝";
    case "toml": return "⚙";
    default: return "📄";
  }
}
