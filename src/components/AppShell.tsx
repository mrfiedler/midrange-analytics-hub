import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Users, Shield, Swords, BarChart3, BookOpen, Settings, Search, Menu, X, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ModeToggle } from "@/components/ModeToggle";
import { searchPlayers } from "@/lib/balldontlie.functions";
import { TEAMS } from "@/data/teams";
import { PlayerAvatar } from "@/components/players/PlayerAvatar";

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

/**
 * Busca global: jogadores (ESPN) + times (base local). Dropdown com resultados
 * ao vivo. Fecha em blur, Escape ou clique num item.
 */
function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const search = useServerFn(searchPlayers);

  const mutation = useMutation({
    mutationFn: (query: string) => search({ data: { q: query } }),
  });

  // Debounce da busca de jogadores.
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) return;
    const t = setTimeout(() => mutation.mutate(query), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Times filtrados localmente (base estática pequena).
  const teamMatches = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 1) return [];
    return TEAMS.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.city.toLowerCase().includes(query) ||
        t.abbr.toLowerCase().includes(query),
    ).slice(0, 4);
  }, [q]);

  const playerMatches = (mutation.data?.ok ? mutation.data.players : []).slice(0, 6);

  const items = [
    ...teamMatches.map((t) => ({ kind: "team" as const, id: t.id, label: `${t.city} ${t.name}`, sub: `${t.abbr} · ${t.conference}` })),
    ...playerMatches.map((p) => ({ kind: "player" as const, id: p.id, label: p.fullName, sub: `${p.position !== "-" ? p.position : ""}${p.team ? (p.position !== "-" ? " · " : "") + p.team.abbr + " " + p.team.name : ""}`, firstName: p.firstName, lastName: p.lastName })),
  ];

  useEffect(() => setActiveIdx(0), [q]);

  // Fecha ao clicar fora.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const commit = (item: (typeof items)[number]) => {
    setOpen(false);
    setQ("");
    if (item.kind === "team") {
      navigate({ to: "/teams/$id", params: { id: String(item.id) } });
    } else {
      navigate({ to: "/players/$id", params: { id: String(item.id) } });
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { setOpen(false); (e.target as HTMLInputElement).blur(); return; }
    if (!items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i - 1 + items.length) % items.length); }
    else if (e.key === "Enter") { e.preventDefault(); commit(items[activeIdx]); }
  };

  const hasQuery = q.trim().length >= 1;

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-0 max-w-xl">
      <div className="group flex items-center gap-2.5 rounded-md border border-hairline bg-surface px-3 py-2 text-sm transition-colors focus-within:border-flame/60">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Buscar jogadores, times..."
          className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-muted-foreground"
          aria-label="Busca global"
        />
        {mutation.isPending && <Loader2 className="size-4 animate-spin text-flame" />}
        <kbd className="ml-1 hidden sm:inline-flex h-5 items-center rounded border border-hairline bg-background px-1.5 text-[10px] font-mono text-muted-foreground/80">/</kbd>
      </div>

      {open && hasQuery && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-md border border-hairline bg-surface shadow-lg overflow-hidden z-40 max-h-[70vh] overflow-y-auto">
          {items.length === 0 && !mutation.isPending && (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">
              {q.trim().length < 2 ? "Digite ao menos 2 letras" : `Nenhum resultado para "${q}"`}
            </div>
          )}
          {teamMatches.length > 0 && (
            <div className="border-b border-hairline">
              <div className="px-3 pt-2 pb-1 text-[10px] font-display uppercase tracking-widest text-muted-foreground/70">Times</div>
              {items.filter((i) => i.kind === "team").map((item, idx) => {
                const globalIdx = idx;
                const active = globalIdx === activeIdx;
                return (
                  <button
                    key={`t-${item.id}`}
                    onMouseEnter={() => setActiveIdx(globalIdx)}
                    onClick={() => commit(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm ${active ? "bg-surface-2" : "hover:bg-surface-2"}`}
                  >
                    <Shield className="size-4 text-flame shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{item.label}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{item.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {playerMatches.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] font-display uppercase tracking-widest text-muted-foreground/70">Jogadores</div>
              {items.filter((i) => i.kind === "player").map((item, idx) => {
                const globalIdx = teamMatches.length + idx;
                const active = globalIdx === activeIdx;
                return (
                  <button
                    key={`p-${item.id}`}
                    onMouseEnter={() => setActiveIdx(globalIdx)}
                    onClick={() => commit(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm ${active ? "bg-surface-2" : "hover:bg-surface-2"}`}
                  >
                    <PlayerAvatar id={item.id} firstName={(item as any).firstName} lastName={(item as any).lastName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{item.label}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{item.sub || "-"}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
