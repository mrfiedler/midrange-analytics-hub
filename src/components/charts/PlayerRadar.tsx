import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Series {
  name: string;
  color: string;
  values: number[];     // 0-100 already normalized
}

interface Props {
  axes: string[];           // labels of axes
  series: Series[];
}

export function PlayerRadar({ axes, series }: Props) {
  const data = axes.map((axis, i) => {
    const row: Record<string, number | string> = { axis };
    series.forEach((s) => (row[s.name] = s.values[i] ?? 0));
    return row;
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="oklch(0.27 0.008 280)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "oklch(0.75 0 0)", fontSize: 11, fontFamily: "Barlow Condensed", letterSpacing: "0.1em" }} />
          <PolarRadiusAxis tick={{ fill: "oklch(0.5 0 0)", fontSize: 10 }} angle={90} domain={[0, 100]} />
          {series.map((s) => (
            <Radar key={s.name} name={s.name} dataKey={s.name} stroke={s.color} fill={s.color} fillOpacity={0.18} strokeWidth={2} />
          ))}
          <Tooltip
            contentStyle={{ background: "oklch(0.18 0.006 280)", border: "1px solid oklch(0.27 0.008 280)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "oklch(0.85 0 0)" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
