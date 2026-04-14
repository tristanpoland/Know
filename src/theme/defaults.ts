// theme/defaults.ts — Built-in themes

import type { Theme } from "./types";

// Load all JSON theme files from src/themes/ at Vite build time
const _modules = import.meta.glob<{ default: Theme }>("../themes/*.json", { eager: true });
export const BUILT_IN_THEMES: Theme[] = Object.values(_modules).map((m) => m.default);

/** Convert a Theme's color map to CSS custom properties and inject into :root */
export function applyTheme(theme: Theme): void {
  const style = document.documentElement.style;

  const c = theme.colors;
  style.setProperty("--bg-base",      c.bgBase);
  style.setProperty("--bg-surface",   c.bgSurface);
  style.setProperty("--bg-elevated",  c.bgElevated);
  style.setProperty("--bg-input",     c.bgInput);
  style.setProperty("--bg-hover",     c.bgHover);
  style.setProperty("--bg-selected",  c.bgSelected);
  style.setProperty("--bg-overlay",   c.bgOverlay);

  style.setProperty("--text-normal",   c.textNormal);
  style.setProperty("--text-muted",    c.textMuted);
  style.setProperty("--text-faint",    c.textFaint);
  style.setProperty("--text-on-accent",c.textOnAccent);
  style.setProperty("--text-link",     c.textLink);

  style.setProperty("--accent",       c.accentColor);
  style.setProperty("--accent-hover", c.accentHover);
  style.setProperty("--accent-muted", c.accentMuted);

  style.setProperty("--border-subtle",  c.borderSubtle);
  style.setProperty("--border-default", c.borderDefault);
  style.setProperty("--border-focus",   c.borderFocus);

  style.setProperty("--color-red",    c.colorRed);
  style.setProperty("--color-green",  c.colorGreen);
  style.setProperty("--color-yellow", c.colorYellow);
  style.setProperty("--color-blue",   c.colorBlue);
  style.setProperty("--color-purple", c.colorPurple);
  style.setProperty("--color-orange", c.colorOrange);

  style.setProperty("--code-bg",        c.codeBg);
  style.setProperty("--code-text",      c.codeText);
  style.setProperty("--code-keyword",   c.codeKeyword);
  style.setProperty("--code-string",    c.codeString);
  style.setProperty("--code-comment",   c.codeComment);
  style.setProperty("--code-number",    c.codeNumber);
  style.setProperty("--code-type",      c.codeType);
  style.setProperty("--code-function",  c.codeFunction);
  style.setProperty("--code-punct",     c.codePunct);
  style.setProperty("--code-operator",  c.codeOperator);
  style.setProperty("--code-attribute", c.codeAttribute);

  style.setProperty("--titlebar-bg",             c.titlebarBg);
  style.setProperty("--sidebar-bg",              c.sidebarBg);
  style.setProperty("--activity-bar-bg",         c.activityBarBg);
  style.setProperty("--activity-icon",           c.activityBarIcon);
  style.setProperty("--activity-icon-active",    c.activityBarIconActive);
  style.setProperty("--activity-indicator",      c.activityBarIndicator);
  style.setProperty("--tab-bar-bg",              c.tabBarBg);
  style.setProperty("--tab-bg",                  c.tabBg);
  style.setProperty("--tab-active-bg",           c.tabActiveBg);
  style.setProperty("--tab-text",                c.tabText);
  style.setProperty("--tab-text-active",         c.tabTextActive);
  style.setProperty("--tab-border",              c.tabBorder);
  style.setProperty("--scrollbar-thumb",         c.scrollbarThumb);

  const f = theme.fonts;
  style.setProperty("--font-ui",   f.ui);
  style.setProperty("--font-mono", f.monospace);
  style.setProperty("--font-text", f.text);

  const r = theme.radius;
  style.setProperty("--radius-sm", r.sm);
  style.setProperty("--radius-md", r.md);
  style.setProperty("--radius-lg", r.lg);
  style.setProperty("--radius-xl", r.xl);

  document.documentElement.setAttribute("data-theme-mode", theme.mode);
}

const STORAGE_KEY = "know-active-theme-id";
const CUSTOM_KEY  = "know-custom-themes";

export function loadStoredThemeId(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "obsidian-dark";
}

export function saveThemeId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id);
}

export function loadCustomThemes(): Theme[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomThemes(themes: Theme[]): void {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(themes));
}
