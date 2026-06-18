import { useMode } from "@/lib/mode-context";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Brain } from "lucide-react";

export function ModeToggle() {
  const { mode, toggle } = useMode();
  const isPro = mode === "pro";

  return (
    <button
      onClick={toggle}
      className="group flex items-center gap-2.5 rounded-full border border-hairline bg-surface px-3 py-1.5 text-xs font-display uppercase tracking-widest transition-colors hover:border-flame/60"
      aria-label="Alternar modo Newbie / Pro"
    >
      <span className={`flex items-center gap-1.5 transition-opacity ${isPro ? "opacity-40" : "opacity-100 text-amber"}`}>
        <Sparkles className="size-3.5" /> Newbie
      </span>
      <Switch checked={isPro} onCheckedChange={toggle} className="data-[state=checked]:bg-flame" />
      <span className={`flex items-center gap-1.5 transition-opacity ${isPro ? "opacity-100 text-flame" : "opacity-40"}`}>
        Pro <Brain className="size-3.5" />
      </span>
    </button>
  );
}
