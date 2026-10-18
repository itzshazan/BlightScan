// Demo seed used until Supabase is connected. Dates are generated relative to "now" so the
// dashboard always looks current. Nothing here is shown as a real measured result.
import { predictSpread } from "./spread";
import { snapshotFromHourly, syntheticForecast } from "./weather";
import type { AppUser, ContactMessage, DB, DiseaseLabel, Field, Profile, Scan, Severity, SpreadPrediction } from "./types";

export const DEMO_USER_ID = "demo-farmer";

const day = 86400000;
const ago = (d: number, h = 10) => new Date(Date.now() - d * day + (h - 10) * 3600000).toISOString();

function probs(label: DiseaseLabel, conf: number): Record<DiseaseLabel, number> {
  const rest = (100 - conf) / 100;
  const others = (["healthy", "early_blight", "late_blight"] as const).filter((l) => l !== label);
  const split = [rest * 0.68, rest * 0.32];
  return {
    [label]: +(conf / 100).toFixed(4),
    [others[0]]: +split[0].toFixed(4),
    [others[1]]: +split[1].toFixed(4),
  } as Record<DiseaseLabel, number>;
}

// Demo scans show the site's illustrative photos, rotated so neighbouring rows differ.
const DEMO_PHOTOS: Record<DiseaseLabel, string[]> = {
  healthy: ["/images/detect-healthy.webp"],
  early_blight: ["/images/detect-early-blight.webp", "/images/early-blight-2.webp", "/images/hero.webp"],
  late_blight: ["/images/detect-late-blight.webp", "/images/late-blight-2.webp"],
};
const demoPhoto = (id: string, label: DiseaseLabel) => {
  const pool = DEMO_PHOTOS[label];
  return pool[[...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % pool.length];
};

function scan(id: string, field_id: string | null, label: DiseaseLabel, conf: number, daysAgo: number, extra: Partial<Scan> = {}): Scan {
  return {
    id,
    user_id: DEMO_USER_ID,
    field_id,
    image_path: null,
    image_url: demoPhoto(id, label),
    predicted_label: label,
    confidence: conf,
    probabilities: probs(label, conf),
    severity: label === "healthy" ? "low" : conf > 85 ? "high" : "moderate",
    notes: "",
    model_version: "v1.0",
    review_status: "none",
    expert_label: null,
    expert_note: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: ago(daysAgo, 8 + (daysAgo % 9)),
    ...extra,
  };
}

type SeedField = Pick<Field, "id" | "name" | "variety" | "area_acres" | "planting_date" | "latitude" | "longitude">;

export function buildSeed(): DB {
  const seedFields: SeedField[] = [
    { id: "f-north", name: "North Plot", variety: "Pusa Ruby", area_acres: 2.5, planting_date: "2026-08-20", latitude: 28.1612, longitude: 77.3285 },
    { id: "f-canal", name: "Canal-side Field", variety: "Arka Rakshak", area_acres: 1.8, planting_date: "2026-08-28", latitude: 28.1755, longitude: 77.2964 },
    { id: "f-south", name: "South Terrace", variety: "", area_acres: 3.2, planting_date: "2026-09-05", latitude: 28.1268, longitude: 77.3612 },
    { id: "f-nursery", name: "Nursery Beds", variety: "Mixed seedlings", area_acres: 0.3, planting_date: "2026-09-25", latitude: null, longitude: null },
  ];
  const fields: Field[] = seedFields.map((f) => ({ ...f, user_id: DEMO_USER_ID, crop: "tomato", current_risk: "low", created_at: ago(60) }));

  const scans: Scan[] = [
    scan("s-101", "f-north", "late_blight", 87.6, 0, { notes: "Dark patches on upper leaves after two foggy mornings." }),
    scan("s-102", "f-north", "early_blight", 91.4, 1, { notes: "Lower leaves, ringed spots." }),
    scan("s-103", "f-canal", "healthy", 96.2, 2),
    scan("s-104", "f-south", "early_blight", 54.1, 3, { review_status: "requested", notes: "Not sure — could be sunscald." }),
    scan("s-105", "f-canal", "early_blight", 78.9, 5),
    scan("s-106", "f-nursery", "healthy", 98.1, 6),
    scan("s-107", "f-south", "healthy", 93.5, 9),
    scan("s-108", "f-north", "early_blight", 88.2, 11, {
      review_status: "reviewed",
      expert_label: "early_blight",
      expert_note: "Confirmed. Classic concentric lesions; start protectant spray.",
      reviewed_by: "demo-expert",
      reviewed_at: ago(10),
    }),
    scan("s-109", "f-canal", "healthy", 95.0, 14),
    scan("s-110", null, "healthy", 89.7, 17),
    scan("s-111", "f-south", "late_blight", 58.3, 20, { review_status: "requested" }),
    scan("s-112", "f-north", "healthy", 97.4, 24),
    scan("s-113", "f-canal", "healthy", 94.8, 29),
    scan("s-114", "f-south", "early_blight", 83.0, 33),
    scan("s-115", "f-north", "healthy", 96.9, 38),
    scan("s-116", "f-nursery", "healthy", 92.2, 45),
  ];

  // Weather at photo time for scans in located fields (illustrative, from the synthetic generator).
  for (const sc of scans) {
    const fl = fields.find((x) => x.id === sc.field_id);
    if (fl?.latitude == null || fl.longitude == null) continue;
    const humid = sc.predicted_label === "late_blight" || fl.id === "f-north";
    const f = syntheticForecast(sc.id.length * 31 + sc.created_at.charCodeAt(9), new Date(sc.created_at), humid ? "humid" : "dry");
    sc.latitude = fl.latitude;
    sc.longitude = fl.longitude;
    sc.weather = { ...snapshotFromHourly(f.hourly.slice(0, 24), f.current, "synthetic"), captured_at: sc.created_at };
  }

  // Spread forecasts for located fields with a recent diseased scan.
  const spread_predictions: SpreadPrediction[] = [];
  const plan: { field: string; scan: string; disease: DiseaseLabel; severity: Severity; recent: number; seed: number; profile: "humid" | "dry" }[] = [
    { field: "f-north", scan: "s-101", disease: "late_blight", severity: "high", recent: 4, seed: 11, profile: "humid" },
    { field: "f-canal", scan: "s-105", disease: "early_blight", severity: "moderate", recent: 1, seed: 7, profile: "dry" },
    { field: "f-south", scan: "s-104", disease: "early_blight", severity: "moderate", recent: 0, seed: 3, profile: "dry" },
  ];
  for (const p of plan) {
    const { hourly } = syntheticForecast(p.seed, new Date(), p.profile);
    const out = predictSpread({ disease: p.disease, severity: p.severity, recentCases: p.recent, hourly });
    spread_predictions.push({ id: `sp-${p.field}`, field_id: p.field, scan_id: p.scan, disease: p.disease, ...out, created_at: ago(0, 7) });
    const f = fields.find((x) => x.id === p.field);
    if (f) f.current_risk = out.risk_level;
  }

  const profile: Profile = {
    id: DEMO_USER_ID,
    full_name: "Shazan Khan",
    email: "farmer@demo.blightscan",
    role: "farmer",
    phone: "",
    state: "Haryana",
    district: "Palwal",
    language: "en",
    avatar_url: null,
    notify_email: true,
    notify_weekly: false,
    status: "active",
    created_at: ago(70),
  };

  const users: AppUser[] = [
    { id: profile.id, full_name: profile.full_name, email: profile.email, role: profile.role, created_at: profile.created_at, status: "active", scans: scans.length },
    { id: "demo-expert", full_name: "Dr. Expert (demo)", email: "expert@demo.blightscan", role: "expert", scans: 0, status: "active", created_at: ago(90) },
    { id: "demo-admin", full_name: "Admin (demo)", email: "admin@demo.blightscan", role: "admin", scans: 0, status: "active", created_at: ago(95) },
    { id: "u-4", full_name: "Demo Farmer B", email: "farmer.b@demo.blightscan", role: "farmer", scans: 8, status: "active", created_at: ago(40) },
    { id: "u-5", full_name: "Demo Farmer C", email: "farmer.c@demo.blightscan", role: "farmer", scans: 3, status: "deactivated", created_at: ago(22) },
  ];

  const contact_messages: ContactMessage[] = [
    { id: "m-1", name: "Demo Sender A", email: "sender.a@example.com", subject: "Bug report", message: "Camera tab opens the gallery on my phone instead of the camera. Using Chrome on Android.", is_read: false, created_at: ago(1, 14) },
    { id: "m-2", name: "Demo Sender B", email: "sender.b@example.com", subject: "Collaboration", message: "We run a farmer producer organisation and would like to pilot this with a few growers next season.", is_read: false, created_at: ago(3, 11) },
    { id: "m-3", name: "Demo Sender C", email: "sender.c@example.com", subject: "Feedback", message: "The spread forecast chart is useful. Could it also show rainfall per day?", is_read: true, created_at: ago(8, 16) },
  ];

  return { version: 1, profile, fields, scans, spread_predictions, users, contact_messages };
}
