import { Moon, Sun, Sunset } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme-context";

const OPTIONS: { value: Theme; label: string; Icon: typeof Moon }[] = [
  { value: "dark", label: "Escuro", Icon: Moon },
  { value: "light", label: "Claro", Icon: Sun },
  { value: "evening", label: "Evening", Icon: Sunset },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema de cores"
      className="flex items-center gap-0.5 rounded-full border border-hairline bg-surface p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            aria-label={`Tema ${label}`}
            title={label}
            onClick={() => setTheme(value)}
            className={`grid place-items-center size-7 rounded-full transition-all active:scale-90 ${
              active
                ? "bg-flame text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
            }`}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
