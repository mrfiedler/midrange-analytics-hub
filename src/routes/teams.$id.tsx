import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TEAMS } from "@/data/teams";
import { teamLogoUrl } from "@/lib/nba-logos";
import { StatCard } from "@/components/StatCard";
import { MetricTooltip } from "@/components/MetricTooltip";
import { EvolutionChart } from "@/components/charts/EvolutionChart";
import { getTeamRoster } from "@/lib/balldontlie.functions";
import { getLeagueTeamStats } from "@/lib/team-stats.functions";
import { getCurrentSeason } from "@/lib/season";
import { ArrowLeft, Loader2, Radio } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { PlayerAvatar } from "@/components/players/PlayerAvatar";

export const Route = createFileRoute("/teams/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Time #${params.id} — Midrange Frenzy` },
      { name: "description", content: "Dashboard do time com métricas coletivas, ranking ofensivo e defensivo e elenco." },
    ],
  }),
  component: TeamDetail,
});

function TeamDetail() {
  const { id } = useParams({ from: "/teams/$id" });
  const team = TEAMS.find((t) => t.id === Number(id));
  const season = getCurrentSeason();
  const fetchRoster = useServerFn(getTeamRoster);
  const fetchTeamStats = useServerFn(getLeagueTeamStats);

  const rosterQ = useQuery({
    queryKey: ["roster", id, season],
    queryFn: () => fetchRoster({ data: { teamId: Number(id), season } }),
    enabled: !!team,
  });

  const statsQ = useQuery({
    queryKey: ["leagueTeamStats", season],
    queryFn: () => fetchTeamStats({ data: { season } }),
    staleTime: 30 * 60_000,
    enabled: !!team,
  });

  if (!team) {
    return <div className="mrf-card p-6">Time não encontrado. <Link to="/teams" className="text-flame">Voltar</Link></div>;
  }

  // Try to find live row by team name (e.g. "Hawks")
  const liveRow = statsQ.data?.ok
    ? statsQ.data.rows.find((r) => r.teamName?.toLowerCase().endsWith(team.name.toLowerCase()))
    : undefined;
  const isLive = !!liveRow;

  const ortg = liveRow?.ortg ?? team.ortg;
  const drtg = liveRow?.drtg ?? team.drtg;
  const pace = liveRow?.pace ?? team.pace;
  const efg = liveRow?.efg ?? team.efg;
  const netRtg = +((liveRow?.netRtg ?? ortg - drtg).toFixed(1));
  const record = liveRow ? `${liveRow.wins}–${liveRow.losses}` : team.record;
  const logo = teamLogoUrl(team.abbr);

  const seasonTrend = Array.from({ length: 12 }, (_, i) => ({
    mes: ["Out","Nov","Dez","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set"][i],
    Ortg: +(ortg + (Math.sin(i / 1.7) * 3)).toFixed(1),
    Drtg: +(drtg + (Math.cos(i / 1.9) * 3)).toFixed(1),
  }));

  const offDefBars = [
    { name: "Ortg", value: ortg, color: "oklch(0.62 0.23 28)" },
    { name: "Drtg", value: drtg, color: "oklch(0.78 0.13 235)" },
    { name: "Pace", value: pace, color: "oklch(0.78 0.16 70)" },
  ];

  const roster = rosterQ.data?.players ?? [];


  return (
    <div className="space-y-8 fade-up">
      <Link to="/teams" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Todos os times
      </Link>

      <section className="mrf-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 size-80 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end gap-6">
          <div className="size-28 grid place-items-center shrink-0">
            {logo ? (
              <img src={logo} alt={team.name} className="size-full object-contain" />
            ) : (
              <div className="size-28 rounded-2xl court-bg grid place-items-center font-display text-4xl text-white shadow-lg">{team.abbr}</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="eyebrow text-amber flex items-center gap-2">
              {team.conference === "East" ? "Conferência Leste" : "Conferência Oeste"} · {team.division}
              {isLive ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-flame/40 bg-flame/10 px-2 py-0.5 text-[10px] text-flame">
                  <Radio className="size-3 animate-pulse" /> ao vivo
                </span>
              ) : statsQ.isLoading ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" /> buscando dados ao vivo…
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">· dados de referência</span>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-6xl leading-none mt-1">{team.city} {team.name}</h1>
            <div className="mt-3 text-sm text-muted-foreground">Temporada regular: <span className="text-foreground font-medium">{record}</span></div>
          </div>
          <div className="text-right">
            <div className={`number-xl ${netRtg >= 0 ? "text-amber" : "text-muted-foreground"}`}>{netRtg >= 0 ? "+" : ""}{netRtg}</div>
            <div className="eyebrow"><MetricTooltip abbr="NetRtg" /></div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard abbr="Ortg" value={ortg.toFixed(1)} />
        <StatCard abbr="Drtg" value={drtg.toFixed(1)} accent="court" />
        <StatCard abbr="Pace" value={pace.toFixed(1)} accent="amber" />
        <StatCard abbr="eFG%" value={`${(efg * 100).toFixed(1)}%`} />
      </section>


      <section className="grid gap-6 lg:grid-cols-2">
        <div className="mrf-card p-5">
          <div className="eyebrow">Temporada</div>
          <h3 className="font-display text-xl mb-2">Ortg vs Drtg ao longo do ano</h3>
          <EvolutionChart
            data={seasonTrend}
            xKey="mes"
            series={[
              { name: "Ortg", dataKey: "Ortg", color: "oklch(0.62 0.23 28)" },
              { name: "Drtg", dataKey: "Drtg", color: "oklch(0.78 0.13 235)" },
            ]}
          />
        </div>
        <div className="mrf-card p-5">
          <div className="eyebrow">Comparativo</div>
          <h3 className="font-display text-xl mb-2">Ataque · Defesa · Ritmo</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={offDefBars} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.36 0.06 252)" strokeDasharray="2 4" />
                <XAxis dataKey="name" tick={{ fill: "oklch(0.74 0.05 245)", fontSize: 11 }} stroke="oklch(0.36 0.06 252)" />
                <YAxis tick={{ fill: "oklch(0.74 0.05 245)", fontSize: 11 }} stroke="oklch(0.36 0.06 252)" />
                <Tooltip contentStyle={{ background: "oklch(0.24 0.05 252)", border: "1px solid oklch(0.36 0.06 252)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {offDefBars.map((b, i) => <Cell key={i} fill={b.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="eyebrow">Elenco atual</div>
            <h2 className="font-display text-2xl">Roster {season}–{(season + 1).toString().slice(2)}</h2>
          </div>
          {rosterQ.isLoading && <Loader2 className="size-4 animate-spin text-flame" />}
        </div>
        <div className="mrf-card overflow-hidden">
          {rosterQ.isLoading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Carregando elenco…</div>
          ) : roster.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Nenhum jogador encontrado para esta temporada.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left">
                <tr className="text-[11px] font-display uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Jogador</th>
                  <th className="px-4 py-3">Pos</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Altura</th>
                  <th className="px-4 py-3 text-right">Perfil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {roster.map((p: { id: number; firstName: string; lastName: string; fullName: string; position: string; height?: string | null; jersey?: string | null }) => (
                  <tr key={p.id} className="hover:bg-surface-2/60">
                    <td className="px-4 py-3 text-amber font-display">{p.jersey ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar firstName={p.firstName} lastName={p.lastName} size="sm" />
                        <span>{p.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.position}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.height ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/players/$id" params={{ id: String(p.id) }} className="text-flame text-xs hover:underline">Ver →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
