import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Loader2, Swords } from "lucide-react";
import { getPlayerProfile } from "@/lib/balldontlie.functions";
import { StatCard } from "@/components/StatCard";
import { MetricTooltip } from "@/components/MetricTooltip";
import { useMode } from "@/lib/mode-context";
import { PlayerAvatar } from "@/components/players/PlayerAvatar";



export const Route = createFileRoute("/players/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Perfil do jogador #${params.id} — Midrange Frenzy` },
      { name: "description", content: "Perfil completo de jogador NBA com estatísticas básicas e avançadas, radar, evolução por temporada." },
    ],
  }),
  component: PlayerProfile,
});

import { getCurrentSeason } from "@/lib/season";

const CURRENT = getCurrentSeason();
const SEASONS = [CURRENT, CURRENT - 1, CURRENT - 2, CURRENT - 3, CURRENT - 4] as const;

function PlayerProfile() {
  const { id } = useParams({ from: "/players/$id" });
  const [season, setSeason] = useState<number>(CURRENT);
  const { mode } = useMode();
  const fetchProfile = useServerFn(getPlayerProfile);

  const q = useQuery({
    queryKey: ["player", id, season],
    queryFn: () => fetchProfile({ data: { id: Number(id), season } }),
  });

  if (q.isLoading) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-flame" />
      </div>
    );
  }
  if (!q.data?.ok || !q.data?.player) {
    return (
      <div className="mrf-card p-6 text-center">
        <div className="text-flame font-display uppercase tracking-widest text-sm">Erro</div>
        <p className="mt-1 text-muted-foreground">{q.data?.error ?? "Não foi possível carregar o jogador."}</p>
        <Link to="/players" className="inline-flex items-center gap-1 mt-4 text-flame hover:underline">
          <ArrowLeft className="size-4" /> Voltar para busca
        </Link>
      </div>
    );
  }

  const { player, averages } = q.data;
  const hasStats = !!averages;

  



  return (
    <div className="space-y-8 fade-up">
      <Link to="/players" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar pra busca
      </Link>

      {/* Header */}
      <section className="mrf-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 size-72 rounded-full bg-flame/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 bottom-0 size-56 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end gap-6">
          <PlayerAvatar id={player.id} firstName={player.firstName} lastName={player.lastName} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="eyebrow text-flame">{player.team?.abbr ?? "Free agent"} · {player.position}</div>
            <h1 className="font-display text-4xl md:text-6xl leading-none mt-1">{player.fullName}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {player.jersey && <span className="text-amber font-display text-lg">#{player.jersey}</span>}
              {player.team && <span>{player.team.name}</span>}
              {player.height && <span>Altura {player.height}</span>}
              {player.weight && <span>Peso {player.weight} lb</span>}
              {player.country && <span>{player.country}</span>}
              {player.draftYear && <span>Draft {player.draftYear} · pick {player.draftNumber ?? "—"}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="eyebrow">Temporada</label>
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm"
            >
              {SEASONS.map((s) => <option key={s} value={s}>{s}–{(s + 1).toString().slice(2)}</option>)}
            </select>
            <Link to="/compare" className="inline-flex items-center justify-center gap-2 mt-1 rounded-md flame-bg px-4 py-2 text-xs font-display uppercase tracking-widest text-white">
              <Swords className="size-3.5" /> Comparar
            </Link>
          </div>
        </div>
      </section>

      {!hasStats && (
        <div className="mrf-card p-5 text-amber text-sm">
          Estatísticas não disponíveis para a temporada {season}-{(season + 1).toString().slice(2)}.
        </div>
      )}

      {hasStats && (
        <>
          {/* Stat cards */}
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <div className="eyebrow">Painel de estatísticas</div>
                <h2 className="font-display text-2xl">{mode === "newbie" ? "Modo iniciante" : "Modo avançado"}</h2>
              </div>
              <span className="text-xs text-muted-foreground">{averages.games_played} jogos · {averages.min} min/jogo</span>
            </div>

            {mode === "newbie" ? (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <StatCard abbr="PPG" value={averages.pts.toFixed(1)} />
                <StatCard abbr="RPG" value={averages.reb.toFixed(1)} accent="court" />
                <StatCard abbr="APG" value={averages.ast.toFixed(1)} accent="amber" />
                <StatCard abbr="SPG" value={averages.stl.toFixed(1)} />
                <StatCard abbr="BPG" value={averages.blk.toFixed(1)} accent="court" />
                <StatCard abbr="FG%" value={`${(averages.fg_pct * 100).toFixed(1)}%`} accent="amber" />
                <StatCard abbr="3P%" value={`${(averages.fg3_pct * 100).toFixed(1)}%`} />
                <StatCard abbr="FT%" value={`${(averages.ft_pct * 100).toFixed(1)}%`} accent="court" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <StatCard abbr="eFG%" value={`${(((averages.fgm + 0.5 * averages.fg3m) / Math.max(averages.fga, 0.1)) * 100).toFixed(1)}%`} />
                <StatCard abbr="TS%" value={`${((averages.pts / Math.max(2 * (averages.fga + 0.44 * averages.fta), 0.1)) * 100).toFixed(1)}%`} accent="court" />
                <StatCard abbr="USG%" value={"—"} hint="Usage não disponível na API" accent="amber" />
                <StatCard abbr="PPG" value={averages.pts.toFixed(1)} />
                <StatCard abbr="RPG" value={averages.reb.toFixed(1)} accent="amber" />
                <StatCard abbr="APG" value={averages.ast.toFixed(1)} accent="court" />
                <StatCard abbr="TOV%" value={averages.turnover.toFixed(1)} hint="Turnovers por jogo" />
                <StatCard abbr="PER" value={"—"} hint="Indisponível na API pública" accent="amber" />
              </div>
            )}
          </section>




          {/* Raw stat table */}
          <section>
            <div className="mb-3"><div className="eyebrow">Tabela completa</div><h2 className="font-display text-2xl">Box-score médio</h2></div>
            <div className="mrf-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-2">
                  <tr className="text-left text-[11px] font-display uppercase tracking-widest text-muted-foreground">
                    {["GP","MIN","PTS","REB","AST","STL","BLK","TOV","FG%","3P%","FT%"].map((h) => (
                      <th key={h} className="px-3 py-2"><MetricTooltip abbr={h.replace("PTS","PPG").replace("REB","RPG").replace("AST","APG").replace("STL","SPG").replace("BLK","BPG")}>{h}</MetricTooltip></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="tabular-nums">
                    <td className="px-3 py-2">{averages.games_played}</td>
                    <td className="px-3 py-2">{averages.min}</td>
                    <td className="px-3 py-2">{averages.pts.toFixed(1)}</td>
                    <td className="px-3 py-2">{averages.reb.toFixed(1)}</td>
                    <td className="px-3 py-2">{averages.ast.toFixed(1)}</td>
                    <td className="px-3 py-2">{averages.stl.toFixed(1)}</td>
                    <td className="px-3 py-2">{averages.blk.toFixed(1)}</td>
                    <td className="px-3 py-2">{averages.turnover.toFixed(1)}</td>
                    <td className="px-3 py-2">{(averages.fg_pct * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2">{(averages.fg3_pct * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2">{(averages.ft_pct * 100).toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
