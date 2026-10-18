"use client";
// Supabase implementation of the data layer. lib/store.ts calls these when Supabase is configured.
// Reads go straight to Supabase (RLS scopes them); writes that must be trusted go through /api routes.
import { supabaseBrowser } from "./supabase/client";
import { AVATAR_BUCKET, LEAF_BUCKET } from "./supabase/env";
import { uuid } from "./utils";
import type { AppUser, ContactMessage, DB, Field, Profile, Scan, SpreadPrediction } from "./types";
import type { FieldInput, ScanInput } from "./store";

const sb = () => supabaseBrowser();

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body as T;
}

function must<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

const num = (v: unknown) => (v == null ? null : Number(v)); // numeric columns arrive as strings

function toScan(r: Record<string, unknown>): Scan {
  return { ...(r as unknown as Scan), confidence: Number(r.confidence), latitude: num(r.latitude), longitude: num(r.longitude) };
}
function toField(r: Record<string, unknown>): Field {
  return { ...(r as unknown as Field), area_acres: Number(r.area_acres), latitude: num(r.latitude), longitude: num(r.longitude) };
}
function toSpread(r: Record<string, unknown>): SpreadPrediction {
  return { ...(r as unknown as SpreadPrediction), risk_score: Number(r.risk_score), weather: (r.weather as SpreadPrediction["weather"]) ?? [] };
}

/** Attach 1-hour signed URLs so <img> can show private leaf photos. */
async function signImages(scans: Scan[]) {
  const paths = [...new Set(scans.map((s) => s.image_path).filter((p): p is string => !!p))];
  if (!paths.length) return;
  const { data } = await sb().storage.from(LEAF_BUCKET).createSignedUrls(paths, 3600);
  const byPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  scans.forEach((s) => (s.image_url = s.image_path ? (byPath.get(s.image_path) ?? null) : null));
}

export async function loadAll(): Promise<DB | null> {
  const {
    data: { user },
  } = await sb().auth.getUser();
  if (!user) return null;

  const profileRow = must(await sb().from("profiles").select("*").eq("id", user.id).single()) as Profile;
  const profile: Profile = { ...profileRow, email: profileRow.email ?? user.email ?? "" };
  const staff = profile.role === "expert" || profile.role === "admin";

  const [fieldsRes, scansRes, spreadRes] = await Promise.all([
    sb().from("fields").select("*").eq("user_id", user.id).order("created_at"),
    sb().from("scans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    // RLS returns forecasts for the user's fields and scans (staff also see everyone's; filtered below).
    sb().from("spread_predictions").select("*").order("created_at", { ascending: false }).limit(500),
  ]);
  const fields = must(fieldsRes).map(toField);
  const scans = must(scansRes).map(toScan);
  const ownFields = new Set(fields.map((f) => f.id));
  const ownScans = new Set(scans.map((s) => s.id));
  const spread_predictions = must(spreadRes)
    .map(toSpread)
    .filter((p) => (p.field_id ? ownFields.has(p.field_id) : !!p.scan_id && ownScans.has(p.scan_id)));

  let staffData: DB["staff"];
  let users: AppUser[] = [];
  let contact_messages: ContactMessage[] = [];
  if (staff) {
    const [allScans, allFields] = await Promise.all([
      sb().from("scans").select("*").order("created_at", { ascending: false }).limit(1000),
      sb().from("fields").select("*"),
    ]);
    staffData = { scans: must(allScans).map(toScan), fields: must(allFields).map(toField) };
    await signImages(staffData.scans);
  }
  if (profile.role === "admin") {
    const [profiles, messages] = await Promise.all([
      sb().from("profiles").select("id, full_name, email, role, status, created_at").order("created_at"),
      sb().from("contact_messages").select("*").order("created_at", { ascending: false }),
    ]);
    const counts = new Map<string, number>();
    staffData?.scans.forEach((s) => counts.set(s.user_id, (counts.get(s.user_id) ?? 0) + 1));
    users = must(profiles).map((p) => ({ ...(p as AppUser), full_name: p.full_name ?? p.email ?? "—", scans: counts.get(p.id) ?? 0 }));
    contact_messages = must(messages) as ContactMessage[];
  }

  await signImages(scans);
  return { version: 1, profile, fields, scans, spread_predictions, users, contact_messages, staff: staffData };
}

// ---- scans --------------------------------------------------------------
/** Upload to leaf-images/{user_id}/{uuid}.jpg, then POST /api/scans (which calls the ML service). */
export async function submitScan({ dataUrl, fieldId, notes, coords }: ScanInput): Promise<string> {
  const {
    data: { user },
  } = await sb().auth.getUser();
  if (!user) throw new Error("Your session has expired. Log in again.");
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${user.id}/${uuid()}.jpg`;
  must(await sb().storage.from(LEAF_BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false }));
  try {
    const { id } = await api<{ id: string }>("/api/scans", {
      method: "POST",
      body: JSON.stringify({ image_path: path, field_id: fieldId, notes, latitude: coords?.lat ?? null, longitude: coords?.lon ?? null }),
    });
    return id;
  } catch (e) {
    await sb().storage.from(LEAF_BUCKET).remove([path]); // don't leave orphaned photos
    throw e;
  }
}

export async function deleteScan(id: string) {
  await api(`/api/scans/${id}`, { method: "DELETE" });
}

export async function reviewScan(id: string, patch: Partial<Scan>) {
  const body = patch.review_status === "requested" ? { action: "request" } : { expert_label: patch.expert_label, expert_note: patch.expert_note };
  await api(`/api/scans/${id}/review`, { method: "PATCH", body: JSON.stringify(body) });
}

// ---- fields -------------------------------------------------------------
export async function createField(input: FieldInput): Promise<Field> {
  const {
    data: { user },
  } = await sb().auth.getUser();
  if (!user) throw new Error("Your session has expired. Log in again.");
  return toField(must(await sb().from("fields").insert({ ...input, user_id: user.id }).select("*").single()));
}

export async function updateField(id: string, patch: Partial<Field>) {
  const { id: _id, user_id: _u, current_risk: _r, created_at: _c, ...allowed } = patch;
  must(await sb().from("fields").update(allowed).eq("id", id).select("id"));
}

export async function deleteField(id: string) {
  must(await sb().from("fields").delete().eq("id", id).select("id"));
}

export type RemoteForecast = { ok: true; risk_level: SpreadPrediction["risk_level"] } | { ok: false; reason: "no-location" | "no-diseased-scan" | "not-found" };
export const runFieldForecast = (fieldId: string) => api<RemoteForecast>(`/api/fields/${fieldId}/forecast`, { method: "POST" });

// ---- profile ------------------------------------------------------------
export async function updateProfile(patch: Partial<Profile>) {
  const {
    data: { user },
  } = await sb().auth.getUser();
  if (!user) throw new Error("Your session has expired. Log in again.");
  const { id: _i, role: _r, status: _s, email: _e, created_at: _c, ...allowed } = patch;

  if (typeof allowed.avatar_url === "string" && allowed.avatar_url.startsWith("data:")) {
    const blob = await (await fetch(allowed.avatar_url)).blob();
    const path = `${user.id}/avatar.jpg`;
    must(await sb().storage.from(AVATAR_BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: true }));
    const { data } = sb().storage.from(AVATAR_BUCKET).getPublicUrl(path);
    allowed.avatar_url = `${data.publicUrl}?v=${Date.now()}`; // bust the CDN cache after a change
  } else if (allowed.avatar_url === null) {
    await sb().storage.from(AVATAR_BUCKET).remove([`${user.id}/avatar.jpg`]);
  }
  must(await sb().from("profiles").update(allowed).eq("id", user.id).select("id"));
}

export async function deleteAccount() {
  await api("/api/account/delete", { method: "POST" });
  await sb().auth.signOut();
}

// ---- admin --------------------------------------------------------------
export async function updateUser(id: string, patch: Partial<AppUser>) {
  await api(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role: patch.role, status: patch.status }) });
}

export async function sendContactMessage(msg: Pick<ContactMessage, "name" | "email" | "subject" | "message">) {
  must(await sb().from("contact_messages").insert(msg));
}

export async function updateMessage(id: string, patch: Partial<ContactMessage>) {
  must(await sb().from("contact_messages").update({ is_read: patch.is_read }).eq("id", id).select("id"));
}

export async function deleteMessage(id: string) {
  must(await sb().from("contact_messages").delete().eq("id", id).select("id"));
}
