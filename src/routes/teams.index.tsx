import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { TEAMS } from "@/data/teams";
import { teamLogoUrl } from "@/lib/nba-logos";
import { getLeagueStandings } from "@/lib/nba-stats.functions";
import { getLeagueTeamStats } from "@/lib/team-stats.functions";
import { getCurrentSeason, formatSeason } from "@/lib/season";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/teams/")({
  head: () => ({
    meta: [
      { title: "Times - Midrange Frenzy" },
      { name: "description", content: "As 30 franquias da NBA com estatísticas coletivas, ranking ofensivo e defensivo." },
    ],
  }),
  component: TeamsList,
});

function TeamsList() {
  const [conf, setConf] = useState<"all" | "East" | "West">("all");
  const season = getCurrentSeason();
  const fetchStandings = useServerFn(getLeagueStandings);
  const fetchTeamStats = useServerFn(getLeagueTeamStats);

  const standingsQ = useQuery({
    queryKey: ["leagueStandings", season],
    queryFn: () => fetchStandings({ data: { season } }),
    staleTime: 15 * 60_000,
  });

  const advancedQ = useQuery({
    queryKey: ["leagueTeamStats", season],
    queryFn: () => fetchTeamStats({ data: { season } }),
    staleTime: 30 * 60_000,
  });

  const standingsByAbbr = new Map(
    (standingsQ.data?.ok ? standingsQ.data.rows : []).map((r) => [r.abbr, r]),
  );
  const advancedByName = (advancedQ.data?.ok ? advancedQ.data.rows : []) ?? [];

  const teams = [...TEAMS]
    .filter((t) => conf === "all" || t.conference === conf)
    .map((t) => {
      const live = standingsByAbbr.get(t.abbr);
      const adv = advancedByName.find((r) => r.teamName?.toLowerCase().endsWith(t.name.toLowerCase()));
      const net = adv ? adv.netRtg : live ? live.diff : t.ortg - t.drtg;
      return {
        ...t,
        record: live ? `${live.wins}-${live.losses}` : t.record,
        net,
        isLive: !!live,
      };
    })
    .sort((a, b) => b.net - a.net);


  return (
    <div className="space-y-6 fade-up">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="eyebrow">Franquias</div>
          <h1 className="font-display text-4xl md:text-5xl">Times da NBA</h1>
          <p className="text-muted-foreground mt-2">
            Ordenados por Net Rating · temporada {formatSeason(season)}. Clique pra ver o dashboard do time.
          </p>
          {standingsQ.isLoading && (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> atualizando records…
            </div>
          )}

        </div>
        <div className="inline-flex rounded-md border border-hairline overflow-hidden">
          {(["all", "East", "West"] as const).map((c) => (
            <button key={c} onClick={() => setConf(c)} className={`px-3 py-2 text-xs font-display uppercase tracking-widest ${conf === c ? "bg-flame text-white" : "bg-surface text-muted-foreground hover:text-foreground"}`}>
              {c === "all" ? "Toda liga" : c === "East" ? "Leste" : "Oeste"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => {
          const net = t.net;
          const logo = teamLogoUrl(t.abbr);

          return (
            <Link
              key={t.id}
              to="/teams/$id"
              params={{ id: String(t.id) }}
              className="mrf-card mrf-card-hover p-4 flex items-center gap-4 group"
            >
              <div className="size-16 grid place-items-center shrink-0">
                {logo ? (
                  <img
                    src={logo}
                    alt={`${t.city} ${t.name}`}
                    loading="lazy"
                    className="size-full object-contain transition-all duration-300"
                    style={{ filter: "grayscale(100%) brightness(1.8)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = "none")}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = "grayscale(100%) brightness(1.8)")}
                  />
                ) : (
                  <div className="size-14 rounded-lg court-bg grid place-items-center font-display text-xl text-white">{t.abbr}</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg leading-tight">{t.city} {t.name}</div>
                <div className="text-xs text-muted-foreground">{t.conference === "East" ? "Leste" : "Oeste"} · {t.division}</div>
                <div className="mt-1 text-xs text-muted-foreground">Record: <span className="text-foreground">{t.record}</span></div>
              </div>
              <div className="text-right">
                <div className={`font-display text-xl tabular-nums ${net >= 0 ? "text-amber" : "text-muted-foreground"}`}>{net >= 0 ? "+" : ""}{net.toFixed(1)}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">NetRtg</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
