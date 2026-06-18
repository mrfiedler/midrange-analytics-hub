import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Flame, Zap, ArrowRight, Activity, Shield as ShieldIcon } from "lucide-react";
import { TOP_PLAYERS, TODAY_LEADERS, RECENT_GAMES } from "@/data/featured";
import { MetricTooltip } from "@/components/MetricTooltip";
import { ChampionBanner } from "@/components/ChampionBanner";
import { findMetric } from "@/data/glossary";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Midrange Frenzy — Dashboard" },
      { name: "description", content: "Líderes do dia, jogos recentes e métrica do dia. A central de análise de basquete em português." },
    ],
  }),
  component: Dashboard,
});

const LEADER_ENTRIES = [
  { key: "points",   accent: "flame", Icon: Flame,    label: "Pontos" },
  { key: "assists",  accent: "court", Icon: Zap,      label: "Assistências" },
  { key: "rebounds", accent: "amber", Icon: Activity, label: "Rebotes" },
  { key: "blocks",   accent: "flame", Icon: ShieldIcon, label: "Tocos" },
] as const;

function Dashboard() {
  const metricOfDay = findMetric("TS%")!;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-hairline hero-bg p-6 md:p-10 fade-up">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
             style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "18px 18px" }} />
        <div className="relative max-w-3xl">
          <div className="eyebrow text-flame">Em destaque · hoje</div>
          <h1 className="mt-2 font-display text-4xl md:text-6xl leading-[0.95] tracking-tight">
            Cada arremesso conta. <span className="text-flame">Cada métrica importa.</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Acompanhe líderes, compare jogadores e entenda o que cada sigla significa — do passe certeiro à eficiência verdadeira.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/compare" className="inline-flex items-center gap-2 rounded-md flame-bg px-4 py-2.5 text-sm font-display uppercase tracking-widest text-white hover:opacity-95">
              Abrir comparador <ArrowRight className="size-4" />
            </Link>
            <Link to="/players" className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface/70 backdrop-blur px-4 py-2.5 text-sm font-display uppercase tracking-widest text-foreground hover:border-flame/60">
              Top jogadores da semana
            </Link>
            <Link to="/lineups" className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface/70 backdrop-blur px-4 py-2.5 text-sm font-display uppercase tracking-widest text-foreground hover:border-accent/70">
              Composições históricas
            </Link>
          </div>
        </div>
      </section>

      {/* Champion banner */}
      <ChampionBanner />



      {/* Daily Leaders */}
      <section>
        <SectionHeader title="Líderes da rodada" eyebrow="Em alta" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LEADER_ENTRIES.map(({ key, accent, Icon, label }, i) => {
            const leader = (TODAY_LEADERS as any)[key];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`mrf-card ${accent === "court" ? "mrf-card-hover-court" : "mrf-card-hover"} relative p-5 overflow-hidden`}
              >
                <div className={`absolute -right-6 -top-6 size-24 rounded-full ${accent === "flame" ? "bg-flame/15" : accent === "court" ? "bg-accent/20" : "bg-amber/15"}`} />
                <div className="eyebrow flex items-center gap-1.5">
                  <Icon className={`size-3.5 ${accent === "flame" ? "text-flame" : accent === "court" ? "text-accent" : "text-amber"}`} />
                  {label}
                </div>
                <div className="number-xl mt-2">{leader.value}</div>
                <div className="mt-1 text-sm text-foreground">{leader.name}</div>
                <div className="text-xs text-muted-foreground">{leader.team} · {leader.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent games */}
        <section className="lg:col-span-2">
          <SectionHeader title="Jogos recentes" eyebrow="Última rodada" />
          <ul className="mrf-card divide-y divide-hairline">
            {RECENT_GAMES.map((g, i) => {
              const homeWin = g.homeScore > g.awayScore;
              return (
                <li key={i} className="flex items-center gap-4 p-4 hover:bg-surface-2/60 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <TeamPill abbr={g.away} dim={!(!homeWin)} />
                    <span className="font-display text-lg tabular-nums">{g.awayScore}</span>
                    <span className="text-muted-foreground/60 text-xs">@</span>
                    <span className="font-display text-lg tabular-nums">{g.homeScore}</span>
                    <TeamPill abbr={g.home} dim={!homeWin} />
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block">{g.note}</div>
                  <span className={`text-[10px] font-display uppercase tracking-widest px-2 py-0.5 rounded ${g.status === "OT" ? "bg-amber/20 text-amber" : "bg-surface-2 text-muted-foreground"}`}>{g.status}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Metric of the day */}
        <section>
          <SectionHeader title="Métrica do dia" eyebrow="Aprenda em 30s" />
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mrf-card relative p-5 overflow-hidden"
          >
            <div className="absolute inset-0 court-bg opacity-30 pointer-events-none" />
            <div className="relative">
              <div className="eyebrow text-amber">{metricOfDay.abbr}</div>
              <div className="mt-1 font-display text-2xl">{metricOfDay.name}</div>
              <p className="mt-3 text-sm text-foreground/90 leading-relaxed">{metricOfDay.newbie}</p>
              {metricOfDay.formula && (
                <div className="mt-4 rounded-md bg-background/60 border border-hairline p-3 font-mono text-xs text-muted-foreground">
                  {metricOfDay.formula}
                </div>
              )}
              <div className="mt-4 grid grid-cols-4 gap-1.5 text-[10px] font-display uppercase tracking-widest">
                {(["ruim","medio","bom","elite"] as const).map((k, i) => (
                  <div key={k} className="rounded p-2 text-center"
                       style={{ background: ["oklch(0.3 0.05 25)", "oklch(0.3 0.04 60)", "oklch(0.32 0.08 145)", "oklch(0.35 0.18 305)"][i] }}>
                    <div>{k}</div>
                    <div className="opacity-80 normal-case tracking-normal mt-0.5">{(metricOfDay.scale as any)[k]}</div>
                  </div>
                ))}
              </div>
              <Link to="/glossary" className="mt-5 inline-flex items-center gap-1.5 text-sm text-flame hover:underline">
                Ver glossário completo <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Top players */}
      <section>
        <SectionHeader title="Top jogadores · temporada" eyebrow="Líderes em PER" />
        <div className="mrf-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left">
              <tr className="text-[11px] font-display uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Jogador</th>
                <th className="px-4 py-3 hidden sm:table-cell">Time · Pos</th>
                <th className="px-4 py-3 text-right"><MetricTooltip abbr="PPG" /></th>
                <th className="px-4 py-3 text-right"><MetricTooltip abbr="RPG" /></th>
                <th className="px-4 py-3 text-right"><MetricTooltip abbr="APG" /></th>
                <th className="px-4 py-3 text-right hidden md:table-cell"><MetricTooltip abbr="TS%" /></th>
                <th className="px-4 py-3 text-right"><MetricTooltip abbr="PER" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {TOP_PLAYERS.map((p, i) => (
                <tr key={p.name} className="hover:bg-surface-2/60 transition-colors">
                  <td className="px-4 py-3 font-display text-flame">{String(i + 1).padStart(2, "0")}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.team} · {p.pos}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.ppg.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.rpg.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.apg.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">{(p.ts * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right font-display text-amber tabular-nums">{p.per.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
      </div>
    </div>
  );
}

function TeamPill({ abbr, dim }: { abbr: string; dim?: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center min-w-[3rem] rounded border border-hairline bg-surface-2 px-2 py-1 font-display text-xs tracking-widest ${dim ? "text-muted-foreground" : "text-foreground"}`}>
      {abbr}
    </span>
  );
}
