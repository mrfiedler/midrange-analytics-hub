import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MetricTooltip } from "@/components/MetricTooltip";
import { ChampionBanner } from "@/components/ChampionBanner";
import { LiveScoreboard } from "@/components/LiveScoreboard";
import { LeagueLeadersLive } from "@/components/LeagueLeadersLive";
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
              Buscar jogadores
            </Link>
            <Link to="/seasons" className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface/70 backdrop-blur px-4 py-2.5 text-sm font-display uppercase tracking-widest text-foreground hover:border-accent/70">
              Temporadas
            </Link>
          </div>
        </div>
      </section>

      {/* Champion banner */}
      <ChampionBanner />

      {/* Live scoreboard via cdn.nba.com */}
      <LiveScoreboard />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* League Leaders */}
        <div className="lg:col-span-2">
          <LeagueLeadersLive />
        </div>

        {/* Metric of the day */}
        <section>
          <div className="mb-3">
            <div className="eyebrow">Aprenda em 30s</div>
            <h2 className="font-display text-2xl md:text-3xl">Métrica do dia</h2>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mrf-card relative p-5 overflow-hidden"
          >
            <div className="absolute inset-0 court-bg opacity-30 pointer-events-none" />
            <div className="relative">
              <div className="eyebrow text-amber"><MetricTooltip abbr={metricOfDay.abbr} /></div>
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
    </div>
  );
}

