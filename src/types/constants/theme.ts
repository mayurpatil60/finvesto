// ─── Theme Definitions ────────────────────────────────────────────────────────

export interface IThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  error: string;
  border: string;
  headerBackground: string;
  headerText: string;
  cardShadow: string;
  switchTrack: string;
  switchThumb: string;
}

export interface ITheme {
  dark: boolean;
  colors: IThemeColors;
}

export const DARK_THEME: ITheme = {
  dark: true,
  colors: {
    primary: "#4A9EFF",
    secondary: "#34A853",
    background: "#0D0D0D",
    surface: "#1A1A1A",
    surfaceVariant: "#242424",
    text: "#F0F0F0",
    textSecondary: "#A0A0A0",
    error: "#FF5252",
    border: "#2E2E2E",
    headerBackground: "#141414",
    headerText: "#F0F0F0",
    cardShadow: "#000000",
    switchTrack: "#4A9EFF",
    switchThumb: "#FFFFFF",
  },
};

export const LIGHT_THEME: ITheme = {
  dark: false,
  colors: {
    primary: "#1A73E8",
    secondary: "#34A853",
    background: "#F5F5F5",
    surface: "#FFFFFF",
    surfaceVariant: "#F0F0F0",
    text: "#212121",
    textSecondary: "#757575",
    error: "#D32F2F",
    border: "#E0E0E0",
    headerBackground: "#1A73E8",
    headerText: "#FFFFFF",
    cardShadow: "#000000",
    switchTrack: "#1A73E8",
    switchThumb: "#FFFFFF",
  },
};
