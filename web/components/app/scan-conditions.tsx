import { CloudRain, Droplets, Thermometer, Timer } from "lucide-react";
import { LABELS, formatDateTime } from "@/lib/format";
import type { DiseaseLabel, WeatherSnapshot } from "@/lib/types";
import { cn } from "@/lib/utils";

// Live weather saved when the photo was taken, and how it relates to the diagnosis.
// Context only: the model's label is never changed by the weather.
function verdict(w: WeatherSnapshot, label: DiseaseLabel): { text: string; tone: "agree" | "warn" | "neutral" } {
  if (!w.favours) {
    return label === "healthy"
      ? { text: "Conditions over the last 24 hours weren't favourable for either blight.", tone: "agree" }
      : { text: "Conditions over the last 24 hours weren't favourable for spread, but the infection is already there. Keep checking nearby plants.", tone: "neutral" };
  }
  const fav = LABELS[w.favours].toLowerCase();
  if (label === w.favours) return { text: `Recent weather favours ${fav}, which matches the diagnosis.`, tone: "agree" };
  if (label === "healthy") return { text: `The leaf looks healthy, but recent weather favours ${fav}. Check nearby plants over the next few days.`, tone: "warn" };
  return { text: `Recent weather favours ${fav} more than ${LABELS[label].toLowerCase()}. If you're unsure, request an expert review.`, tone: "warn" };
}

export function ScanConditions({ weather, label }: { weather: WeatherSnapshot; label: DiseaseLabel }) {
  const v = verdict(weather, label);
  const stats = [
    { icon: Thermometer, v: `${Math.round(weather.temperature)}°C`, k: "Temperature" },
    { icon: Droplets, v: `${weather.humidity}%`, k: "Humidity" },
    { icon: CloudRain, v: `${weather.rain_24h} mm`, k: "Rain, last 24 h" },
    { icon: Timer, v: `${weather.humid_hours_24h} h`, k: "Above 90% humidity" },
  ];
  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-medium">Conditions when photographed</h2>
        <p className="text-sm text-muted">
          {formatDateTime(weather.captured_at)} · {weather.source === "open-meteo" ? "Open-Meteo" : "estimate, weather service unreachable"}
        </p>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="rounded-2xl bg-sunken p-4">
            <s.icon className="h-4 w-4 text-muted" />
            <dd className="mt-3 text-2xl font-semibold tracking-[-0.02em] tabular-nums">{s.v}</dd>
            <dt className="text-sm text-muted">{s.k}</dt>
          </div>
        ))}
      </dl>
      <p
        className={cn(
          "mt-4 rounded-2xl px-4 py-3 text-[15px]",
          v.tone === "agree" && "bg-healthy-soft text-healthy",
          v.tone === "warn" && "bg-early-soft text-early",
          v.tone === "neutral" && "bg-sunken text-ink"
        )}
      >
        {v.text}
      </p>
      <p className="mt-3 text-xs text-muted">
        Favourable hours in the last 24 h: late blight {weather.late_hours_24h} (10–25 °C and wet), early blight {weather.early_hours_24h} (24–29 °C and wet). The weather is
        shown for context and doesn&apos;t change the diagnosis.
      </p>
    </section>
  );
}
