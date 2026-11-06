import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light" | "evening";

interface Ctx {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<Ctx | null>(null);
const THEMES: Theme[] = ["dark", "light", "evening"];

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove(...THEMES);
  root.classList.add(t);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("mrf-theme")) as Theme | null;
    if (saved && THEMES.includes(saved)) setTheme(saved);
    else applyTheme("dark");
  }, []);

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== "undefined") localStorage.setItem("mrf-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Ctx {
  const c = useContext(ThemeContext);
  if (!c) throw new Error("useTheme must be used inside <ThemeProvider>");
  return c;
}
