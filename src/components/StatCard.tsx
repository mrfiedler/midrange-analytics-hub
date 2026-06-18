import { MetricTooltip } from "@/components/MetricTooltip";
import { findMetric } from "@/data/glossary";
import type { ReactNode } from "react";

interface Props {
  abbr: string;          // metric abbreviation
  value: ReactNode;
  hint?: ReactNode;
  accent?: "flame" | "court" | "amber";
}

const ACCENT: Record<NonNullable<Props["accent"]>, string> = {
  flame: "before:bg-flame",
  court: "before:bg-accent",
  amber: "before:bg-amber",
};

export function StatCard({ abbr, value, hint, accent = "flame" }: Props) {
  const m = findMetric(abbr);
  return (
    <div className={`mrf-card mrf-card-hover relative overflow-hidden p-4 pl-5 before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] ${ACCENT[accent]}`}>
      <div className="eyebrow flex items-center gap-1.5">
        <MetricTooltip abbr={abbr} showIcon>
          {abbr}
        </MetricTooltip>
      </div>
      <div className="number-xl mt-2 text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1 truncate">{hint ?? m?.name}</div>
    </div>
  );
}
