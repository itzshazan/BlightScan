// Calls to the FastAPI ML service (spec 6.1). Server-only: holds ML_API_KEY.
import type { DailyWeather, DiseaseLabel, ForecastPoint, RiskLevel, Severity } from "@/lib/types";

export interface MlPrediction {
  label: DiseaseLabel;
  confidence: number;
  probabilities: Record<DiseaseLabel | "other", number>;
  severity: Severity;
  model_version: string;
  inference_ms: number;
  in_domain: boolean;
  note: string | null;
  top_class: string;
}

export interface MlSpread {
  risk_level: RiskLevel;
  risk_score: number;
  forecast: ForecastPoint[];
  weather: DailyWeather[];
  summary: string;
}

export class MlError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

// Free hosting sleeps when idle; the first request can take 30–60 s.
const TIMEOUT_MS = 60_000;

async function call<T>(path: string, body: unknown): Promise<T> {
  const base = process.env.ML_API_URL;
  const key = process.env.ML_API_KEY;
  if (!base || !key) throw new MlError("The model service is not configured", 503);
  let res: Response;
  try {
    res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new MlError("Our model is waking up, try again in a minute", 504);
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new MlError(detail?.detail ?? `Model service error (${res.status})`, res.status >= 500 ? 502 : 400);
  }
  return res.json() as Promise<T>;
}

export const mlPredict = (imageUrl: string) => call<MlPrediction>("/predict", { image_url: imageUrl });

export const mlSpread = (body: { disease: DiseaseLabel; latitude: number; longitude: number; severity: Severity; recent_cases: number }) =>
  call<MlSpread>("/predict-spread", body);
