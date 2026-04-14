// theme/defaults.ts — Built-in themes

import type { Theme } from "./types";

export const OBSIDIAN_DARK: Theme = {
  id: "obsidian-dark",
  name: "Obsidian",
  author: "Know",
  description: "Deep dark theme inspired by Obsidian",
  version: "1.0.0",
  mode: "dark",
  colors: {
    bgBase:     "#1a1a1a",
    bgSurface:  "#1e1e1e",
    bgElevated: "#252525",
    bgInput:    "#2d2d2d",
    bgHover:    "#2a2a2a",
    bgSelected: "#323232",
    bgOverlay:  "#111111ee",

    textNormal:  "#dcddde",
    textMuted:   "#999999",
    textFaint:   "#555555",
    textOnAccent:"#ffffff",
    textLink:    "#8b6ce7",

    accentColor: "#7c3aed",
    accentHover: "#6d28d9",
    accentMuted: "#7c3aed26",

    borderSubtle:  "#2a2a2a",
    borderDefault: "#383838",
    borderFocus:   "#7c3aed",

    colorRed:    "#fc6f6f",
    colorGreen:  "#7ec58c",
    colorYellow: "#e9c46a",
    colorBlue:   "#5eaeff",
    colorPurple: "#a78bfa",
    colorOrange: "#f4a261",

    codeBg:        "#141414",
    codeText:      "#d4d4d4",
    codeKeyword:   "#c792ea",
    codeString:    "#c3e88d",
    codeComment:   "#4a5568",
    codeNumber:    "#f78c6c",
    codeType:      "#ffcb6b",
    codeFunction:  "#82aaff",
    codePunct:     "#89ddff",
    codeOperator:  "#89ddff",
    codeAttribute: "#c792ea",

    titlebarBg:            "#141414",
    sidebarBg:             "#1e1e1e",
    activityBarBg:         "#141414",
    activityBarIcon:       "#6b7280",
    activityBarIconActive: "#a78bfa",
    activityBarIndicator:  "#7c3aed",
    tabBarBg:              "#1a1a1a",
    tabBg:                 "#1a1a1a",
    tabActiveBg:           "#252525",
    tabText:               "#6b7280",
    tabTextActive:         "#dcddde",
    tabBorder:             "#2a2a2a",
    scrollbarThumb:        "#3a3a3a",
  },
  fonts: {
    ui:        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    monospace: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
    text:      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  radius: { sm: "4px", md: "6px", lg: "10px", xl: "14px" },
};

export const GITHUB_DARK: Theme = {
  id: "github-dark",
  name: "GitHub Dark",
  author: "Know",
  description: "Clean dark theme inspired by GitHub",
  version: "1.0.0",
  mode: "dark",
  colors: {
    bgBase:     "#0d1117",
    bgSurface:  "#161b22",
    bgElevated: "#1c2128",
    bgInput:    "#21262d",
    bgHover:    "#1c2128",
    bgSelected: "#2d333b",
    bgOverlay:  "#0d1117ee",

    textNormal:  "#e6edf3",
    textMuted:   "#8b949e",
    textFaint:   "#484f58",
    textOnAccent:"#ffffff",
    textLink:    "#58a6ff",

    accentColor: "#1f6feb",
    accentHover: "#388bfd",
    accentMuted: "#1f6feb26",

    borderSubtle:  "#1c2128",
    borderDefault: "#30363d",
    borderFocus:   "#388bfd",

    colorRed:    "#ff7b72",
    colorGreen:  "#56d364",
    colorYellow: "#e3b341",
    colorBlue:   "#79c0ff",
    colorPurple: "#d2a8ff",
    colorOrange: "#ffa657",

    codeBg:        "#0d1117",
    codeText:      "#e6edf3",
    codeKeyword:   "#ff7b72",
    codeString:    "#a5d6ff",
    codeComment:   "#484f58",
    codeNumber:    "#79c0ff",
    codeType:      "#ffa657",
    codeFunction:  "#d2a8ff",
    codePunct:     "#8b949e",
    codeOperator:  "#ff7b72",
    codeAttribute: "#79c0ff",

    titlebarBg:            "#010409",
    sidebarBg:             "#161b22",
    activityBarBg:         "#010409",
    activityBarIcon:       "#484f58",
    activityBarIconActive: "#58a6ff",
    activityBarIndicator:  "#1f6feb",
    tabBarBg:              "#0d1117",
    tabBg:                 "#0d1117",
    tabActiveBg:           "#161b22",
    tabText:               "#484f58",
    tabTextActive:         "#e6edf3",
    tabBorder:             "#1c2128",
    scrollbarThumb:        "#30363d",
  },
  fonts: {
    ui:        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    monospace: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
    text:      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  radius: { sm: "6px", md: "6px", lg: "8px", xl: "12px" },
};

export const NORD: Theme = {
  id: "nord",
  name: "Nord",
  author: "Know",
  description: "Cool arctic blue theme",
  version: "1.0.0",
  mode: "dark",
  colors: {
    bgBase:     "#242933",
    bgSurface:  "#2e3440",
    bgElevated: "#3b4252",
    bgInput:    "#434c5e",
    bgHover:    "#353c4a",
    bgSelected: "#434c5e",
    bgOverlay:  "#1d2128ee",

    textNormal:  "#eceff4",
    textMuted:   "#9aa3b0",
    textFaint:   "#616e88",
    textOnAccent:"#2e3440",
    textLink:    "#81a1c1",

    accentColor: "#5e81ac",
    accentHover: "#81a1c1",
    accentMuted: "#5e81ac26",

    borderSubtle:  "#2e3440",
    borderDefault: "#434c5e",
    borderFocus:   "#81a1c1",

    colorRed:    "#bf616a",
    colorGreen:  "#a3be8c",
    colorYellow: "#ebcb8b",
    colorBlue:   "#81a1c1",
    colorPurple: "#b48ead",
    colorOrange: "#d08770",

    codeBg:        "#1e222a",
    codeText:      "#d8dee9",
    codeKeyword:   "#81a1c1",
    codeString:    "#a3be8c",
    codeComment:   "#4c566a",
    codeNumber:    "#b48ead",
    codeType:      "#8fbcbb",
    codeFunction:  "#88c0d0",
    codePunct:     "#81a1c1",
    codeOperator:  "#81a1c1",
    codeAttribute: "#d08770",

    titlebarBg:            "#1e222a",
    sidebarBg:             "#2e3440",
    activityBarBg:         "#1e222a",
    activityBarIcon:       "#4c566a",
    activityBarIconActive: "#88c0d0",
    activityBarIndicator:  "#5e81ac",
    tabBarBg:              "#242933",
    tabBg:                 "#242933",
    tabActiveBg:           "#2e3440",
    tabText:               "#4c566a",
    tabTextActive:         "#eceff4",
    tabBorder:             "#2e3440",
    scrollbarThumb:        "#434c5e",
  },
  fonts: {
    ui:        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    monospace: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    text:      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  radius: { sm: "4px", md: "6px", lg: "8px", xl: "12px" },
};

export const DAWN: Theme = {
  id: "dawn",
  name: "Dawn",
  author: "Know",
  description: "Warm, minimal light theme",
  version: "1.0.0",
  mode: "light",
  colors: {
    bgBase:     "#faf9f7",
    bgSurface:  "#f2f0ec",
    bgElevated: "#ffffff",
    bgInput:    "#ffffff",
    bgHover:    "#ebe9e4",
    bgSelected: "#e2dfd9",
    bgOverlay:  "#00000044",

    textNormal:  "#2d2b27",
    textMuted:   "#6b6867",
    textFaint:   "#a09e9c",
    textOnAccent:"#ffffff",
    textLink:    "#7c5cbf",

    accentColor: "#7c3aed",
    accentHover: "#6d28d9",
    accentMuted: "#7c3aed18",

    borderSubtle:  "#e9e7e1",
    borderDefault: "#d4d1cb",
    borderFocus:   "#7c3aed",

    colorRed:    "#c0392b",
    colorGreen:  "#27ae60",
    colorYellow: "#f39c12",
    colorBlue:   "#2980b9",
    colorPurple: "#7c3aed",
    colorOrange: "#e67e22",

    codeBg:        "#f5f3ef",
    codeText:      "#2d2b27",
    codeKeyword:   "#7c3aed",
    codeString:    "#27ae60",
    codeComment:   "#a09e9c",
    codeNumber:    "#e67e22",
    codeType:      "#2980b9",
    codeFunction:  "#7c3aed",
    codePunct:     "#6b6867",
    codeOperator:  "#7c3aed",
    codeAttribute: "#2980b9",

    titlebarBg:            "#eceae4",
    sidebarBg:             "#f2f0ec",
    activityBarBg:         "#eceae4",
    activityBarIcon:       "#a09e9c",
    activityBarIconActive: "#7c3aed",
    activityBarIndicator:  "#7c3aed",
    tabBarBg:              "#faf9f7",
    tabBg:                 "#faf9f7",
    tabActiveBg:           "#ffffff",
    tabText:               "#a09e9c",
    tabTextActive:         "#2d2b27",
    tabBorder:             "#e9e7e1",
    scrollbarThumb:        "#d4d1cb",
  },
  fonts: {
    ui:        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    monospace: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    text:      "Georgia, 'Times New Roman', serif",
  },
  radius: { sm: "4px", md: "6px", lg: "10px", xl: "16px" },
};

export const BUILT_IN_THEMES: Theme[] = [OBSIDIAN_DARK, GITHUB_DARK, NORD, DAWN];

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
  return localStorage.getItem(STORAGE_KEY) ?? OBSIDIAN_DARK.id;
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
