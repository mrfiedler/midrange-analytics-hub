import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trophy, Check, Loader2, Layers } from "lucide-react";
import { HISTORIC_LINEUPS } from "@/data/historic-lineups";
import { TEAMS } from "@/data/teams";
import { MetricTooltip } from "@/components/MetricTooltip";
import { PlayerRadar } from "@/components/charts/PlayerRadar";
import { teamLogoUrl } from "@/lib/nba-logos";
import { getTeamRoster, getSeasonAveragesBulk } from "@/lib/balldontlie.functions";
import { scoreMetric } from "@/lib/score-metric";
import { formatSeason } from "@/lib/season";

export const Route = createFileRoute("/lineups")({
  head: () => ({
    meta: [
      { title: "Composições históricas — Midrange Frenzy" },
      { name: "description", content: "Quintetos lendários da NBA e montador livre de composição por time e temporada." },
    ],
  }),
  component: LineupsPage,
});

const SEASON_YEARS = Array.from({ length: 2025 - 1979 + 1 }, (_, i) => 2025 - i);
const RADAR_AXES = ["PPG", "RPG", "APG", "FG%", "3P%"] as const;
const SLOT_COLORS = ["oklch(0.62 0.23 28)", "oklch(0.78 0.13 235)"];

interface CustomSlot {
  teamId: number;
  season: number;
  loading: boolean;
  error?: string;
  players: Array<{ id: number; fullName: string; position: string }>;
  averages: Array<any>;
}

function LineupsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [slots, setSlots] = useState<CustomSlot[]>([]);
  const [pickTeamId, setPickTeamId] = useState<number>(20); // NYK default
  const [pickSeason, setPickSeason] = useState<number>(2023);

  const fetchRoster = useServerFn(getTeamRoster);
  const fetchAverages = useServerFn(getSeasonAveragesBulk);

  const toggle = (id: string) => {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length >= 2 ? [s[1], id] : [...s, id]
    );
  };

  const chosen = HISTORIC_LINEUPS.filter((l) => selected.includes(l.id));

  const buildLineup = useMutation({
    mutationFn: async ({ teamId, season }: { teamId: number; season: number }) => {
      const roster = await fetchRoster({ data: { teamId, season } });
      if (!roster.ok) throw new Error(roster.error);
      const ids = roster.players.slice(0, 15).map((p: { id: number }) => p.id);
      let averages: any[] = [];
      if (ids.length > 0) {
        const avg = await fetchAverages({ data: { season, playerIds: ids } });
        if (avg.ok) averages = avg.averages;
      }
      return { teamId, season, players: roster.players.slice(0, 15), averages };
    },
    onSuccess: (data) => {
      setSlots((s) => {
        const next = [...s, {
          teamId: data.teamId, season: data.season,
          loading: false, players: data.players, averages: data.averages,
        }];
        return next.slice(-2);
      });
    },
  });

  const addCustom = () => buildLineup.mutate({ teamId: pickTeamId, season: pickSeason });
  const removeSlot = (i: number) => setSlots((s) => s.filter((_, idx) => idx !== i));

  const customRadarSeries = slots
    .filter((slot) => slot.averages.length > 0)
    .map((slot, i) => {
      const team = TEAMS.find((t) => t.id === slot.teamId);
      const a = aggregateAverages(slot.averages);
      return {
        name: `${team?.abbr ?? "?"} ${slot.season}`,
        color: SLOT_COLORS[i] ?? "oklch(0.78 0.16 70)",
        values: [
          scoreMetric("PPG", a.pts),
          scoreMetric("RPG", a.reb),
          scoreMetric("APG", a.ast),
          scoreMetric("FG%", a.fg_pct),
          scoreMetric("3P%", a.fg3_pct),
        ],
      };
    });


  return (
    <div className="space-y-10 fade-up">
      <div>
        <div className="eyebrow">Curadoria & criador</div>
        <h1 className="font-display text-4xl md:text-5xl">Composições</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Os lineups que reescreveram o livro de regras — e o seu próprio montador de composição por time e temporada.
        </p>
      </div>

      {/* ===================== Custom builder ===================== */}
      <section className="mrf-card p-5 md:p-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-flame/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 eyebrow text-flame">
            <Layers className="size-3.5" /> Montar composição personalizada
          </div>
          <h2 className="font-display text-2xl md:text-3xl mt-1">Time + temporada → elenco completo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione um time e uma temporada (1979 a 2025) para montar o elenco e visualizar o perfil coletivo.
            Adicione duas composições para comparar lado a lado.
          </p>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Time</span>
              <select
                value={pickTeamId}
                onChange={(e) => setPickTeamId(Number(e.target.value))}
                className="rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm min-w-[14rem]"
              >
                {[...TEAMS].sort((a, b) => a.city.localeCompare(b.city)).map((t) => (
                  <option key={t.id} value={t.id}>{t.city} {t.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Temporada</span>
              <select
                value={pickSeason}
                onChange={(e) => setPickSeason(Number(e.target.value))}
                className="rounded-md border border-hairline bg-surface-2 px-3 py-2 text-sm"
              >
                {SEASON_YEARS.map((y) => <option key={y} value={y}>{formatSeason(y)}</option>)}
              </select>
            </label>
            <button
              onClick={addCustom}
              disabled={buildLineup.isPending || slots.length >= 2}
              className="inline-flex items-center gap-2 rounded-md flame-bg px-4 py-2 text-xs font-display uppercase tracking-widest text-white disabled:opacity-40"
            >
              {buildLineup.isPending && <Loader2 className="size-3.5 animate-spin" />}
              {slots.length >= 2 ? "Limite (2)" : "Carregar composição"}
            </button>
            {slots.length > 0 && (
              <button onClick={() => setSlots([])} className="text-xs text-muted-foreground hover:text-foreground underline">
                Limpar
              </button>
            )}
          </div>

          {buildLineup.isError && (
            <div className="mt-3 text-sm text-amber">Erro ao carregar: {(buildLineup.error as Error).message}</div>
          )}

          {/* Slots */}
          {slots.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {slots.map((slot, i) => {
                const team = TEAMS.find((t) => t.id === slot.teamId)!;
                const hasStats = slot.averages.length > 0;
                const agg = aggregateAverages(slot.averages);
                const logo = teamLogoUrl(team.abbr);
                const fmt = (v: number, pct = false) =>
                  hasStats ? (pct ? `${(v * 100).toFixed(1)}%` : v.toFixed(1)) : "—";
                return (
                  <div key={i} className="mrf-card p-4" style={{ borderColor: `color-mix(in oklab, ${SLOT_COLORS[i]} 60%, var(--hairline))` }}>
                    <header className="flex items-center gap-3">
                      {logo && <img src={logo} alt="" className="size-12 object-contain" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-lg leading-tight truncate">{team.city} {team.name}</div>
                        <div className="text-xs text-muted-foreground">{formatSeason(slot.season)} · {slot.players.length} jogadores</div>
                      </div>
                      <button onClick={() => removeSlot(i)} className="text-xs text-muted-foreground hover:text-flame">remover</button>
                    </header>

                    <div className="mt-3 grid grid-cols-5 gap-2 text-center">
                      <Mini label="PPG" value={fmt(agg.pts)} />
                      <Mini label="RPG" value={fmt(agg.reb)} />
                      <Mini label="APG" value={fmt(agg.ast)} />
                      <Mini label="FG%" value={fmt(agg.fg_pct, true)} />
                      <Mini label="3P%" value={fmt(agg.fg3_pct, true)} />
                    </div>

                    {!hasStats && (
                      <div className="mt-3 text-[11px] text-amber/90">
                        Médias da temporada {formatSeason(slot.season)} indisponíveis na API gratuita — exibindo apenas o elenco.
                      </div>
                    )}

                    <div className="mt-4">
                      <div className="eyebrow mb-1.5">Elenco</div>
                      {slot.players.length === 0 ? (
                        <div className="text-xs text-muted-foreground">Nenhum jogador retornado para esta temporada.</div>
                      ) : (
                        <ul className="grid grid-cols-2 gap-1 text-xs">
                          {slot.players.map((p) => (
                            <li key={p.id} className="truncate text-muted-foreground">
                              <span className="text-foreground">{p.fullName}</span> · {p.position || "—"}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          )}

          {customRadarSeries.length >= 1 && (
            <div className="mt-6">
              <div className="eyebrow">Perfil coletivo</div>
              <h3 className="font-display text-xl mb-2">Radar comparativo</h3>
              <PlayerRadar axes={[...RADAR_AXES]} series={customRadarSeries} />
              <p className="mt-2 text-[11px] italic text-muted-foreground">
                Média simples do elenco completo listado, e não estatísticas oficiais de equipe.
              </p>
            </div>
          )}

        </div>
      </section>

      {/* ===================== Comparison of historic lineups ===================== */}
      {chosen.length === 2 && (
        <section className="mrf-card p-5">
          <div className="eyebrow text-amber mb-3">Comparativo · históricos</div>
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

      <section>
        <div className="mb-3">
          <div className="eyebrow">Curadoria</div>
          <h2 className="font-display text-2xl md:text-3xl">Lineups lendários</h2>
        </div>
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
      </section>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface-2 p-2">
      <div className="eyebrow text-[9px]">{label}</div>
      <div className="font-display text-base mt-0.5">{value}</div>
    </div>
  );
}

function aggregateAverages(rows: any[]) {
  if (!rows || rows.length === 0) return { pts: 0, reb: 0, ast: 0, fg_pct: 0, fg3_pct: 0 };
  const n = rows.length;
  const sum = rows.reduce(
    (acc, r) => ({
      pts: acc.pts + (r.pts ?? 0),
      reb: acc.reb + (r.reb ?? 0),
      ast: acc.ast + (r.ast ?? 0),
      fg_pct: acc.fg_pct + (r.fg_pct ?? 0),
      fg3_pct: acc.fg3_pct + (r.fg3_pct ?? 0),
    }),
    { pts: 0, reb: 0, ast: 0, fg_pct: 0, fg3_pct: 0 }
  );
  return {
    pts: sum.pts / n,
    reb: sum.reb / n,
    ast: sum.ast / n,
    fg_pct: sum.fg_pct / n,
    fg3_pct: sum.fg3_pct / n,
  };
}
