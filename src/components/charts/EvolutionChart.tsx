import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Series { name: string; color: string; dataKey: string; }
interface Props {
  data: Array<Record<string, number | string>>;
  xKey: string;
  series: Series[];
  yLabel?: string;
}

export function EvolutionChart({ data, xKey, series, yLabel }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="oklch(0.22 0.008 280)" strokeDasharray="2 4" />
          <XAxis dataKey={xKey} tick={{ fill: "oklch(0.7 0 0)", fontSize: 11 }} stroke="oklch(0.27 0.008 280)" />
          <YAxis tick={{ fill: "oklch(0.7 0 0)", fontSize: 11 }} stroke="oklch(0.27 0.008 280)" label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", fill: "oklch(0.6 0 0)", fontSize: 11 } : undefined} />
          <Tooltip
            contentStyle={{ background: "oklch(0.18 0.006 280)", border: "1px solid oklch(0.27 0.008 280)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "oklch(0.85 0 0)", fontFamily: "Barlow Condensed", letterSpacing: "0.1em" }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "oklch(0.75 0 0)" }} />
          {series.map((s) => (
            <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: s.color }} activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
