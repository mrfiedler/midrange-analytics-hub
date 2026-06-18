import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Mode = "newbie" | "pro";

interface Ctx {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
}

const ModeContext = createContext<Ctx | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("newbie");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("mrf-mode")) as Mode | null;
    if (saved === "newbie" || saved === "pro") setMode(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("mrf-mode", mode);
  }, [mode]);

  return (
    <ModeContext.Provider value={{ mode, setMode, toggle: () => setMode(mode === "newbie" ? "pro" : "newbie") }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode(): Ctx {
  const c = useContext(ModeContext);
  if (!c) throw new Error("useMode must be used inside <ModeProvider>");
  return c;
}
