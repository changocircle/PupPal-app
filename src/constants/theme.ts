/**
 * PupPal Design System Tokens
 * Source of truth: DESIGN-SYSTEM.md
 *
 * These tokens mirror the Tailwind config for use in
 * imperative code (Reanimated, SVG, charts, etc.)
 */

export const COLORS = {
  primary: {
    DEFAULT: "#FF6B5C",
    dark: "#E8554A",
    light: "#FFF0EE",
    extralight: "#FFF8F7",
  },
  secondary: {
    DEFAULT: "#1B2333",
    light: "#2D3A4A",
    lighter: "#6B7280",
  },
  accent: {
    DEFAULT: "#FFB547",
    dark: "#F5A623",
    light: "#FFF6E5",
  },
  success: {
    DEFAULT: "#5CB882",
    light: "#E8F5EE",
  },
  warning: {
    DEFAULT: "#F5A623",
    light: "#FFF6E5",
  },
  error: {
    DEFAULT: "#EF6461",
    light: "#FDEDED",
  },
  info: {
    DEFAULT: "#5B9BD5",
    light: "#EBF3FA",
  },
  background: "#FFFAF7",
  surface: "#FFFFFF",
  border: "#F0EBE6",
  text: {
    primary: "#1B2333",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    inverse: "#FFFFFF",
  },
  disabled: "#D1D5DB",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const TYPOGRAPHY = {
  display: { size: 36, lineHeight: 40, weight: "800" as const },
  h1: { size: 30, lineHeight: 36, weight: "700" as const },
  h2: { size: 24, lineHeight: 30, weight: "700" as const },
  h3: { size: 20, lineHeight: 26, weight: "600" as const },
  "body-lg": { size: 18, lineHeight: 26, weight: "400" as const },
  body: { size: 16, lineHeight: 24, weight: "400" as const },
  "body-medium": { size: 16, lineHeight: 24, weight: "500" as const },
  "body-sm": { size: 14, lineHeight: 20, weight: "400" as const },
  "body-sm-medium": { size: 14, lineHeight: 20, weight: "500" as const },
  caption: { size: 12, lineHeight: 16, weight: "500" as const },
  overline: { size: 11, lineHeight: 14, weight: "600" as const },
} as const;

export const SHADOWS = {
  card: {
    shadowColor: "#1B2333",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: "#1B2333",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  modal: {
    shadowColor: "#1B2333",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;
