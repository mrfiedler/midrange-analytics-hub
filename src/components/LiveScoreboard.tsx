import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { getScoreboard, type GameCard } from "@/lib/games.functions";
import { Loader2, Radio } from "lucide-react";

function ymd(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

const TABS = [
  { label: "Ontem", offset: -1 },
  { label: "Hoje", offset: 0 },
  { label: "Amanhã", offset: 1 },
];

export function LiveScoreboard() {
  const fetchSb = useServerFn(getScoreboard);
  const [offset, setOffset] = useState(0);
  const date = ymd(offset);

  const q = useQuery({
    queryKey: ["scoreboard", date],
    queryFn: () => fetchSb({ data: { date } }),
    refetchInterval: (query) =>
      query.state.data?.games.some((g) => g.state === "in") ? 20_000 : 120_000,
    staleTime: 15_000,
  });

  const games = q.data?.games ?? [];

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow flex items-center gap-1.5">
            <Radio className="size-3 text-flame" /> Placar · ao vivo
          </div>
          <h2 className="font-display text-2xl md:text-3xl">Jogos</h2>
        </div>
        <div className="flex gap-1 rounded-md border border-hairline bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.offset}
              onClick={() => setOffset(t.offset)}
              className={`px-3 py-1 rounded text-xs font-display uppercase tracking-widest ${
                offset === t.offset ? "flame-bg text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {q.isLoading ? (
        <div className="mrf-card p-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin text-flame" /> Carregando placar…
        </div>
      ) : !q.data?.ok ? (
        <div className="mrf-card p-6 text-center text-muted-foreground text-sm">
          Placar indisponível no momento.
        </div>
      ) : games.length === 0 ? (
        <div className="mrf-card p-6 text-center text-muted-foreground text-sm">
          Nenhum jogo nesta data.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <GameItem key={g.id} g={g} />
          ))}
        </ul>
      )}
    </section>
  );
}

function GameItem({ g }: { g: GameCard }) {
  const live = g.state === "in";
  const pre = g.state === "pre";
  const time = pre
    ? new Date(g.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : g.statusText;
  return (
    <li>
      <Link
        to="/games/$id"
        params={{ id: g.id }}
        className="mrf-card block p-4 hover:border-flame/60 transition-colors"
      >
        <div className="flex justify-between items-center mb-2">
          <span
            className={`text-[10px] font-display uppercase tracking-widest px-2 py-0.5 rounded ${
              live ? "bg-flame/20 text-flame animate-pulse" : pre ? "bg-accent/15 text-accent" : "bg-surface-2 text-muted-foreground"
            }`}
          >
            {time}
          </span>
          {!pre && <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Ver jogo →</span>}
        </div>
        {[g.away, g.home].map((t) => (
          <div key={t.id} className={`flex items-center gap-3 py-1 ${g.state === "post" && !t.winner ? "opacity-50" : ""}`}>
            {t.logo && <img src={t.logo} alt={t.abbr} className="size-6 object-contain" />}
            <span className="font-display tracking-widest text-sm flex-1">{t.abbr}</span>
            {t.record && <span className="text-[10px] text-muted-foreground">{t.record}</span>}
            {!pre && <span className="font-display text-xl tabular-nums w-10 text-right">{t.score}</span>}
          </div>
        ))}
      </Link>
    </li>
  );
}
