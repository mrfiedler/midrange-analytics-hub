import { MetricTooltip } from "@/components/MetricTooltip";
import type { PlayerStatus } from "@/data/player-status";
import { HelpCircle } from "lucide-react";

const STYLE: Record<string, string> = {
  ACT: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  FA:  "border-amber/40 bg-amber/10 text-amber",
  UFA: "border-flame/40 bg-flame/10 text-flame",
  RFA: "border-flame/40 bg-flame/10 text-flame",
  TW:  "border-accent/40 bg-accent/10 text-accent",
  GL:  "border-accent/40 bg-accent/10 text-accent",
  INJ: "border-red-500/30 bg-red-500/10 text-red-400",
  SUS: "border-red-500/30 bg-red-500/10 text-red-400",
  INA: "border-hairline bg-surface-2 text-muted-foreground",
  RET: "border-hairline bg-surface-2 text-muted-foreground",
};

interface Props {
  status: PlayerStatus | null | undefined;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: Props) {
  if (!status) return null;
  // "Ativo" é o estado default e não precisa poluir a UI com badge.
  if (status.code === "ACT") return null;
  const cls = STYLE[status.code] ?? STYLE.INA;
  const sizeCls = size === "md" ? "px-2 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-[9px]";
  return (
    <MetricTooltip abbr={status.code}>
      <span className={`inline-flex items-center gap-1 rounded-full border ${cls} ${sizeCls} font-display uppercase tracking-widest`}>
        {status.label}
        <HelpCircle className="size-2.5 opacity-70" />
      </span>
    </MetricTooltip>
  );
}
