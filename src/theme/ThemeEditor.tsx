// theme/ThemeEditor.tsx — Visual theme picker, editor, import/export

import { useState, useRef } from "react";
import { useStore } from "../store";
import { BUILT_IN_THEMES } from "./defaults";
import type { Theme, ThemeColors } from "./types";

const COLOR_GROUPS: { label: string; keys: (keyof ThemeColors)[] }[] = [
  {
    label: "Backgrounds",
    keys: ["bgBase", "bgSurface", "bgElevated", "bgInput", "bgHover", "bgSelected"],
  },
  {
    label: "Text",
    keys: ["textNormal", "textMuted", "textFaint", "textOnAccent", "textLink"],
  },
  {
    label: "Accent",
    keys: ["accentColor", "accentHover", "accentMuted"],
  },
  {
    label: "Borders",
    keys: ["borderSubtle", "borderDefault", "borderFocus"],
  },
  {
    label: "Status Colors",
    keys: ["colorRed", "colorGreen", "colorYellow", "colorBlue", "colorPurple", "colorOrange"],
  },
  {
    label: "Syntax Highlighting",
    keys: [
      "codeBg", "codeText", "codeKeyword", "codeString", "codeComment",
      "codeNumber", "codeType", "codeFunction", "codePunct", "codeOperator", "codeAttribute",
    ],
  },
  {
    label: "Chrome",
    keys: [
      "titlebarBg", "sidebarBg", "activityBarBg", "activityBarIcon",
      "activityBarIconActive", "activityBarIndicator",
      "tabBarBg", "tabBg", "tabActiveBg", "tabText", "tabTextActive", "tabBorder", "scrollbarThumb",
    ],
  },
];

function camelToLabel(s: string): string {
  return s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export function ThemeEditor() {
  const { theme, allThemes, setTheme, addCustomTheme, removeCustomTheme } = useStore((s) => ({
    theme: s.theme,
    allThemes: s.allThemes,
    setTheme: s.setTheme,
    addCustomTheme: s.addCustomTheme,
    removeCustomTheme: s.removeCustomTheme,
  }));

  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [editingName, setEditingName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBuiltIn = (id: string) => BUILT_IN_THEMES.some((t) => t.id === id);

  // ── Start editing a copy of the current theme ────────────────────────────
  function startEdit(base: Theme) {
    const copy: Theme = {
      ...base,
      id: `custom-${Date.now()}`,
      name: `${base.name} (copy)`,
      author: "You",
      colors: { ...base.colors },
      fonts: { ...base.fonts },
      radius: { ...base.radius },
    };
    setEditingTheme(copy);
    setEditingName(copy.name);
  }

  function handleColorChange(key: keyof ThemeColors, val: string) {
    if (!editingTheme) return;
    setEditingTheme({ ...editingTheme, colors: { ...editingTheme.colors, [key]: val } });
  }

  function saveEdit() {
    if (!editingTheme) return;
    const final = { ...editingTheme, name: editingName };
    addCustomTheme(final);
    setTheme(final.id);
    setEditingTheme(null);
  }

  // ── Export ───────────────────────────────────────────────────────────────
  function exportTheme(t: Theme) {
    const json = JSON.stringify(t, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Import ───────────────────────────────────────────────────────────────
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string) as Theme;
        if (!imported.id || !imported.name || !imported.colors) throw new Error("Invalid theme");
        imported.id = `custom-${Date.now()}`;
        addCustomTheme(imported);
        setTheme(imported.id);
      } catch {
        alert("Invalid theme file. Expected a Know theme JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (editingTheme) {
    return (
      <div className="theme-editor-container">
        <div className="theme-editor-header">
          <button className="te-back-btn" onClick={() => setEditingTheme(null)}>
            ← Back
          </button>
          <input
            className="te-name-input"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            placeholder="Theme name"
          />
          <button className="te-save-btn" onClick={saveEdit}>
            Save Theme
          </button>
        </div>

        <div className="te-preview-bar" style={{ background: editingTheme.colors.bgBase }}>
          <span style={{ color: editingTheme.colors.textNormal, fontFamily: editingTheme.fonts.ui }}>
            Preview •
          </span>
          <span style={{ color: editingTheme.colors.accentColor }}>Accent</span>
          <span style={{ color: editingTheme.colors.textMuted }}>Muted</span>
          <span style={{ color: editingTheme.colors.colorGreen }}>✓ ok</span>
          <span style={{ color: editingTheme.colors.colorRed }}>✗ err</span>
        </div>

        <div className="te-groups">
          {COLOR_GROUPS.map((group) => (
            <div key={group.label} className="te-group">
              <div className="te-group-label">{group.label}</div>
              <div className="te-color-grid">
                {group.keys.map((key) => (
                  <label key={key} className="te-color-row">
                    <input
                      type="color"
                      value={editingTheme.colors[key]}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      className="te-color-swatch"
                    />
                    <span className="te-color-label">{camelToLabel(key)}</span>
                    <span className="te-color-value">{editingTheme.colors[key]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="theme-editor-container">
      <div className="te-section-title">Built-in Themes</div>
      <div className="te-theme-list">
        {BUILT_IN_THEMES.map((t) => (
          <ThemeCard
            key={t.id}
            t={t}
            active={theme.id === t.id}
            onSelect={() => setTheme(t.id)}
            onEdit={() => startEdit(t)}
            onExport={() => exportTheme(t)}
            builtIn
          />
        ))}
      </div>

      {allThemes.filter((t) => !isBuiltIn(t.id)).length > 0 && (
        <>
          <div className="te-section-title">Custom Themes</div>
          <div className="te-theme-list">
            {allThemes
              .filter((t) => !isBuiltIn(t.id))
              .map((t) => (
                <ThemeCard
                  key={t.id}
                  t={t}
                  active={theme.id === t.id}
                  onSelect={() => setTheme(t.id)}
                  onEdit={() => startEdit(t)}
                  onExport={() => exportTheme(t)}
                  onDelete={() => removeCustomTheme(t.id)}
                  builtIn={false}
                />
              ))}
          </div>
        </>
      )}

      <div className="te-actions">
        <button className="te-action-btn" onClick={() => startEdit(theme)}>
          + Create from current
        </button>
        <button className="te-action-btn" onClick={() => fileInputRef.current?.click()}>
          ↑ Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </div>
    </div>
  );
}

function ThemeCard({
  t, active, onSelect, onEdit, onExport, onDelete, builtIn,
}: {
  t: Theme;
  active: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onExport: () => void;
  onDelete?: () => void;
  builtIn: boolean;
}) {
  const swatches = [
    t.colors.bgBase, t.colors.bgSurface, t.colors.accentColor,
    t.colors.textNormal, t.colors.codeKeyword, t.colors.codeString,
  ];
  return (
    <div className={`te-theme-card ${active ? "te-theme-card--active" : ""}`}>
      <button className="te-theme-card-main" onClick={onSelect}>
        <div className="te-swatches">
          {swatches.map((c, i) => (
            <div key={i} className="te-swatch" style={{ background: c }} />
          ))}
        </div>
        <div className="te-theme-info">
          <span className="te-theme-name">{t.name}</span>
          {t.description && <span className="te-theme-desc">{t.description}</span>}
          <span className="te-theme-mode">{t.mode}</span>
        </div>
        {active && <span className="te-active-badge">✓</span>}
      </button>
      <div className="te-card-actions">
        <button className="te-card-btn" onClick={onEdit} title="Customize">
          ✎
        </button>
        <button className="te-card-btn" onClick={onExport} title="Export JSON">
          ↓
        </button>
        {!builtIn && onDelete && (
          <button className="te-card-btn te-card-btn--danger" onClick={onDelete} title="Delete">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
