// Mirrors the Supabase schema in spec section 5.1. Replace with `supabase gen types typescript` output later.
export type UserRole = "farmer" | "expert" | "admin";
export type DiseaseLabel = "healthy" | "early_blight" | "late_blight";
export type RiskLevel = "low" | "medium" | "high";
export type ReviewStatus = "none" | "requested" | "reviewed";
export type Severity = "low" | "moderate" | "high";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string;
  state?: string;
  district?: string;
  language?: string;
  avatar_url?: string | null;
  notify_email: boolean;
  notify_weekly: boolean;
  status?: "active" | "deactivated";
  created_at: string;
}

export interface Field {
  id: string;
  user_id: string;
  name: string;
  crop: "tomato";
  variety?: string;
  area_acres: number;
  planting_date?: string | null;
  latitude: number | null;
  longitude: number | null;
  current_risk: RiskLevel;
  created_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  field_id: string | null;
  image_path: string | null; // data URL in demo mode, storage path in leaf-images with Supabase
  image_url?: string | null; // signed URL for display (Supabase mode)
  predicted_label: DiseaseLabel;
  confidence: number;
  probabilities: Record<DiseaseLabel, number>;
  severity: Severity;
  diseased_area?: number | null; // % of the leaf with lesions (colour-based estimate)
  severity_reliable?: boolean | null; // false: busy background or not one leaf, so the area is rough
  lesion_mask?: string | null; // transparent PNG data URL marking lesions, same framing as the photo
  notes?: string;
  model_version: string;
  model_note?: string | null; // why the model is unsure, e.g. "looks most like Septoria leaf spot"
  in_domain?: boolean | null;
  latitude?: number | null; // where the photo was taken (field pin or phone GPS, ~100 m precision)
  longitude?: number | null;
  weather?: WeatherSnapshot | null; // live conditions when the photo was taken
  review_status: ReviewStatus;
  expert_label?: DiseaseLabel | null;
  expert_note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

/** Weather at the scan location when the photo was taken: now, plus the previous 24 hours. */
export interface WeatherSnapshot {
  captured_at: string;
  source: "open-meteo" | "synthetic";
  temperature: number;
  humidity: number;
  rain_24h: number;
  humid_hours_24h: number; // hours with RH ≥ 90%
  early_hours_24h: number; // hours in the early-blight band (24–29 °C and wet)
  late_hours_24h: number; // hours in the late-blight band (10–25 °C and wet)
  favours: "early_blight" | "late_blight" | null;
}

export interface ForecastPoint { date: string; score: number }
export interface DailyWeather { date: string; temp_max: number; temp_min: number; humidity_mean: number; rain_mm: number; wet_hours: number }

export interface SpreadPrediction {
  id: string;
  field_id: string | null; // null when forecast for a scan location without a field
  scan_id: string | null;
  disease: DiseaseLabel;
  risk_level: RiskLevel;
  risk_score: number;
  forecast: ForecastPoint[];
  summary: string;
  weather: DailyWeather[];
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AppUser extends Pick<Profile, "id" | "full_name" | "email" | "role" | "created_at"> {
  scans: number;
  status: "active" | "deactivated";
}

/** Shape of the demo store; each key maps to a Supabase table. */
export interface DB {
  version: number;
  profile: Profile;
  fields: Field[];
  scans: Scan[];
  spread_predictions: SpreadPrediction[];
  users: AppUser[];
  contact_messages: ContactMessage[];
  /** Expert/admin only, Supabase mode: every user's scans and fields for the review queue. */
  staff?: { scans: Scan[]; fields: Field[] };
}
