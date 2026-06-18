import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { TEAMS } from "@/data/teams";
import { StatCard } from "@/components/StatCard";
import { MetricTooltip } from "@/components/MetricTooltip";
import { EvolutionChart } from "@/components/charts/EvolutionChart";
import { ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from "recharts";

export const Route = createFileRoute("/teams/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Time #${params.id} — Midrange Frenzy` },
      { name: "description", content: "Dashboard do time com métricas coletivas, ranking ofensivo e defensivo e elenco." },
    ],
  }),
  component: TeamDetail,
});

const ROSTER = [
  { name: "Player One", pos: "PG", min: 34.2, ppg: 23.4 },
  { name: "Player Two", pos: "SG", min: 32.1, ppg: 18.7 },
  { name: "Player Three", pos: "SF", min: 31.5, ppg: 16.2 },
  { name: "Player Four", pos: "PF", min: 29.8, ppg: 14.1 },
  { name: "Player Five", pos: "C",  min: 28.7, ppg: 12.6 },
  { name: "6th Man",     pos: "G",  min: 24.0, ppg: 11.4 },
  { name: "Bench A",     pos: "F",  min: 18.5, ppg: 8.3 },
  { name: "Bench B",     pos: "C",  min: 14.2, ppg: 5.1 },
];

function TeamDetail() {
  const { id } = useParams({ from: "/teams/$id" });
  const team = TEAMS.find((t) => t.id === Number(id));
  if (!team) {
    return <div className="mrf-card p-6">Time não encontrado. <Link to="/teams" className="text-flame">Voltar</Link></div>;
  }

  const netRtg = +(team.ortg - team.drtg).toFixed(1);

  const seasonTrend = Array.from({ length: 12 }, (_, i) => ({
    mes: ["Out","Nov","Dez","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set"][i],
    Ortg: +(team.ortg + (Math.sin(i / 1.7) * 3)).toFixed(1),
    Drtg: +(team.drtg + (Math.cos(i / 1.9) * 3)).toFixed(1),
  }));

  const offDefBars = [
    { name: "Ortg", value: team.ortg, color: "oklch(0.62 0.23 28)" },
    { name: "Drtg", value: team.drtg, color: "oklch(0.45 0.18 305)" },
    { name: "Pace", value: team.pace, color: "oklch(0.78 0.16 70)" },
  ];

  return (
    <div className="space-y-8 fade-up">
      <Link to="/teams" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Todos os times
      </Link>

      <section className="mrf-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 size-80 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end gap-6">
          <div className="size-28 rounded-2xl court-bg grid place-items-center font-display text-4xl text-white shrink-0 shadow-lg">
            {team.abbr}
          </div>
          <div className="flex-1 min-w-0">
            <div className="eyebrow text-amber">{team.conference === "East" ? "Conferência Leste" : "Conferência Oeste"} · {team.division}</div>
            <h1 className="font-display text-4xl md:text-6xl leading-none mt-1">{team.city} {team.name}</h1>
            <div className="mt-3 text-sm text-muted-foreground">Temporada regular: <span className="text-foreground font-medium">{team.record}</span></div>
          </div>
          <div className="text-right">
            <div className={`number-xl ${netRtg >= 0 ? "text-amber" : "text-muted-foreground"}`}>{netRtg >= 0 ? "+" : ""}{netRtg}</div>
            <div className="eyebrow"><MetricTooltip abbr="NetRtg" /></div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard abbr="Ortg" value={team.ortg.toFixed(1)} />
        <StatCard abbr="Drtg" value={team.drtg.toFixed(1)} accent="court" />
        <StatCard abbr="Pace" value={team.pace.toFixed(1)} accent="amber" />
        <StatCard abbr="eFG%" value={`${(team.efg * 100).toFixed(1)}%`} />
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
              { name: "Drtg", dataKey: "Drtg", color: "oklch(0.45 0.18 305)" },
            ]}
          />
        </div>
        <div className="mrf-card p-5">
          <div className="eyebrow">Comparativo</div>
          <h3 className="font-display text-xl mb-2">Ataque · Defesa · Ritmo</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={offDefBars} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.22 0.008 280)" strokeDasharray="2 4" />
                <XAxis dataKey="name" tick={{ fill: "oklch(0.7 0 0)", fontSize: 11 }} stroke="oklch(0.27 0.008 280)" />
                <YAxis tick={{ fill: "oklch(0.7 0 0)", fontSize: 11 }} stroke="oklch(0.27 0.008 280)" />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.006 280)", border: "1px solid oklch(0.27 0.008 280)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {offDefBars.map((b, i) => <Cell key={i} fill={b.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3"><div className="eyebrow">Elenco · minutos médios</div><h2 className="font-display text-2xl">Rotação</h2></div>
        <div className="mrf-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left">
              <tr className="text-[11px] font-display uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Jogador</th>
                <th className="px-4 py-3">Pos</th>
                <th className="px-4 py-3 text-right">MIN</th>
                <th className="px-4 py-3 text-right"><MetricTooltip abbr="PPG" /></th>
                <th className="px-4 py-3 hidden sm:table-cell">Distribuição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {ROSTER.map((p) => {
                const pct = (p.min / 48) * 100;
                return (
                  <tr key={p.name} className="hover:bg-surface-2/60">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.pos}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.min.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.ppg.toFixed(1)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                        <div className="h-full flame-bg" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 text-[11px] text-muted-foreground border-t border-hairline">
            Elenco exibido como exemplo da estrutura. Integração de roster ao vivo será expandida em próximas iterações.
          </div>
        </div>
      </section>
    </div>
  );
}
