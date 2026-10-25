import { Platform } from "react-native";

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  primaryMuted: string;
  error: string;
  errorSurface: string;
  success: string;
  successSurface: string;
  overlay: string;
  codeBackground: string;
  codeText: string;
  link: string;
}

export const lightColors: ThemeColors = {
  background: "#f4f3ef",
  surface: "#fffdfa",
  surfaceMuted: "#ece9e2",
  border: "#d9d4c9",
  text: "#211d1a",
  textMuted: "#70675f",
  primary: "#b4234d",
  primaryText: "#ffffff",
  primaryMuted: "#fbe4ea",
  error: "#b42318",
  errorSurface: "#fee4e2",
  success: "#067647",
  successSurface: "#dcfae6",
  overlay: "rgba(24, 18, 15, 0.45)",
  codeBackground: "#efece5",
  codeText: "#24292f",
  link: "#9f1239",
};

export const darkColors: ThemeColors = {
  background: "#141210",
  surface: "#1e1b18",
  surfaceMuted: "#2a2521",
  border: "#3d3732",
  text: "#f6f1eb",
  textMuted: "#b8aca2",
  primary: "#ef6f9b",
  primaryText: "#2a0713",
  primaryMuted: "#3b1725",
  error: "#ff8a80",
  errorSurface: "#3a1d1b",
  success: "#7ee2a8",
  successSurface: "#123221",
  overlay: "rgba(0, 0, 0, 0.62)",
  codeBackground: "#151311",
  codeText: "#f6f1eb",
  link: "#f9a8d4",
};

export const monoFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;
