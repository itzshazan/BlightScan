"use client";
// Data layer used by every page. Two backends behind one API:
//   * demo mode (no Supabase keys): an in-browser store in localStorage, seeded by lib/mock-data.ts
//   * Supabase mode: lib/remote.ts (Supabase + /api routes); the store keeps a cached snapshot
// Pages call useDB() for a snapshot and the functions below for changes.
import { useSyncExternalStore } from "react";
import { buildSeed, DEMO_USER_ID } from "./mock-data";
import { demoPredict } from "./predict";
import { predictSpread, type SpreadResult } from "./spread";
import { supabaseEnabled } from "./supabase/env";
import { uuid } from "./utils";
import { getForecast, getSnapshot, type Forecast } from "./weather";
import type { Coords } from "./geo";
import * as remote from "./remote";
import type { AppUser, ContactMessage, DB, DiseaseLabel, Field, Profile, Scan, SpreadPrediction } from "./types";

const KEY = "blightscan-demo-v3"; // bump when the seed changes so browsers reseed
let state: DB | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: DB | null) {
  state = next;
  if (!supabaseEnabled && next) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Quota exceeded (large photos): keep working in memory.
    }
  }
  emit();
}

function loadDemo(): DB {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as DB) : buildSeed();
  } catch {
    state = buildSeed();
  }
  return state;
}

/** Supabase mode: (re)fetch everything the signed-in user can see. */
export function refresh(): Promise<void> {
  if (!supabaseEnabled) return Promise.resolve();
  loading = remote
    .loadAll()
    .then(commit)
    .catch((e) => {
      console.error("Failed to load data", e);
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (supabaseEnabled && !state && !loading) void refresh();
  return () => {
    listeners.delete(l);
  };
}

/** Returns null during SSR / first load so pages render skeletons, then the data. */
export function useDB(): DB | null {
  return useSyncExternalStore<DB | null>(subscribe, supabaseEnabled ? () => state : loadDemo, () => null);
}

/** Forget cached data (e.g. after logout). */
export function clearCache() {
  if (supabaseEnabled) commit(null);
}

const update = (fn: (s: DB) => DB) => commit(fn(structuredClone(loadDemo())));
const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

export function resetDemo() {
  commit(buildSeed());
}

// ---- scans --------------------------------------------------------------
type NewScan = Pick<Scan, "field_id" | "image_path" | "predicted_label" | "confidence" | "probabilities" | "severity" | "model_version" | "notes"> &
  Partial<Pick<Scan, "latitude" | "longitude" | "weather">>;

function createDemoScan(input: NewScan): Scan {
  const scan: Scan = {
    id: uuid(),
    user_id: DEMO_USER_ID,
    review_status: "none",
    expert_label: null,
    expert_note: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date().toISOString(),
    ...input,
  };
  update((s) => ({ ...s, scans: [scan, ...s.scans] }));
  return scan;
}

export interface ScanInput {
  dataUrl: string;
  fieldId: string | null;
  notes: string;
  /** Phone location, used when the field has no pin (or there is no field). */
  coords?: Coords | null;
}

/**
 * Analyse Leaf (spec 4.8): returns the new scan id.
 * Location = the field's pin if it has one, otherwise the phone's. With a location, live weather is saved
 * with the scan and, for a diseased leaf, a 7-day spread forecast is made for that spot.
 * The weather never changes the model's diagnosis.
 * Supabase: upload → POST /api/scans (model + weather + forecast on the server).
 * Demo: colour heuristic in the browser + client-side weather and forecast.
 */
export async function submitScan(input: ScanInput, onStage?: (stage: string) => void): Promise<string> {
  if (supabaseEnabled) {
    onStage?.("Analysing leaf…");
    const id = await remote.submitScan(input);
    await refresh();
    return id;
  }

  const db = loadDemo();
  const field = db.fields.find((f) => f.id === input.fieldId);
  const coords: Coords | null =
    field?.latitude != null && field.longitude != null ? { lat: field.latitude, lon: field.longitude } : (input.coords ?? null);

  onStage?.("Analysing leaf…");
  const [r, weather] = await Promise.all([
    demoPredict(input.dataUrl),
    coords ? getSnapshot(coords.lat, coords.lon) : Promise.resolve(null),
    delay(1400),
  ]);
  const scan = createDemoScan({
    field_id: input.fieldId,
    image_path: input.dataUrl,
    predicted_label: r.label,
    confidence: r.confidence,
    probabilities: r.probabilities,
    severity: r.severity,
    model_version: r.model_version,
    notes: input.notes,
    latitude: coords?.lat ?? null,
    longitude: coords?.lon ?? null,
    weather,
  });

  if (r.label !== "healthy" && coords) {
    onStage?.("Forecasting spread risk…");
    if (field?.latitude != null) await runFieldForecast(field);
    else await runPointForecast(scan, coords);
  }
  return scan.id;
}

/** 7-day forecast for a scan location that isn't a mapped field (field_id stays null). */
async function runPointForecast(scan: Scan, coords: Coords) {
  const hourly = (await getForecast(coords.lat, coords.lon)).hourly;
  const disease = effectiveLabel(scan);
  const out = predictSpread({ disease, severity: scan.severity, recentCases: 0, hourly });
  const prediction: SpreadPrediction = { id: uuid(), created_at: new Date().toISOString(), field_id: null, scan_id: scan.id, disease, ...out };
  update((s) => ({ ...s, spread_predictions: [prediction, ...s.spread_predictions] }));
}

// DELETE /api/scans/[id]
export async function deleteScans(ids: string[]) {
  if (supabaseEnabled) {
    await Promise.all(ids.map(remote.deleteScan));
    return refresh();
  }
  await delay();
  const set = new Set(ids);
  update((s) => ({
    ...s,
    scans: s.scans.filter((x) => !set.has(x.id)),
    spread_predictions: s.spread_predictions.filter((p) => !(p.scan_id && set.has(p.scan_id))),
  }));
}

// PATCH /api/scans/[id]/review
export async function reviewScan(id: string, patch: Partial<Scan>) {
  if (supabaseEnabled) {
    await remote.reviewScan(id, patch);
    return refresh();
  }
  await delay();
  update((s) => ({ ...s, scans: s.scans.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
}

// ---- fields -------------------------------------------------------------
export type FieldInput = Pick<Field, "name" | "variety" | "area_acres" | "planting_date" | "latitude" | "longitude">;

export async function createField(input: FieldInput): Promise<Field> {
  if (supabaseEnabled) {
    const f = await remote.createField(input);
    await refresh();
    return f;
  }
  await delay();
  const field: Field = { id: uuid(), user_id: DEMO_USER_ID, crop: "tomato", current_risk: "low", created_at: new Date().toISOString(), ...input };
  update((s) => ({ ...s, fields: [...s.fields, field] }));
  return field;
}

export async function updateField(id: string, patch: Partial<Field>) {
  if (supabaseEnabled) {
    await remote.updateField(id, patch);
    return refresh();
  }
  await delay();
  update((s) => ({ ...s, fields: s.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
}

// Scans keep their row with field_id = null (on delete set null).
export async function deleteField(id: string) {
  if (supabaseEnabled) {
    await remote.deleteField(id);
    return refresh();
  }
  await delay();
  update((s) => ({
    ...s,
    fields: s.fields.filter((f) => f.id !== id),
    scans: s.scans.map((x) => (x.field_id === id ? { ...x, field_id: null } : x)),
    spread_predictions: s.spread_predictions.filter((p) => p.field_id !== id),
  }));
}

// ---- spread forecast ----------------------------------------------------
const FOURTEEN_DAYS = 14 * 86400000;

export type ForecastOutcome =
  | { ok: true; risk_level: SpreadPrediction["risk_level"]; source?: Forecast["source"] }
  | { ok: false; reason: "no-location" | "no-diseased-scan" | "not-found" };

/** POST /api/fields/[id]/forecast. Demo mode runs lib/spread.ts with live Open-Meteo weather. */
export async function runFieldForecast(field: Field): Promise<ForecastOutcome> {
  if (supabaseEnabled) {
    const r = await remote.runFieldForecast(field.id);
    await refresh();
    return r;
  }
  if (field.latitude == null || field.longitude == null) return { ok: false, reason: "no-location" };
  const db = loadDemo();
  const scans = db.scans.filter((s) => s.field_id === field.id && effectiveLabel(s) !== "healthy").sort((a, b) => b.created_at.localeCompare(a.created_at));
  const latest = scans[0];
  if (!latest) return { ok: false, reason: "no-diseased-scan" };

  const recentCases = scans.filter((s) => Date.now() - new Date(s.created_at).getTime() < FOURTEEN_DAYS).length - 1;
  const weather = await getForecast(field.latitude, field.longitude);
  const disease: DiseaseLabel = effectiveLabel(latest);
  const out: SpreadResult = predictSpread({ disease, severity: latest.severity, recentCases: Math.max(0, recentCases), hourly: weather.hourly });
  const prediction: SpreadPrediction = { id: uuid(), created_at: new Date().toISOString(), field_id: field.id, scan_id: latest.id, disease, ...out };
  update((s) => ({
    ...s,
    spread_predictions: [prediction, ...s.spread_predictions],
    fields: s.fields.map((f) => (f.id === field.id ? { ...f, current_risk: out.risk_level } : f)),
  }));
  return { ok: true, risk_level: out.risk_level, source: weather.source };
}

// ---- profile ------------------------------------------------------------
export async function updateProfile(patch: Partial<Profile>) {
  if (supabaseEnabled) {
    await remote.updateProfile(patch);
    return refresh();
  }
  await delay();
  update((s) => ({
    ...s,
    profile: { ...s.profile, ...patch },
    users: s.users.map((u) => (u.id === s.profile.id ? { ...u, ...pickUserFields(patch) } : u)),
  }));
}

function pickUserFields(p: Partial<Profile>): Partial<AppUser> {
  const out: Partial<AppUser> = {};
  if (p.full_name !== undefined) out.full_name = p.full_name;
  if (p.email !== undefined) out.email = p.email;
  if (p.role !== undefined) out.role = p.role;
  return out;
}

// POST /api/account/delete
export async function deleteAccount() {
  if (supabaseEnabled) {
    await remote.deleteAccount();
    return clearCache();
  }
  await delay(800);
  resetDemo();
}

// ---- admin --------------------------------------------------------------
// PATCH /api/admin/users/[id]
export async function updateUser(id: string, patch: Partial<AppUser>) {
  if (supabaseEnabled) {
    await remote.updateUser(id, patch);
    return refresh();
  }
  await delay();
  update((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
}

// insert into contact_messages (works signed out too)
export async function sendContactMessage(msg: Pick<ContactMessage, "name" | "email" | "subject" | "message">) {
  if (supabaseEnabled) return remote.sendContactMessage(msg);
  await delay(700);
  update((s) => ({
    ...s,
    contact_messages: [{ id: uuid(), is_read: false, created_at: new Date().toISOString(), ...msg }, ...s.contact_messages],
  }));
}

export async function updateMessage(id: string, patch: Partial<ContactMessage>) {
  if (supabaseEnabled) {
    await remote.updateMessage(id, patch);
    return refresh();
  }
  await delay(250);
  update((s) => ({ ...s, contact_messages: s.contact_messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
}

export async function deleteMessage(id: string) {
  if (supabaseEnabled) {
    await remote.deleteMessage(id);
    return refresh();
  }
  await delay();
  update((s) => ({ ...s, contact_messages: s.contact_messages.filter((m) => m.id !== id) }));
}

// ---- selectors ----------------------------------------------------------
export const latestSpread = (db: DB, fieldId: string): SpreadPrediction | null =>
  db.spread_predictions.filter((p) => p.field_id === fieldId).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;

/** Forecast made for this scan, else the field's latest (a newer scan may have refreshed it). */
export const scanSpread = (db: DB, scan: Scan): SpreadPrediction | null =>
  db.spread_predictions.find((p) => p.scan_id === scan.id && p.field_id === null) ?? (scan.field_id ? latestSpread(db, scan.field_id) : null);

export const fieldScans = (db: DB, fieldId: string) => db.scans.filter((s) => s.field_id === fieldId);

export const effectiveLabel = (scan: Scan): DiseaseLabel => scan.expert_label ?? scan.predicted_label;

/** Scans/fields for the expert review queue and admin pages (all users in Supabase mode). */
export const staffView = (db: DB) => db.staff ?? { scans: db.scans, fields: db.fields };
