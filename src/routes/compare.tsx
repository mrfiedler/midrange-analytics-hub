import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, Plus, X, Search, Share2 } from "lucide-react";
import { searchPlayers, getPlayerProfile } from "@/lib/balldontlie.functions";
import { PlayerRadar } from "@/components/charts/PlayerRadar";
import { MetricTooltip } from "@/components/MetricTooltip";
import { scoreMetric } from "@/lib/score-metric";
import { getCurrentSeason } from "@/lib/season";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Comparador — Midrange Frenzy" },
      { name: "description", content: "Compare 2 a 4 jogadores lado a lado com radar, barras e estatísticas detalhadas." },
    ],
  }),
  component: ComparePage,
});

const COLORS = ["oklch(0.62 0.23 28)", "oklch(0.45 0.18 305)", "oklch(0.78 0.16 70)", "oklch(0.68 0.14 200)"];
const AXES = ["PPG", "APG", "RPG", "SPG", "BPG", "FG%", "3P%"] as const;

type Slot = { id: number; name: string; averages: any | null };

function ComparePage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const profile = useServerFn(getPlayerProfile);

  const addPlayer = async (id: number, name: string) => {
    if (slots.length >= 4) return;
    setShowPicker(false);
    setSlots((s) => [...s, { id, name, averages: null }]);
    const res = await profile({ data: { id, season: 2024 } });
    setSlots((s) => s.map((slot) => (slot.id === id ? { ...slot, averages: res?.averages ?? null } : slot)));
  };

  const remove = (id: number) => setSlots((s) => s.filter((x) => x.id !== id));

  const radarSeries = slots
    .filter((s) => s.averages)
    .map((s, i) => ({
      name: s.name,
      color: COLORS[i % COLORS.length],
      values: AXES.map((ax) => {
        const a = s.averages;
        const map: Record<string, number | undefined> = {
          PPG: a.pts, APG: a.ast, RPG: a.reb, SPG: a.stl, BPG: a.blk, "FG%": a.fg_pct, "3P%": a.fg3_pct,
        };
        return scoreMetric(ax, map[ax]);
      }),
    }));

  return (
    <div className="space-y-8 fade-up">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="eyebrow">2 a 4 jogadores</div>
          <h1 className="font-display text-4xl md:text-5xl">Comparador</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">Adicione jogadores, veja radar sobreposto e barras comparativas para cada métrica.</p>
        </div>
        <button
          onClick={() => navigator?.clipboard?.writeText(window.location.href)}
          className="inline-flex items-center gap-1.5 text-xs font-display uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <Share2 className="size-3.5" /> Compartilhar
        </button>
      </div>

      {/* Slots */}
      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {slots.map((s, i) => (
          <div key={s.id} className="mrf-card p-4 relative" style={{ borderColor: `color-mix(in oklab, ${COLORS[i]} 50%, var(--hairline))` }}>
            <button onClick={() => remove(s.id)} className="absolute right-2 top-2 size-6 rounded-md hover:bg-surface-2 grid place-items-center text-muted-foreground"><X className="size-4" /></button>
            <div className="eyebrow" style={{ color: COLORS[i] }}>Jogador {i + 1}</div>
            <div className="font-display text-xl mt-1 truncate">{s.name}</div>
            {!s.averages ? (
              <div className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> carregando…</div>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Mini abbr="PPG" value={s.averages.pts.toFixed(1)} />
                <Mini abbr="RPG" value={s.averages.reb.toFixed(1)} />
                <Mini abbr="APG" value={s.averages.ast.toFixed(1)} />
              </div>
            )}
          </div>
        ))}

        {slots.length < 4 && (
          <button
            onClick={() => setShowPicker(true)}
            className="mrf-card mrf-card-hover p-4 min-h-[7.5rem] grid place-items-center text-muted-foreground hover:text-foreground border-dashed"
          >
            <span className="flex flex-col items-center gap-1.5">
              <Plus className="size-5" />
              <span className="text-xs font-display uppercase tracking-widest">Adicionar jogador</span>
            </span>
          </button>
        )}
      </section>

      {showPicker && <Picker onPick={addPlayer} onClose={() => setShowPicker(false)} />}

      {/* Radar */}
      {radarSeries.length >= 1 && (
        <section className="mrf-card p-5">
          <div className="eyebrow">Comparação visual</div>
          <h3 className="font-display text-xl mb-2">Radar sobreposto</h3>
          <PlayerRadar axes={[...AXES]} series={radarSeries} />
        </section>
      )}

      {/* Bars per metric */}
      {radarSeries.length >= 2 && (
        <section className="mrf-card p-5">
          <div className="eyebrow">Métrica por métrica</div>
          <h3 className="font-display text-xl mb-4">Barras comparativas</h3>
          <div className="space-y-4">
            {AXES.map((ax) => {
              const vals = slots.filter((s) => s.averages).map((s, i) => {
                const a = s.averages;
                const raw: Record<string, number> = {
                  PPG: a.pts, APG: a.ast, RPG: a.reb, SPG: a.stl, BPG: a.blk, "FG%": a.fg_pct, "3P%": a.fg3_pct,
                };
                const score = scoreMetric(ax, raw[ax]);
                return { name: s.name, score, raw: raw[ax], color: COLORS[i % COLORS.length] };
              });
              return (
                <div key={ax}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <MetricTooltip abbr={ax} />
                  </div>
                  <div className="space-y-1.5">
                    {vals.map((v) => (
                      <div key={v.name} className="flex items-center gap-3 text-xs">
                        <span className="w-28 truncate text-muted-foreground">{v.name}</span>
                        <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${v.score}%`, background: v.color }} />
                        </div>
                        <span className="w-14 text-right tabular-nums">{ax.endsWith("%") ? `${(v.raw * 100).toFixed(1)}%` : v.raw.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {slots.length === 0 && (
        <div className="mrf-card p-10 text-center text-muted-foreground">
          Adicione pelo menos 1 jogador pra começar a comparar.
        </div>
      )}
    </div>
  );
}

function Mini({ abbr, value }: { abbr: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-2 p-2">
      <div className="eyebrow text-[9px]"><MetricTooltip abbr={abbr} /></div>
      <div className="font-display text-base mt-0.5">{value}</div>
    </div>
  );
}

function Picker({ onPick, onClose }: { onPick: (id: number, name: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const search = useServerFn(searchPlayers);
  const mutation = useMutation({ mutationFn: (query: string) => search({ data: { q: query } }) });

  useEffect(() => {
    if (q.trim().length < 2) return;
    const t = setTimeout(() => mutation.mutate(q.trim()), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur grid place-items-start justify-center p-4 pt-20" onClick={onClose}>
      <div className="mrf-card w-full max-w-lg p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-hairline pb-3 mb-3">
          <Search className="size-4 text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar jogador…" className="flex-1 bg-transparent outline-none" />
          <button onClick={onClose} className="size-7 rounded-md hover:bg-surface-2 grid place-items-center text-muted-foreground"><X className="size-4" /></button>
        </div>
        <ul className="max-h-80 overflow-y-auto scrollbar-thin space-y-1">
          {(mutation.data?.players ?? []).map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onPick(p.id, p.fullName)}
                className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-surface-2"
              >
                <span className="size-2 rounded-full bg-flame" />
                <span className="flex-1 truncate">{p.fullName}</span>
                <span className="text-xs text-muted-foreground">{p.team?.abbr ?? "—"} · {p.position}</span>
              </button>
            </li>
          ))}
          {q.trim().length >= 2 && (mutation.data?.players?.length ?? 0) === 0 && !mutation.isPending && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum jogador encontrado.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
