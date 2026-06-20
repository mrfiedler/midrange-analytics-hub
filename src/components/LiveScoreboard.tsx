import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveScoreboard, type CdnGame } from "@/lib/cdn-nba";
import { teamLogoUrl } from "@/lib/nba-logos";
import { Loader2, Radio } from "lucide-react";

export function LiveScoreboard() {
  const fetchScoreboard = useServerFn(getLiveScoreboard);

  const q = useQuery({
    queryKey: ["cdn-scoreboard"],
    queryFn: () => fetchScoreboard({}),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const games = q.data?.games ?? [];
  const date = q.data?.gameDate;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="eyebrow flex items-center gap-1.5">
            <Radio className="size-3 text-flame" /> Hoje · ao vivo
          </div>
          <h2 className="font-display text-2xl md:text-3xl">Jogos de hoje</h2>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          fonte: cdn.nba.com{date && ` · ${date}`}
        </span>
      </div>

      {q.isLoading ? (
        <div className="mrf-card p-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin text-flame" /> Carregando placar…
        </div>
      ) : !q.data?.ok ? (
        <div className="mrf-card p-6 text-center text-muted-foreground text-sm">
          Placar ao vivo indisponível no momento.
        </div>
      ) : games.length === 0 ? (
        <div className="mrf-card p-6 text-center text-muted-foreground text-sm">
          Nenhum jogo programado para hoje.
        </div>
      ) : (
        <ul className="mrf-card divide-y divide-hairline">
          {games.map((g: CdnGame) => {
            const homeWin = g.gameStatus === 3 && g.homeTeam.score > g.awayTeam.score;
            const awayWin = g.gameStatus === 3 && g.awayTeam.score > g.homeTeam.score;
            const live = g.gameStatus === 2;
            return (
              <li key={g.gameId} className="flex items-center gap-4 p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <TeamCell tri={g.awayTeam.teamTricode} dim={!awayWin && g.gameStatus === 3} />
                  <span className="font-display text-xl tabular-nums w-10 text-right">{g.awayTeam.score}</span>
                  <span className="text-muted-foreground/60 text-xs">@</span>
                  <span className="font-display text-xl tabular-nums w-10">{g.homeTeam.score}</span>
                  <TeamCell tri={g.homeTeam.teamTricode} dim={!homeWin && g.gameStatus === 3} />
                </div>
                <span
                  className={`text-[10px] font-display uppercase tracking-widest px-2 py-0.5 rounded ${
                    live
                      ? "bg-flame/20 text-flame animate-pulse"
                      : g.gameStatus === 3
                      ? "bg-surface-2 text-muted-foreground"
                      : "bg-accent/15 text-accent"
                  }`}
                >
                  {g.gameStatusText.trim()}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TeamCell({ tri, dim }: { tri: string; dim?: boolean }) {
  const logo = teamLogoUrl(tri);
  return (
    <div className={`flex items-center gap-2 ${dim ? "opacity-50" : ""}`}>
      {logo ? (
        <img src={logo} alt={tri} className="size-6 object-contain" />
      ) : null}
      <span className="font-display text-xs tracking-widest">{tri}</span>
    </div>
  );
}
