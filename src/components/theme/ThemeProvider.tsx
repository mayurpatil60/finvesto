// ─── Theme Context ────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState } from 'react';
import { DARK_THEME, LIGHT_THEME } from '../../types/constants/theme';
import type { ITheme } from '../../types/constants/theme';

interface IThemeContext {
  theme: ITheme;
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (dark: boolean) => void;
}

const ThemeContext = createContext<IThemeContext>({
  theme: DARK_THEME,
  isDark: true,
  toggleTheme: () => {},
  setDark: () => {},
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDark, setIsDark] = useState(true); // dark mode by default

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  const toggleTheme = () => setIsDark((prev) => !prev);
  const setDark = (dark: boolean) => setIsDark(dark);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): IThemeContext {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
