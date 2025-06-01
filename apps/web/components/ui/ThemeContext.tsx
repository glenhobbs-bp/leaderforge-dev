import React, { createContext, useContext } from "react";

// Accepts the theme object (from contextConfig.json)
const ThemeContext = createContext<any>(null);

export const ThemeProvider = ThemeContext.Provider;
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
