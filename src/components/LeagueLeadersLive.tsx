import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { LeaderRow } from "@/lib/dataSource";
import { getPublicLeagueLeaders } from "@/lib/nba-stats.functions";
import { getCurrentSeason } from "@/lib/season";
import { SourceBadge, UnavailableCard } from "@/components/SourceBadge";
import { Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Cat = "PTS" | "REB" | "AST" | "STL" | "BLK" | "FG3M";

const CATS: { key: Cat; label: string }[] = [
  { key: "PTS", label: "Pontos" },
  { key: "AST", label: "Assist." },
  { key: "REB", label: "Rebotes" },
  { key: "BLK", label: "Tocos" },
  { key: "STL", label: "Roubos" },
  { key: "FG3M", label: "3PTS" },
];

export function LeagueLeadersLive() {
  const [cat, setCat] = useState<Cat>("PTS");
  const season = getCurrentSeason();
  const leaders = useServerFn(getPublicLeagueLeaders);

  const q = useQuery({
    queryKey: ["leaders", season, cat],
    queryFn: async () => {
      const res = await leaders({ data: { cat } });
      if (!res.ok || res.rows.length === 0) {
        const empty: LeaderRow[] | null = null;
        return { source: null as null | "espn-public", available: false, data: empty };
      }
      return { source: "espn-public" as const, available: true, data: res.rows };
    },
    staleTime: 5 * 60_000,
  });

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="eyebrow">Temporada {season}–{String(season + 1).slice(2)}</div>
          <h2 className="font-display text-2xl md:text-3xl">Líderes da liga</h2>
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`text-[11px] font-display uppercase tracking-widest px-2.5 py-1 rounded border transition-colors ${
                cat === c.key
                  ? "border-flame/70 bg-flame/15 text-flame"
                  : "border-hairline text-muted-foreground hover:border-flame/40"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {q.isLoading ? (
        <div className="mrf-card p-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin text-flame" /> Buscando líderes…
        </div>
      ) : !q.data?.available || !q.data.data ? (
        <UnavailableCard notice="Líderes da liga indisponíveis no momento. Tente em alguns minutos." />
      ) : (
        <>
          <div className="mrf-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left">
                <tr className="text-[11px] font-display uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Jogador</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Time</th>
                  <th className="px-4 py-3 text-right">{cat}</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">JG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {q.data.data.map((p: LeaderRow) => (
                  <tr key={p.playerId} className="hover:bg-surface-2/60 transition-colors">
                    <td className="px-4 py-3 font-display text-flame">{String(p.rank).padStart(2, "0")}</td>
                    <td className="px-4 py-3 font-medium">
                      <Link to="/players/$id" params={{ id: String(p.playerId) }} className="hover:text-flame">
                        {p.playerName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.teamAbbr}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-display text-amber">{p.value.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden md:table-cell">{p.gp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-right">
            <SourceBadge source={q.data.source} />
          </div>
        </>
      )}
    </section>
  );
}
