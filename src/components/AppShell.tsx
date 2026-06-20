import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, Shield, Layers, Swords, BarChart3, BookOpen, Settings, Search } from "lucide-react";
import logo from "@/assets/mrf-logo.png.asset.json";
import { ModeToggle } from "@/components/ModeToggle";
import type { ReactNode } from "react";

const NAV = [
  { to: "/",          label: "Dashboard",            Icon: Home },
  { to: "/players",   label: "Jogadores",            Icon: Users },
  { to: "/teams",     label: "Times",                Icon: Shield },
  { to: "/lineups",   label: "Composições históricas", Icon: Layers },
  { to: "/compare",   label: "Comparador",           Icon: Swords },
  { to: "/seasons",   label: "Temporadas & Histórico", Icon: BarChart3 },
  { to: "/glossary",  label: "Glossário",            Icon: BookOpen },
  { to: "/settings",  label: "Configurações",        Icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-hairline bg-sidebar sticky top-0 h-screen">
        <Link to="/" className="px-5 pt-6 pb-4 border-b border-hairline group">
          <img src={logo.url} alt="Midrange Frenzy" className="h-20 w-auto transition-transform group-hover:scale-[1.02]" />
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
            v1.0 · powered by balldontlie
          </span>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Header />
        <main className="flex-1 min-w-0 p-5 md:p-8">{children}</main>
        <footer className="px-5 md:px-8 py-5 border-t border-hairline text-[11px] text-muted-foreground/70 flex flex-wrap items-center gap-3 justify-between">
          <span>Dados: balldontlie.io · Estatísticas atualizadas diariamente</span>
          <span className="font-display uppercase tracking-widest">midrange · frenzy</span>
        </footer>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-background/85 backdrop-blur-md">
      <div className="flex items-center gap-3 px-5 md:px-8 h-16">
        {/* Mobile logo */}
        <Link to="/" className="md:hidden flex items-center">
          <img src={logo.url} alt="MRF" className="h-8 w-auto" />
        </Link>

        <GlobalSearch />

        <div className="ml-auto flex items-center gap-3">
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
      className="group flex-1 max-w-xl flex items-center gap-2.5 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-flame/50 hover:text-foreground"
    >
      <Search className="size-4 shrink-0" />
      <span className="truncate">Buscar jogadores, times, composições…</span>
      <kbd className="ml-auto hidden sm:inline-flex h-5 items-center rounded border border-hairline bg-background px-1.5 text-[10px] font-mono text-muted-foreground/80">/</kbd>
    </Link>
  );
}
