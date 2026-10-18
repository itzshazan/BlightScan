"use client";
import { useEffect, useState } from "react";
import { CloudRain, Droplets, Thermometer, TriangleAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/misc";
import { getForecast, isBlightFavourable, type Forecast } from "@/lib/weather";
import type { Field } from "@/lib/types";

export function WeatherCard({ field, className = "" }: { field?: Field | null; className?: string }) {
  const [w, setW] = useState<Forecast | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (field?.latitude == null || field.longitude == null) return;
    let alive = true;
    getForecast(field.latitude, field.longitude)
      .then((d) => alive && setW(d))
      .catch(() => alive && setErr(true));
    return () => {
      alive = false;
    };
  }, [field?.latitude, field?.longitude]);

  if (!field?.latitude)
    return (
      <div className={`card p-6 ${className}`}>
        <h2 className="font-medium">Local weather</h2>
        <p className="mt-3 text-sm text-muted">Add a location to one of your fields to see its weather here.</p>
      </div>
    );

  const fav = w && isBlightFavourable(w.current);
  const rain24 = w ? w.hourly.slice(0, 24).reduce((a, h) => a + (h.rain || 0), 0) : 0;

  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">Local weather</h2>
          <p className="text-sm text-muted">{field.name}</p>
        </div>
        {fav && (
          <span className="inline-flex items-center gap-1 rounded-full bg-early-soft px-2.5 py-1 text-xs font-semibold text-early">
            <TriangleAlert className="h-3.5 w-3.5" /> Blight-favourable
          </span>
        )}
      </div>
      {!w && !err ? (
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : err || !w ? (
        <p className="mt-6 text-sm text-muted">Weather is unavailable right now.</p>
      ) : (
        <>
          <dl className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Thermometer, k: "Temp", v: `${Math.round(w.current.temperature)}°C` },
              { icon: Droplets, k: "Humidity", v: `${Math.round(w.current.humidity)}%` },
              { icon: CloudRain, k: "Rain 24 h", v: `${rain24.toFixed(1)} mm` },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl bg-sunken p-3">
                <x.icon className="h-4 w-4 text-muted" />
                <dd className="mt-2 text-xl font-semibold tracking-[-0.02em]">{x.v}</dd>
                <dt className="text-xs text-muted">{x.k}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted">{w.source === "open-meteo" ? "Live from Open-Meteo" : "Offline estimate: Open-Meteo unreachable"}</p>
        </>
      )}
    </div>
  );
}
