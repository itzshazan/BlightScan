// Open-Meteo: free, no key, CORS-enabled. The server route /api/weather will proxy this later (spec 6.2).
import type { WeatherSnapshot } from "./types";

export interface HourlyPoint {
  time: string;
  temp: number;
  rh: number;
  rain: number;
}

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  precipitation: number;
}

export interface Forecast {
  source: "open-meteo" | "synthetic";
  current: CurrentWeather;
  hourly: HourlyPoint[];
}

interface OpenMeteoResponse {
  current: { temperature_2m: number; relative_humidity_2m: number; precipitation: number };
  hourly: { time: string[]; temperature_2m: number[]; relative_humidity_2m: number[]; precipitation: number[] };
}

const cache = new Map<string, { at: number; data: Forecast }>();

export async function fetchForecast(lat: number, lon: number): Promise<Forecast> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) return hit.data;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code` +
    `&forecast_days=7&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json: OpenMeteoResponse = await res.json();
  const data: Forecast = {
    source: "open-meteo",
    current: {
      temperature: json.current.temperature_2m,
      humidity: json.current.relative_humidity_2m,
      precipitation: json.current.precipitation,
    },
    hourly: json.hourly.time.map((t, i) => ({
      time: t,
      temp: json.hourly.temperature_2m[i],
      rh: json.hourly.relative_humidity_2m[i],
      rain: json.hourly.precipitation[i],
    })),
  };
  cache.set(key, { at: Date.now(), data });
  return data;
}

/** Deterministic stand-in used for seeded demo data and when the network call fails. */
export function syntheticForecast(seed = 1, startDate = new Date(), profile: "humid" | "dry" = "humid"): Forecast {
  let s = seed;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const hourly: HourlyPoint[] = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  for (let d = 0; d < 7; d++) {
    const wetDay = rand() < (profile === "humid" ? 0.55 : 0.2);
    const base = profile === "humid" ? 19 + rand() * 6 : 27 + rand() * 5;
    for (let h = 0; h < 24; h++) {
      const t = new Date(start.getTime() + (d * 24 + h) * 3600000);
      const diurnal = Math.sin(((h - 9) / 24) * Math.PI * 2);
      const temp = base + diurnal * 5 + (rand() - 0.5);
      const rh = Math.min(100, (wetDay ? 86 : 62) - diurnal * 12 + rand() * 6);
      const rain = wetDay && rand() < 0.18 ? +(rand() * 2.4).toFixed(1) : 0;
      hourly.push({ time: t.toISOString().slice(0, 16), temp: +temp.toFixed(1), rh: Math.round(rh), rain });
    }
  }
  const now = hourly[new Date().getHours()] ?? hourly[12];
  return { source: "synthetic", current: { temperature: now.temp, humidity: now.rh, precipitation: now.rain }, hourly };
}

export async function getForecast(lat: number, lon: number, seed?: number): Promise<Forecast> {
  try {
    return await fetchForecast(lat, lon);
  } catch {
    return syntheticForecast(seed ?? Math.round(lat * 1000 + lon * 1000));
  }
}

// ---- Conditions when a photo is taken ----------------------------------------
// Same temperature bands as the spread model (lib/spread.ts, spec 7.2). FAVOURS_MIN_HOURS is a
// tunable starting value: this many favourable hours in the last 24 h counts as "favours".
const LATE = { min: 10, max: 25 };
const EARLY = { min: 24, max: 29 };
const FAVOURS_MIN_HOURS = 6;

const wet = (h: HourlyPoint) => h.rh >= 90 || (h.rain ?? 0) > 0;
const inBand = (h: HourlyPoint, b: { min: number; max: number }) => h.temp >= b.min && h.temp <= b.max && wet(h);

/** Summarise the last 24 hourly readings (oldest first) plus current conditions. */
export function snapshotFromHourly(last24: HourlyPoint[], current: CurrentWeather, source: Forecast["source"]): WeatherSnapshot {
  const late = last24.filter((h) => inBand(h, LATE)).length;
  const early = last24.filter((h) => inBand(h, EARLY)).length;
  const best = Math.max(late, early);
  return {
    captured_at: new Date().toISOString(),
    source,
    temperature: Math.round(current.temperature * 10) / 10,
    humidity: Math.round(current.humidity),
    rain_24h: Math.round(last24.reduce((a, h) => a + (h.rain || 0), 0) * 10) / 10,
    humid_hours_24h: last24.filter((h) => h.rh >= 90).length,
    early_hours_24h: early,
    late_hours_24h: late,
    favours: best < FAVOURS_MIN_HOURS ? null : late >= early ? "late_blight" : "early_blight",
  };
}

/** Live conditions at a point: current reading plus the previous 24 hours (Open-Meteo past_days=1). */
export async function fetchSnapshot(lat: number, lon: number, timeoutMs = 10000): Promise<WeatherSnapshot> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation` +
    `&current=temperature_2m,relative_humidity_2m,precipitation` +
    `&past_days=1&forecast_days=1&timezone=auto`;
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json: OpenMeteoResponse & { current: { time: string } } = await res.json();
  const now = json.current.time; // local time, same format as hourly times
  const hours: HourlyPoint[] = json.hourly.time
    .map((t, i) => ({ time: t, temp: json.hourly.temperature_2m[i], rh: json.hourly.relative_humidity_2m[i], rain: json.hourly.precipitation[i] }))
    .filter((h) => h.time <= now && h.temp != null && h.rh != null);
  return snapshotFromHourly(hours.slice(-24), { temperature: json.current.temperature_2m, humidity: json.current.relative_humidity_2m, precipitation: json.current.precipitation }, "open-meteo");
}

/** Like fetchSnapshot, but falls back to an estimate (demo mode only) instead of failing. */
export async function getSnapshot(lat: number, lon: number): Promise<WeatherSnapshot> {
  try {
    return await fetchSnapshot(lat, lon);
  } catch {
    const f = syntheticForecast(Math.round(lat * 1000 + lon * 1000));
    return snapshotFromHourly(f.hourly.slice(0, 24), f.current, "synthetic");
  }
}

/** Blight-favourable right now: high humidity in either disease's temperature band. */
export function isBlightFavourable({ temperature, humidity }: CurrentWeather) {
  return humidity >= 85 && temperature >= 10 && temperature <= 29;
}
