"use client";
import * as React from "react";

type Theme = "dark" | "light";
const ThemeContext = React.createContext<{ theme: Theme; setTheme: (t: Theme) => void } | null>(null);
const STORAGE_KEY = "rich-it-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("dark");

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored ?? "dark"; // dark-first product
    applyTheme(initial);
    setThemeState(initial);
  }, []);

  const setTheme = React.useCallback((t: Theme) => {
    applyTheme(t);
    setThemeState(t);
    window.localStorage.setItem(STORAGE_KEY, t);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
