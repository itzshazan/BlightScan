"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { DiseaseLabel, ForecastPoint } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Class colours, validated (scripts/validate_palette.js) against each mode's card surface.
type ChartColors = Record<DiseaseLabel | "ink" | "muted" | "grid" | "surface", string>;

const PALETTE: Record<"light" | "dark", ChartColors> = {
  light: { healthy: "#008561", early_blight: "#d87220", late_blight: "#b02a1e", ink: "#15372c", muted: "#526b63", grid: "rgba(21,55,44,.08)", surface: "#ffffff" },
  dark: { healthy: "#24a47f", early_blight: "#c4862a", late_blight: "#c93a3a", ink: "#e6fff8", muted: "#a1b4ad", grid: "rgba(205,250,237,.08)", surface: "#0a2921" },
};

export function useChartColors() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return PALETTE[mounted && resolvedTheme === "dark" ? "dark" : "light"];
}

const axis = (c: ChartColors) => ({ tick: { fill: c.muted, fontSize: 12 }, axisLine: false, tickLine: false });

function TipBox({ title, rows }: { title: string; rows: { label: string; value: string | number; color?: string }[] }) {
  return (
    <div className="rounded-xl border border-line/10 bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-medium">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 text-muted">
          {r.color && <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />}
          {r.label}: <span className="font-semibold text-ink">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Scans per week, stacked by result. */
export type WeekRow = { week: string } & Record<DiseaseLabel, number>;

export function ScansPerWeek({ data }: { data: WeekRow[] }) {
  const c = useChartColors();
  const keys: [DiseaseLabel, string][] = [
    ["healthy", "Healthy"],
    ["early_blight", "Early Blight"],
    ["late_blight", "Late Blight"],
  ];
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-sm text-muted">
        {keys.map(([k, l]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c[k] }} /> {l}
          </span>
        ))}
      </div>
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={data} barCategoryGap="28%" margin={{ left: -24, right: 4, top: 4 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="week" {...axis(c)} />
            <YAxis allowDecimals={false} {...axis(c)} />
            <Tooltip
              cursor={{ fill: c.grid }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TipBox title={`Week of ${label}`} rows={keys.map(([k, l]) => ({ label: l, value: payload[0].payload[k], color: c[k] }))} />
                ) : null
              }
            />
            {keys.map(([k], i) => (
              <Bar key={k} dataKey={k} stackId="a" fill={c[k]} stroke={c.surface} strokeWidth={2} radius={i === keys.length - 1 ? [4, 4, 0, 0] : 0} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Result breakdown donut with direct labels in the legend list. */
export function ResultDonut({ counts }: { counts: Record<DiseaseLabel, number> }) {
  const c = useChartColors();
  const data: { key: DiseaseLabel; name: string; value: number }[] = [
    { key: "healthy", name: "Healthy", value: counts.healthy },
    { key: "early_blight", name: "Early Blight", value: counts.early_blight },
    { key: "late_blight", name: "Late Blight", value: counts.late_blight },
  ];
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="flex items-center gap-6">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius="64%" outerRadius="100%" paddingAngle={2} stroke={c.surface} strokeWidth={2} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.key} fill={c[d.key]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <TipBox title={String(payload[0].name)} rows={[{ label: "Scans", value: `${payload[0].value} (${Math.round((Number(payload[0].value) / total) * 100)}%)` }]} />
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-serif text-3xl leading-none">{total}</p>
            <p className="text-xs text-muted">scans</p>
          </div>
        </div>
      </div>
      <ul className="flex-1 space-y-3 text-sm">
        {data.map((d) => (
          <li key={d.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c[d.key] }} />
              {d.name}
            </span>
            <span className="font-semibold">
              {d.value} <span className="font-normal text-muted">· {total ? Math.round((d.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const DAY = new Intl.DateTimeFormat("en-IN", { weekday: "short" });

/** 7-day spread-risk line with low / medium / high bands. */
export function RiskLine({ forecast, height = 220 }: { forecast: ForecastPoint[]; height?: number }) {
  const c = useChartColors();
  const data = forecast.map((p) => ({ ...p, day: DAY.format(new Date(p.date + "T12:00:00")) }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: -24, right: 8, top: 8 }}>
          <ReferenceArea y1={0} y2={35} fill={c.healthy} fillOpacity={0.06} />
          <ReferenceArea y1={35} y2={65} fill={c.early_blight} fillOpacity={0.07} />
          <ReferenceArea y1={65} y2={100} fill={c.late_blight} fillOpacity={0.07} />
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="day" {...axis(c)} />
          <YAxis domain={[0, 100]} ticks={[0, 35, 65, 100]} {...axis(c)} />
          <Tooltip
            cursor={{ stroke: c.muted, strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              const level = p.score >= 65 ? "High" : p.score >= 35 ? "Medium" : "Low";
              return <TipBox title={new Date(p.date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })} rows={[{ label: "Risk score", value: `${p.score} · ${level}` }]} />;
            }}
          />
          <Line type="monotone" dataKey="score" stroke={c.ink} strokeWidth={2} dot={{ r: 4, fill: c.surface, stroke: c.ink, strokeWidth: 2 }} activeDot={{ r: 6, stroke: c.surface, strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Daily bars for admin activity. */
export function DailyBars({ data }: { data: { day: string; count: number }[] }) {
  const c = useChartColors();
  return (
    <div className="h-60">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -24, right: 4, top: 4 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="day" {...axis(c)} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} {...axis(c)} />
          <Tooltip cursor={{ fill: c.grid }} content={({ active, payload, label }) => (active && payload?.length ? <TipBox title={String(label)} rows={[{ label: "Scans", value: Number(payload[0].value) }]} /> : null)} />
          <Bar dataKey="count" fill={c.healthy} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
