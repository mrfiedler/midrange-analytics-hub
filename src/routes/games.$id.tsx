import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Loader2, ArrowLeft } from "lucide-react";
import { getGameSummary, type GameSummary, type GameTeam } from "@/lib/games.functions";

export const Route = createFileRoute("/games/$id")({
  head: () => ({
    meta: [
      { title: "Jogo - Placar, box score e play-by-play" },
      { name: "description", content: "Placar por período, box score, gráficos e jogada a jogada da partida." },
      { property: "og:title", content: "Jogo - Placar, box score e play-by-play" },
      { property: "og:description", content: "Placar por período, box score, gráficos e jogada a jogada da partida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GamePage,
});

const TABS = ["Placar", "Box score", "Gráficos", "Jogada a jogada"] as const;

function GamePage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getGameSummary);
  const q = useQuery({
    queryKey: ["game", id],
    queryFn: () => fn({ data: { id } }),
    refetchInterval: (query) => (query.state.data?.game?.state === "in" ? 20_000 : false),
  });
  const [tab, setTab] = useState<(typeof TABS)[number]>("Placar");

  if (q.isLoading)
    return (
      <div className="mrf-card p-10 flex justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-flame" /> Carregando jogo…
      </div>
    );
  const d = q.data;
  if (!d?.ok || !d.game)
    return <div className="mrf-card p-10 text-center text-muted-foreground">Jogo indisponível.</div>;
  const g = d.game;

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-flame">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <section className="mrf-card p-6">
        <div className="flex items-center justify-center gap-6 md:gap-12">
          <TeamHead t={g.away} />
          <div className="text-center">
            <div className="font-display text-4xl md:text-6xl tabular-nums">
              {g.away.score} <span className="text-muted-foreground">-</span> {g.home.score}
            </div>
            <div className={`mt-1 text-xs font-display uppercase tracking-widest ${g.state === "in" ? "text-flame animate-pulse" : "text-muted-foreground"}`}>
              {g.statusText}
            </div>
            {g.venue && <div className="text-[10px] text-muted-foreground mt-1">{g.venue}</div>}
          </div>
          <TeamHead t={g.home} />
        </div>
      </section>

      <div className="flex gap-1 overflow-x-auto rounded-md border border-hairline bg-surface p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`whitespace-nowrap px-3 py-1.5 rounded text-xs font-display uppercase tracking-widest ${tab === t ? "flame-bg text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {g.state === "pre" && tab !== "Placar" ? (
        <div className="mrf-card p-6 text-center text-muted-foreground text-sm">O jogo ainda não começou.</div>
      ) : tab === "Placar" ? (
        <Overview d={d} />
      ) : tab === "Box score" ? (
        <Box d={d} />
      ) : tab === "Gráficos" ? (
        <Charts d={d} />
      ) : (
        <Plays d={d} />
      )}
    </div>
  );
}

function TeamHead({ t }: { t: GameTeam }) {
  return (
    <div className="flex flex-col items-center gap-1 w-24">
      {t.logo && <img src={t.logo} alt={t.abbr} className="size-14 object-contain" />}
      <span className="font-display tracking-widest">{t.abbr}</span>
      {t.record && <span className="text-[10px] text-muted-foreground">{t.record}</span>}
    </div>
  );
}

function Overview({ d }: { d: GameSummary }) {
  const g = d.game!;
  const n = Math.max(g.home.linescores.length, g.away.linescores.length, 4);
  const pl = (i: number) => (i < 4 ? `${i + 1}º` : `OT${i - 3}`);
  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      <div className="space-y-6">
      <section className="mrf-card p-4 overflow-x-auto">
        <h3 className="eyebrow mb-3">Placar por período</h3>
        <table className="w-full text-sm tabular-nums">
          <thead className="text-muted-foreground text-xs">
            <tr><th className="text-left py-1">Time</th>{Array.from({ length: n }, (_, i) => <th key={i}>{pl(i)}</th>)}<th>T</th></tr>
          </thead>
          <tbody>
            {[g.away, g.home].map((t) => (
              <tr key={t.id} className="border-t border-hairline">
                <td className="py-2 font-display tracking-widest">{t.abbr}</td>
                {Array.from({ length: n }, (_, i) => <td key={i} className="text-center">{t.linescores[i] ?? "-"}</td>)}
                <td className="text-center font-display">{t.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {d.leaders.length > 0 && <Leaders d={d} />}
      </div>
      {d.teamStats.length > 0 && (
        <section className="mrf-card p-4">
          <h3 className="eyebrow mb-3">Comparativo dos times</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-xs text-muted-foreground font-display tracking-widest">
              <span>{g.away.abbr}</span><span>{g.home.abbr}</span>
            </div>
            {d.teamStats.map((s) => (
              <div key={s.label} className="flex justify-between border-t border-hairline pt-1.5 tabular-nums">
                <span className="w-16">{s.away}</span>
                <span className="text-muted-foreground text-xs">{s.label}</span>
                <span className="w-16 text-right">{s.home}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const CAT_PT: Record<string, string> = { Points: "Pontos", Rebounds: "Rebotes", Assists: "Assistências" };

function Leaders({ d }: { d: GameSummary }) {
  const g = d.game!;
  const cats = [...new Set(d.leaders.map((l) => l.category))].slice(0, 3);
  const [cat, setCat] = useState(cats[0]);
  const pick = (tid: string) => d.leaders.find((l) => l.teamId === tid && l.category === cat);
  const num = (v?: string) => parseFloat(v ?? "") || 0;
  const a = pick(g.away.id), h = pick(g.home.id);
  const max = Math.max(num(a?.value), num(h?.value), 1);
  return (
    <section className="mrf-card p-4">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h3 className="eyebrow">Líderes do jogo</h3>
        <div className="flex gap-1">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-2.5 py-1 rounded text-[10px] font-display uppercase tracking-widest transition-colors ${cat === c ? "flame-bg text-primary-foreground" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}>
              {CAT_PT[c] ?? c}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[{ t: g.away, l: a }, { t: g.home, l: h }].map(({ t, l }) => (
          <div key={t.id + cat} className="fade-up rounded-lg border border-hairline bg-surface-2/50 p-3 flex flex-col items-center text-center">
            {l ? (
              <Link to="/players/$id" params={{ id: l.athleteId }} className="group flex flex-col items-center">
                <div className="relative">
                  <img
                    src={`https://a.espncdn.com/i/headshots/nba/players/full/${l.athleteId}.png`}
                    alt={l.name}
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = "hidden")}
                    className="size-20 md:size-24 rounded-full object-cover bg-surface border border-hairline group-hover:border-flame transition-colors"
                  />
                  {t.logo && <img src={t.logo} alt={t.abbr} className="absolute -bottom-1 -right-1 size-7 rounded-full bg-surface p-0.5 border border-hairline" />}
                </div>
                <div className="mt-2 text-sm font-medium group-hover:text-flame leading-tight">{l.name}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{t.abbr}{l.pos ? ` · ${l.pos}` : ""}</div>
                <div className="mt-1 font-display text-3xl text-flame tabular-nums">{l.value}</div>
                <div className="mt-1 h-1.5 w-full rounded bg-surface overflow-hidden">
                  <div className="h-full flame-bg transition-all duration-500" style={{ width: `${(num(l.value) / max) * 100}%` }} />
                </div>
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">Sem dados</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Box({ d }: { d: GameSummary }) {
  const g = d.game!;
  const order = [g.away, g.home];
  return (
    <div className="space-y-6">
      {order.map((t) => {
        const b = d.box.find((x) => x.teamId === t.id);
        if (!b) return null;
        return (
          <section key={t.id} className="mrf-card p-4 overflow-x-auto">
            <h3 className="font-display tracking-widest mb-3 flex items-center gap-2">
              {t.logo && <img src={t.logo} alt="" className="size-5" />} {t.name}
            </h3>
            <table className="w-full text-xs tabular-nums whitespace-nowrap">
              <thead className="text-muted-foreground">
                <tr><th className="text-left py-1 pr-3">Jogador</th>{b.labels.map((l) => <th key={l} className="px-2">{l}</th>)}</tr>
              </thead>
              <tbody>
                {b.players.map((p) => (
                  <tr key={p.id} className={`border-t border-hairline ${p.dnp ? "opacity-50" : ""}`}>
                    <td className="py-1.5 pr-3">
                      <Link to="/players/$id" params={{ id: p.id }} className="hover:text-flame">
                        {p.name}
                      </Link>{" "}
                      <span className="text-muted-foreground">{p.pos}{p.starter ? " · T" : ""}</span>
                    </td>
                    {p.dnp ? <td colSpan={b.labels.length} className="text-muted-foreground">Não jogou</td>
                      : p.stats.map((s, i) => <td key={i} className="text-center px-2">{s}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

function Charts({ d }: { d: GameSummary }) {
  const g = d.game!;
  const flow = useMemo(() => {
    const out: { i: number; label: string; away: number; home: number; diff: number }[] = [];
    d.plays.forEach((p, i) => {
      if (p.scoring || i === 0) out.push({ i, label: `${p.period}º ${p.clock}`, away: p.away, home: p.home, diff: p.home - p.away });
    });
    return out;
  }, [d.plays]);
  const shots = d.plays.filter((p) => p.shot);
  const tc = (id?: string) => (id === g.home.id ? "var(--flame)" : "var(--accent)");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="mrf-card p-4">
        <h3 className="eyebrow mb-3">Evolução do placar</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={flow}>
              <CartesianGrid stroke="var(--hairline)" strokeDasharray="2 4" />
              <XAxis dataKey="label" hide />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--hairline)", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="stepAfter" dataKey="away" name={g.away.abbr} stroke="var(--accent)" dot={false} strokeWidth={2} />
              <Line type="stepAfter" dataKey="home" name={g.home.abbr} stroke="var(--flame)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="mrf-card p-4">
        <h3 className="eyebrow mb-3">Mapa de arremessos</h3>
        {shots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem coordenadas de arremesso para este jogo.</p>
        ) : (
          <svg viewBox="0 0 50 94" className="w-full max-h-96 mx-auto rounded bg-surface-2">
            <rect x="0" y="0" width="50" height="94" fill="none" stroke="var(--hairline)" strokeWidth="0.4" />
            <line x1="0" y1="47" x2="50" y2="47" stroke="var(--hairline)" strokeWidth="0.4" />
            <circle cx="25" cy="47" r="6" fill="none" stroke="var(--hairline)" strokeWidth="0.4" />
            <rect x="17" y="0" width="16" height="19" fill="none" stroke="var(--hairline)" strokeWidth="0.4" />
            <rect x="17" y="75" width="16" height="19" fill="none" stroke="var(--hairline)" strokeWidth="0.4" />
            {shots.map((p) => (
              <circle key={p.id} cx={p.shot!.x} cy={p.shot!.y} r="0.8"
                fill={p.shot!.made ? tc(p.teamId) : "none"} stroke={tc(p.teamId)} strokeWidth="0.3" opacity={0.85} />
            ))}
          </svg>
        )}
        <p className="mt-2 text-[10px] text-muted-foreground">
          Cheio = convertido · vazio = errado · <span className="text-accent">{g.away.abbr}</span> / <span className="text-flame">{g.home.abbr}</span>
        </p>
      </section>
    </div>
  );
}

function Plays({ d }: { d: GameSummary }) {
  const periods = [...new Set(d.plays.map((p) => p.period))];
  const [per, setPer] = useState(periods[periods.length - 1] ?? 1);
  const list = d.plays.filter((p) => p.period === per).slice().reverse();
  return (
    <section className="mrf-card p-4">
      <div className="flex gap-1 mb-3 flex-wrap">
        {periods.map((p) => (
          <button key={p} onClick={() => setPer(p)}
            className={`px-3 py-1 rounded text-xs font-display tracking-widest ${per === p ? "flame-bg text-primary-foreground" : "bg-surface-2 text-muted-foreground"}`}>
            {p <= 4 ? `${p}º` : `OT${p - 4}`}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-hairline text-sm max-h-[600px] overflow-y-auto">
        {list.map((p) => (
          <li key={p.id} className={`flex gap-3 py-2 ${p.scoring ? "" : "text-muted-foreground"}`}>
            <span className="w-12 tabular-nums text-xs">{p.clock}</span>
            <span className="flex-1">{p.text}</span>
            <span className="tabular-nums font-display text-xs">{p.away}-{p.home}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
