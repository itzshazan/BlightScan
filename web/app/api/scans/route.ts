import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LEAF_BUCKET } from "@/lib/supabase/env";
import { MlError, mlPredict } from "@/lib/server/ml";
import { runPointForecast, runSpreadForecast } from "@/lib/server/forecast";
import { fail, json, requireUser } from "@/lib/server/session";
import { fetchSnapshot } from "@/lib/weather";
import type { Severity, WeatherSnapshot } from "@/lib/types";

const coord = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= max ? Math.round(v * 1000) / 1000 : null);

// POST /api/scans — the core flow (spec 1 + 6.2):
// check session → signed URL → FastAPI /predict (+ live weather at the scan location, in parallel)
// → insert scan (service role) → spread forecast if diseased. Weather is context; it never changes the label.
export async function POST(req: Request) {
  const s = await requireUser();
  if (s instanceof NextResponse) return s;
  const { supabase, user } = s;

  const body = await req.json().catch(() => null);
  const image_path: unknown = body?.image_path;
  const field_id: string | null = body?.field_id || null;
  const notes = typeof body?.notes === "string" ? body.notes.slice(0, 1000) : null;
  if (typeof image_path !== "string" || !image_path.startsWith(`${user.id}/`) || image_path.includes("..")) {
    return fail(403, "Forbidden");
  }

  let field: { id: string; latitude: number | null; longitude: number | null } | null = null;
  if (field_id) {
    const { data } = await supabase.from("fields").select("id, latitude, longitude").eq("id", field_id).eq("user_id", user.id).single();
    if (!data) return fail(400, "Unknown field");
    field = data;
  }

  // Location: the field's pin if it has one, otherwise the phone's.
  const lat = field?.latitude ?? coord(body?.latitude, 90);
  const lon = field?.longitude ?? coord(body?.longitude, 180);
  const located = lat != null && lon != null;

  const { data: signed, error: signErr } = await supabase.storage.from(LEAF_BUCKET).createSignedUrl(image_path, 300);
  if (signErr || !signed) return fail(400, "Photo not found. Upload it again.");

  let r;
  let weather: WeatherSnapshot | null = null;
  try {
    [r, weather] = await Promise.all([mlPredict(signed.signedUrl), located ? fetchSnapshot(lat, lon).catch(() => null) : Promise.resolve(null)]);
  } catch (e) {
    const err = e instanceof MlError ? e : new MlError("Model service unavailable", 502);
    return fail(err.status, err.message);
  }

  const admin = supabaseAdmin();
  // model_versions is a foreign key; register a version the seed didn't know about instead of failing the scan.
  await admin.from("model_versions").upsert({ version: r.model_version }, { onConflict: "version", ignoreDuplicates: true });

  const { data: scan, error } = await admin
    .from("scans")
    .insert({
      user_id: user.id,
      field_id,
      notes: notes || null,
      image_path,
      predicted_label: r.label,
      confidence: r.confidence,
      probabilities: r.probabilities,
      severity: r.severity,
      model_version: r.model_version,
      model_note: r.note,
      in_domain: r.in_domain,
      latitude: located ? lat : null,
      longitude: located ? lon : null,
      weather,
    })
    .select("id")
    .single();
  if (error || !scan) return fail(500, error?.message ?? "Could not save the scan");

  let forecast: string | null = null;
  if (r.label !== "healthy" && located) {
    try {
      if (field?.latitude != null) {
        const f = await runSpreadForecast(admin, field.id);
        forecast = f.ok ? f.risk_level : f.reason;
      } else {
        const f = await runPointForecast(admin, { scanId: scan.id, disease: r.label, severity: r.severity as Severity, lat, lon });
        forecast = f.risk_level;
      }
    } catch {
      forecast = "failed"; // the diagnosis is saved; the forecast can be refreshed later
    }
  }
  return json({ id: scan.id, forecast });
}
