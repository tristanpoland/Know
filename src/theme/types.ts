// theme/types.ts — Theme data model

export interface ThemeColors {
  // ── Backgrounds ──────────────────────────────────────
  bgBase: string;       // deepest background (app shell)
  bgSurface: string;    // panels, sidebar
  bgElevated: string;   // tab content, cards
  bgInput: string;      // inputs, selects
  bgHover: string;      // item hover
  bgSelected: string;   // item selected
  bgOverlay: string;    // modals, tooltips

  // ── Text ─────────────────────────────────────────────
  textNormal: string;
  textMuted: string;
  textFaint: string;
  textOnAccent: string;
  textLink: string;

  // ── Interactive ───────────────────────────────────────
  accentColor: string;
  accentHover: string;
  accentMuted: string;  // 20% opacity accent bg

  // ── Borders ───────────────────────────────────────────
  borderSubtle: string;
  borderDefault: string;
  borderFocus: string;

  // ── Status ────────────────────────────────────────────
  colorRed: string;
  colorGreen: string;
  colorYellow: string;
  colorBlue: string;
  colorPurple: string;
  colorOrange: string;

  // ── Code / Syntax ────────────────────────────────────
  codeBg: string;
  codeText: string;
  codeKeyword: string;
  codeString: string;
  codeComment: string;
  codeNumber: string;
  codeType: string;
  codeFunction: string;
  codePunct: string;
  codeOperator: string;
  codeAttribute: string;

  // ── Specific chrome ───────────────────────────────────
  titlebarBg: string;
  sidebarBg: string;
  activityBarBg: string;
  activityBarIcon: string;
  activityBarIconActive: string;
  activityBarIndicator: string;
  tabBarBg: string;
  tabBg: string;
  tabActiveBg: string;
  tabText: string;
  tabTextActive: string;
  tabBorder: string;
  scrollbarThumb: string;
}

export interface ThemeFonts {
  ui: string;
  monospace: string;
  text: string;
}

export interface ThemeRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface Theme {
  id: string;
  name: string;
  author?: string;
  description?: string;
  version: string;
  mode: "dark" | "light";
  colors: ThemeColors;
  fonts: ThemeFonts;
  radius: ThemeRadius;
}
