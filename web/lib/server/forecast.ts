// Shared by POST /api/scans and POST /api/fields/[id]/forecast.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DiseaseLabel, Severity } from "@/lib/types";
import { mlSpread, type MlSpread } from "./ml";

const FOURTEEN_DAYS = 14 * 86400000;

export type ForecastResult = ({ ok: true } & MlSpread) | { ok: false; reason: "no-location" | "no-diseased-scan" | "not-found" };

/** Forecast for a scan location that isn't a mapped field. Saved with field_id = null. Uses the service role. */
export async function runPointForecast(
  admin: SupabaseClient,
  p: { scanId: string; disease: DiseaseLabel; severity: Severity; lat: number; lon: number }
): Promise<MlSpread> {
  const out = await mlSpread({ disease: p.disease, latitude: p.lat, longitude: p.lon, severity: p.severity, recent_cases: 0 });
  const { error } = await admin.from("spread_predictions").insert({
    field_id: null,
    scan_id: p.scanId,
    disease: p.disease,
    risk_level: out.risk_level,
    risk_score: out.risk_score,
    forecast: out.forecast,
    summary: out.summary,
    weather: out.weather,
  });
  if (error) throw new Error(error.message);
  return out;
}

/** Forecast from the field's latest diseased scan, save it, and update fields.current_risk. Uses the service role. */
export async function runSpreadForecast(admin: SupabaseClient, fieldId: string): Promise<ForecastResult> {
  const { data: field } = await admin.from("fields").select("id, latitude, longitude").eq("id", fieldId).single();
  if (!field) return { ok: false, reason: "not-found" };
  if (field.latitude == null || field.longitude == null) return { ok: false, reason: "no-location" };

  const { data: scans } = await admin
    .from("scans")
    .select("id, predicted_label, expert_label, severity, created_at")
    .eq("field_id", fieldId)
    .order("created_at", { ascending: false })
    .limit(50);
  const diseased = (scans ?? []).filter((s) => (s.expert_label ?? s.predicted_label) !== "healthy");
  const latest = diseased[0];
  if (!latest) return { ok: false, reason: "no-diseased-scan" };

  const disease = (latest.expert_label ?? latest.predicted_label) as DiseaseLabel;
  const recent = diseased.filter((s) => Date.now() - new Date(s.created_at).getTime() < FOURTEEN_DAYS).length - 1;
  const out = await mlSpread({
    disease,
    latitude: field.latitude,
    longitude: field.longitude,
    severity: (latest.severity ?? "moderate") as Severity,
    recent_cases: Math.max(0, recent),
  });

  const { error } = await admin.from("spread_predictions").insert({
    field_id: fieldId,
    scan_id: latest.id,
    disease,
    risk_level: out.risk_level,
    risk_score: out.risk_score,
    forecast: out.forecast,
    summary: out.summary,
    weather: out.weather,
  });
  if (error) throw new Error(error.message);
  await admin.from("fields").update({ current_risk: out.risk_level }).eq("id", fieldId);
  return { ok: true, ...out };
}
