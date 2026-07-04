import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, Shield, Swords, BarChart3, BookOpen, Settings, Search, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ModeToggle } from "@/components/ModeToggle";

// Static path served from /public - works on Vercel, Lovable, or any host
// without depending on the internal /__l5e/... proxy.
const LOGO_URL = "/mrf-logo.png";

const NAV = [
  { to: "/",          label: "Dashboard",              Icon: Home },
  { to: "/players",   label: "Jogadores",              Icon: Users },
  { to: "/teams",     label: "Times",                  Icon: Shield },
  { to: "/compare",   label: "Comparador",             Icon: Swords },
  { to: "/seasons",   label: "Temporadas & Histórico", Icon: BarChart3 },
  { to: "/glossary",  label: "Glossário",              Icon: BookOpen },
  { to: "/settings",  label: "Configurações",          Icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-hairline bg-sidebar sticky top-0 h-screen">
        <Link to="/" className="px-5 pt-6 pb-4 border-b border-hairline group">
          <img src={LOGO_URL} alt="Midrange Frenzy" className="h-20 w-auto transition-transform group-hover:scale-[1.02]" />
          <div className="mt-2 h-[2px] w-12 bg-flame rounded-full" />
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-0.5 scrollbar-thin overflow-y-auto">
          {NAV.map(({ to, label, Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={[
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-surface text-foreground"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground",
                ].join(" ")}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-flame" />}
                <Icon className={`size-4 shrink-0 ${active ? "text-flame" : "opacity-80 group-hover:opacity-100"}`} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-hairline text-[10px] uppercase tracking-widest text-muted-foreground/70">
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-flame pulse-dot" />
            v1.0 · powered by ESPN
          </span>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 max-w-[80vw] h-full bg-sidebar border-r border-hairline">
            <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-hairline">
              <img src={LOGO_URL} alt="Midrange Frenzy" className="h-12 w-auto" />
              <button
                aria-label="Fechar menu"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 hover:bg-surface"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {NAV.map(({ to, label, Icon }) => {
                const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={[
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                      active ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground",
                    ].join(" ")}
                  >
                    <Icon className={`size-4 shrink-0 ${active ? "text-flame" : ""}`} />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 min-w-0 p-4 sm:p-5 md:p-8">{children}</main>
        <footer className="px-4 sm:px-5 md:px-8 py-5 border-t border-hairline text-[11px] text-muted-foreground/70 flex flex-wrap items-center gap-3 justify-between">
          <span>Dados: ESPN · Estatísticas atualizadas diariamente</span>
          <span className="font-display uppercase tracking-widest">midrange · frenzy</span>
        </footer>
      </div>
    </div>
  );
}

function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-background/85 backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 md:px-8 h-14 sm:h-16">
        <button
          aria-label="Abrir menu"
          onClick={onOpenMenu}
          className="md:hidden rounded-md p-2 hover:bg-surface"
        >
          <Menu className="size-5" />
        </button>
        <Link to="/" className="md:hidden flex items-center shrink-0">
          <img src={LOGO_URL} alt="MRF" className="h-8 w-auto" />
        </Link>

        <GlobalSearch />

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ModeToggle />
        </div>
      </div>
      <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-flame/50 to-transparent" />
    </header>
  );
}

function GlobalSearch() {
  return (
    <Link
      to="/players"
      className="group flex-1 min-w-0 max-w-xl flex items-center gap-2.5 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-flame/50 hover:text-foreground"
    >
      <Search className="size-4 shrink-0" />
      <span className="truncate hidden sm:inline">Buscar jogadores, times, composições...</span>
      <span className="truncate sm:hidden">Buscar...</span>
      <kbd className="ml-auto hidden sm:inline-flex h-5 items-center rounded border border-hairline bg-background px-1.5 text-[10px] font-mono text-muted-foreground/80">/</kbd>
    </Link>
  );
}
