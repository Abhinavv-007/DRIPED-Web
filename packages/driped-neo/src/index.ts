/**
 * @driped/neo — Playful Neo-Brutal + Dark design tokens.
 *
 * TypeScript export of the tokens. Mirrors `tokens.json` exactly so consumers
 * get type safety + autocomplete.
 */

export const neoColors = {
  dark: {
    bg: "#0E0B08",
    surface: "#1A1612",
    surfaceRaised: "#241E18",
    surfaceSunken: "#0A0705",
    ink: "#F7F1E4",
    inkMid: "#C8BFAC",
    inkLow: "#8C836F",
    inkGhost: "#4A4338",
    gold: "#E8B168",
    goldDeep: "#C4894B",
    goldSoft: "#3A2E1E",
    cream: "#FFF3D6",
    border: "#F7F1E4",
    borderSoft: "#4A4338",
    mint: "#B8F0C9",
    coral: "#FFAE9B",
    sky: "#9BD4FF",
    lilac: "#D9BBFF",
    lemon: "#FFE58A",
    success: "#34D97A",
    warning: "#FFC53B",
    danger: "#FF5B5B",
    info: "#5BAEFF",
  },
  light: {
    bg: "#FFF8F0",
    surface: "#FFFFFF",
    surfaceRaised: "#FFF0DB",
    surfaceSunken: "#F5EDE3",
    ink: "#1A1612",
    inkMid: "#4A4338",
    inkLow: "#7A6E63",
    inkGhost: "#C8BFAC",
    gold: "#C4894B",
    goldDeep: "#A26F37",
    goldSoft: "#F5E7D3",
    cream: "#FFF3D6",
    border: "#1A1612",
    borderSoft: "#C8BFAC",
    mint: "#8FE3A7",
    coral: "#FF8F78",
    sky: "#6FBFFF",
    lilac: "#B89BFF",
    lemon: "#FFD060",
    success: "#00A650",
    warning: "#D9A100",
    danger: "#D93A3A",
    info: "#2B7ED9",
  },
} as const;

export const neoRadius = {
  sm: "6px",
  md: "10px",
  lg: "12px",
  xl: "16px",
  "2xl": "20px",
  pill: "999px",
} as const;

export const neoBorder = {
  thin: "1px",
  base: "2px",
  thick: "3px",
} as const;

export const neoShadow = {
  dark: {
    sm: "2px 2px 0 0 #F7F1E4",
    md: "4px 4px 0 0 #F7F1E4",
    lg: "6px 6px 0 0 #F7F1E4",
    gold: "4px 4px 0 0 #E8B168",
    danger: "4px 4px 0 0 #FF5B5B",
    inset: "inset 2px 2px 0 0 #4A4338",
  },
  light: {
    sm: "2px 2px 0 0 #1A1612",
    md: "4px 4px 0 0 #1A1612",
    lg: "6px 6px 0 0 #1A1612",
    gold: "4px 4px 0 0 #C4894B",
    danger: "4px 4px 0 0 #D93A3A",
    inset: "inset 2px 2px 0 0 #C8BFAC",
  },
} as const;

export const neoMotion = {
  duration: {
    fast: "80ms",
    base: "150ms",
    slow: "300ms",
  },
  ease: {
    out: "cubic-bezier(0.22, 1, 0.36, 1)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
} as const;

export const neoTypography = {
  family: {
    sans: "Inter, system-ui, -apple-system, sans-serif",
    heading: "'Space Grotesk', Inter, system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  size: {
    xs: "12px",
    sm: "13px",
    base: "15px",
    md: "17px",
    lg: "20px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "40px",
    "4xl": "56px",
  },
  tracking: {
    tight: "-0.02em",
    normal: "0",
    label: "0.08em",
    caps: "0.16em",
  },
} as const;

export const neoSpacing = {
  "0": "0",
  "1": "4px",
  "2": "8px",
  "3": "12px",
  "4": "16px",
  "5": "20px",
  "6": "24px",
  "8": "32px",
  "10": "40px",
  "12": "48px",
  "16": "64px",
} as const;

export type NeoMode = "dark" | "light";
export type NeoColor = keyof typeof neoColors.dark;
export type NeoRadius = keyof typeof neoRadius;
export type NeoShadow = keyof typeof neoShadow.dark;
