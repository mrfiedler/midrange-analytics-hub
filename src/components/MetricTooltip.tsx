import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { findMetric } from "@/data/glossary";
import { useMode } from "@/lib/mode-context";
import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  abbr: string;
  children?: ReactNode;
  showIcon?: boolean;
}

export function MetricTooltip({ abbr, children, showIcon = false }: Props) {
  const metric = findMetric(abbr);
  const { mode } = useMode();

  if (!metric) return <span>{children ?? abbr}</span>;
  const text = mode === "newbie" ? metric.newbie : metric.technical;

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help underline decoration-dotted decoration-muted-foreground/40 underline-offset-4 hover:decoration-flame">
            {children ?? abbr}
            {showIcon && <HelpCircle className="size-3 opacity-60" />}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs border border-hairline bg-surface-2 text-foreground">
          <div className="text-[0.7rem] uppercase tracking-widest text-flame font-display">{metric.abbr} · {metric.name}</div>
          <div className="mt-1 text-sm leading-snug">{text}</div>
          {mode === "pro" && metric.formula && (
            <div className="mt-2 text-xs font-mono text-muted-foreground">{metric.formula}</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
