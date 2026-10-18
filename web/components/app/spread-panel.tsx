"use client";
import { CloudRain, Droplets, Thermometer } from "lucide-react";
import { RiskLine } from "@/components/charts/charts";
import { RiskBadge } from "@/components/ui/badge";
import { LABELS, RISK_MESSAGES, formatDateTime } from "@/lib/format";
import type { DailyWeather, SpreadPrediction } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

const DAY = new Intl.DateTimeFormat("en-IN", { weekday: "short" });

export function SpreadPanel({ prediction, compact }: { prediction: SpreadPrediction; compact?: boolean }) {
  const worst = prediction.weather.reduce<DailyWeather | null>((a, d) => (d.humidity_mean > (a?.humidity_mean ?? -1) ? d : a), null);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <RiskBadge risk={prediction.risk_level} />
        <span className="text-sm text-muted">
          Peak score <span className="font-semibold text-ink">{prediction.risk_score}</span>/100 · {LABELS[prediction.disease]} · updated {formatDateTime(prediction.created_at)}
        </span>
      </div>
      <p className="mt-3 text-[15px]">{prediction.summary || RISK_MESSAGES[prediction.risk_level]}</p>
      <div className="mt-5">
        <RiskLine forecast={prediction.forecast} height={compact ? 180 : 230} />
      </div>
      {!compact && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-center text-sm">
            <caption className="sr-only">Daily weather used for the forecast</caption>
            <thead>
              <tr className="text-muted">
                <th className="py-2 text-left font-medium">Day</th>
                {prediction.weather.map((d) => (
                  <th key={d.date} className="py-2 font-medium">
                    {DAY.format(new Date(d.date + "T12:00:00"))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/10">
              {(
                [
                  [Thermometer, "Temp °C", (d) => `${Math.round(d.temp_min)}–${Math.round(d.temp_max)}`],
                  [Droplets, "Humidity", (d) => `${d.humidity_mean}%`],
                  [CloudRain, "Rain mm", (d) => d.rain_mm],
                  [null, "Score", (_d, i) => prediction.forecast[i]?.score],
                ] as [LucideIcon | null, string, (d: DailyWeather, i: number) => string | number | undefined][]
              ).map(([Icon, label, fn]) => (
                <tr key={label}>
                  <th scope="row" className="flex items-center gap-1.5 py-2 text-left font-medium">
                    {Icon && <Icon className="h-3.5 w-3.5 text-muted" />}
                    {label}
                  </th>
                  {prediction.weather.map((d, i) => (
                    <td key={d.date} className={`py-2 ${label === "Score" ? "font-semibold" : ""}`}>
                      {fn(d, i)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {compact && worst && <p className="mt-2 text-xs text-muted">Most humid day: {DAY.format(new Date(worst.date + "T12:00:00"))}, {worst.humidity_mean}% average RH</p>}
    </div>
  );
}
