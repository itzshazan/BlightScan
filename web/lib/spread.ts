// TS port of spec section 7 (v1 weather-driven risk score).
// The FastAPI /predict-spread endpoint will run the same logic server-side; keep both in sync.
import { riskFromScore, RISK_MESSAGES } from "./format";
import type { DailyWeather, DiseaseLabel, ForecastPoint, RiskLevel, Severity } from "./types";
import type { HourlyPoint } from "./weather";

type Diseased = Exclude<DiseaseLabel, "healthy">;

export const BANDS: Record<Diseased, { min: number; max: number; label: string }> = {
  late_blight: { min: 10, max: 25, label: "cool, wet hours (10–25 °C, RH ≥ 90%)" },
  early_blight: { min: 24, max: 29, label: "warm, wet hours (24–29 °C, RH ≥ 90%)" },
};
const SEVERITY_POINTS: Record<Severity, number> = { low: 5, moderate: 12, high: 20 };
const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface SpreadResult {
  risk_level: RiskLevel;
  risk_score: number;
  forecast: ForecastPoint[];
  weather: DailyWeather[];
  summary: string;
}

function groupByDay(hourly: HourlyPoint[]) {
  const days = new Map<string, HourlyPoint[]>();
  for (const h of hourly) {
    const d = h.time.slice(0, 10);
    if (!days.has(d)) days.set(d, []);
    days.get(d)!.push(h);
  }
  return [...days.entries()].slice(0, 7);
}

export function predictSpread({
  disease,
  severity = "moderate",
  recentCases = 0,
  hourly,
}: {
  disease: DiseaseLabel;
  severity?: Severity;
  recentCases?: number;
  hourly: HourlyPoint[];
}): SpreadResult {
  const band = disease === "healthy" ? BANDS.late_blight : BANDS[disease];
  const pressure = (SEVERITY_POINTS[severity] ?? 12) + Math.min(20, recentCases * 5);
  const days = groupByDay(hourly);

  let prev: number | null = null;
  const forecast: ForecastPoint[] = [];
  const weather: DailyWeather[] = [];
  let worst: (ForecastPoint & { humidHours: number; favourable: number }) | null = null;

  for (const [date, hours] of days) {
    const humidHours = hours.filter((h) => h.rh >= 90).length;
    const favourable = hours.filter((h) => h.temp >= band.min && h.temp <= band.max && (h.rh >= 90 || h.rain > 0)).length;
    const fav = Math.min(60, (favourable / 24) * 60);
    let day = fav + pressure;
    if (disease === "late_blight") day *= 1.2;
    day = Math.min(100, day);
    const score: number = prev === null ? day : 0.6 * day + 0.4 * prev;
    prev = score;

    const point = { date, score: Math.round(score) };
    forecast.push(point);
    weather.push({
      date,
      temp_max: Math.max(...hours.map((h) => h.temp)),
      temp_min: Math.min(...hours.map((h) => h.temp)),
      humidity_mean: Math.round(hours.reduce((a, h) => a + h.rh, 0) / hours.length),
      rain_mm: +hours.reduce((a, h) => a + (h.rain || 0), 0).toFixed(1),
      wet_hours: favourable,
    });
    if (!worst || point.score > worst.score) worst = { ...point, humidHours, favourable };
  }

  const risk_score = worst ? worst.score : 0;
  const risk_level = riskFromScore(risk_score);
  const dayName = worst ? DAY[new Date(worst.date + "T12:00:00").getDay()] : "";
  const bandName = band.label.split(" (")[0];
  const driver = !worst
    ? "no weather data"
    : worst.humidHours > 0
      ? `${worst.humidHours} h above 90% humidity`
      : worst.favourable > 0
        ? `${worst.favourable} ${bandName}`
        : `no ${bandName} forecast; the risk comes from infection already in the field`;

  return {
    risk_level,
    risk_score,
    forecast,
    weather,
    summary: `${dayName}: ${driver}. ${RISK_MESSAGES[risk_level]}`,
  };
}
