import { createFileRoute } from "@tanstack/react-router";
import { HISTORIC_LINEUPS } from "@/data/historic-lineups";
import { MetricTooltip } from "@/components/MetricTooltip";
import { useState } from "react";
import { Trophy, Check } from "lucide-react";

export const Route = createFileRoute("/lineups")({
  head: () => ({
    meta: [
      { title: "Composições históricas — Midrange Frenzy" },
      { name: "description", content: "Os quintetos mais dominantes da história da NBA, com Net Rating e estatísticas." },
    ],
  }),
  component: LineupsPage,
});

function LineupsPage() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length >= 2 ? [s[1], id] : [...s, id]
    );
  };

  const chosen = HISTORIC_LINEUPS.filter((l) => selected.includes(l.id));

  return (
    <div className="space-y-8 fade-up">
      <div>
        <div className="eyebrow">Curadoria</div>
        <h1 className="font-display text-4xl md:text-5xl">Composições históricas</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Os lineups que reescreveram o livro de regras. Selecione até dois para comparar lado a lado.
        </p>
      </div>

      {chosen.length === 2 && (
        <section className="mrf-card p-5">
          <div className="eyebrow text-amber mb-3">Comparativo</div>
          <div className="grid gap-6 md:grid-cols-2">
            {chosen.map((l) => (
              <div key={l.id}>
                <div className="font-display text-xl">{l.team}</div>
                <div className="text-xs text-muted-foreground">{l.season} · {l.nickname}</div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-surface-2 p-3"><dt className="eyebrow">NetRtg</dt><dd className="font-display text-2xl text-amber">{l.netRating > 0 ? "+" : ""}{l.netRating}</dd></div>
                  <div className="rounded-md bg-surface-2 p-3"><dt className="eyebrow">PPG</dt><dd className="font-display text-2xl">{l.stats.ppg}</dd></div>
                  <div className="rounded-md bg-surface-2 p-3"><dt className="eyebrow">APG</dt><dd className="font-display text-2xl">{l.stats.apg}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {HISTORIC_LINEUPS.map((l) => {
          const isSelected = selected.includes(l.id);
          const accentClass = l.accent === "flame" ? "mrf-card-hover" : l.accent === "court" ? "mrf-card-hover-court" : "mrf-card-hover";
          const dotClass = l.accent === "flame" ? "bg-flame" : l.accent === "court" ? "bg-accent" : "bg-amber";
          return (
            <article key={l.id} className={`mrf-card ${accentClass} p-5 ${isSelected ? "ring-1 ring-flame" : ""}`}>
              <header className="flex items-start justify-between gap-3">
                <div>
                  <div className="eyebrow flex items-center gap-2">
                    <span className={`size-1.5 rounded-full ${dotClass}`} /> {l.season}
                  </div>
                  <h2 className="font-display text-2xl mt-1">{l.team}</h2>
                  <div className="text-sm text-amber font-medium mt-0.5">{l.nickname}</div>
                </div>
                <button
                  onClick={() => toggle(l.id)}
                  className={`shrink-0 inline-flex items-center justify-center size-9 rounded-md border transition-colors ${isSelected ? "border-flame bg-flame text-white" : "border-hairline hover:border-flame/60"}`}
                  aria-label="Selecionar para comparar"
                >
                  {isSelected ? <Check className="size-4" /> : <span className="text-xs font-display tracking-widest">+</span>}
                </button>
              </header>

              <p className="text-sm text-muted-foreground mt-3">{l.blurb}</p>

              <div className="mt-4 grid grid-cols-5 gap-1.5">
                {l.starters.map((s) => (
                  <div key={s.pos} className="rounded-md border border-hairline bg-surface-2 p-2 text-center">
                    <div className="eyebrow text-amber">{s.pos}</div>
                    <div className="text-[11px] mt-1 font-medium leading-tight">{s.name}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span><MetricTooltip abbr="NetRtg" /> <span className="font-display text-foreground text-base ml-1">{l.netRating > 0 ? "+" : ""}{l.netRating}</span></span>
                <span>{l.record}</span>
                <span className="inline-flex items-center gap-1"><Trophy className="size-3.5 text-amber" />{l.result}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
