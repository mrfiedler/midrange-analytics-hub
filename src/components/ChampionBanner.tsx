import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { CHAMPIONS, getChampionForSeason, type Champion } from "@/data/champions";
import { teamLogoUrl } from "@/lib/nba-logos";
import { getCurrentSeason } from "@/lib/season";
import { getChampionMetrics } from "@/lib/nba-stats.functions";

export function ChampionBanner() {
  const fallbackSeason = getCurrentSeason();
  const baseChampion = useMemo<Champion>(() => (
    getChampionForSeason(fallbackSeason) ?? CHAMPIONS[0]
  ), [fallbackSeason]);
  const fetchMetrics = useServerFn(getChampionMetrics);

  const metrics = useQuery({
    queryKey: ["champion-metrics", baseChampion.season, baseChampion.teamAbbr],
    queryFn: () => fetchMetrics({
      data: {
        season: baseChampion.season,
        teamAbbr: baseChampion.teamAbbr,
        teamName: baseChampion.team,
      },
    }),
    staleTime: 30 * 60_000,
  });

  const champ = useMemo<Champion>(() => {
    const data = metrics.data;
    if (!data?.ok) return baseChampion;
    return {
      ...baseChampion,
      record: data.record ?? baseChampion.record,
      ppg: data.ppg ?? baseChampion.ppg,
      ortg: data.ortg ?? baseChampion.ortg,
      drtg: data.drtg ?? baseChampion.drtg,
      netRtg: data.netRtg ?? baseChampion.netRtg,
      leadingScorer: data.leadingScorer ?? baseChampion.leadingScorer,
    };
  }, [baseChampion, metrics.data]);

  const logo = teamLogoUrl(champ.teamAbbr);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-hairline p-6 md:p-8"
      style={{
        background: `linear-gradient(135deg, ${champ.teamColors.primary}33 0%, ${champ.teamColors.secondary}22 60%, var(--surface) 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(60% 90% at 90% 50%, ${champ.teamColors.primary} 0%, transparent 60%)`,
        }}
      />
      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex-1 min-w-0">
          <div className="eyebrow inline-flex items-center gap-1.5" style={{ color: champ.teamColors.secondary }}>
            <Trophy className="size-3.5" /> Campeão NBA {champ.seasonLabel}
          </div>
          <h2 className="font-display text-3xl md:text-5xl leading-tight mt-1">{champ.team}</h2>
          <div className="mt-2 text-sm text-muted-foreground">
            {champ.seriesResult} · métricas atualizadas por bases públicas
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 max-w-xl">
            <Stat label="Record" value={champ.record} />
            <Stat label="PPG" value={champ.ppg.toFixed(1)} />
            <Stat label="Ortg" value={champ.ortg.toFixed(1)} />
            <Stat label="Drtg" value={champ.drtg.toFixed(1)} />
            <Stat label="NetRtg" value={`${champ.netRtg > 0 ? "+" : ""}${champ.netRtg.toFixed(1)}`} accent />
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Cestinha: <span className="text-foreground">{champ.leadingScorer.name}</span> · {champ.leadingScorer.ppg.toFixed(1)} PPG
          </div>
        </div>
        {logo && (
          <div className="shrink-0 size-32 md:size-40 grid place-items-center">
            <img src={logo} alt={champ.team} className="size-full object-contain drop-shadow-2xl" />
          </div>
        )}
      </div>
    </motion.section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md bg-background/40 border border-hairline px-2.5 py-1.5">
      <div className="eyebrow text-[9px]">{label}</div>
      <div className={`font-display text-lg leading-tight tabular-nums ${accent ? "text-amber" : ""}`}>{value}</div>
    </div>
  );
}
