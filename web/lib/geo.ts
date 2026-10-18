"use client";
// Browser location for a scan. Rounded to 3 decimals (~100 m): enough for weather, kinder to privacy.
export interface Coords {
  lat: number;
  lon: number;
}

export type GeoResult = { ok: true; coords: Coords } | { ok: false; reason: "unsupported" | "denied" | "unavailable" };

export function getPosition(timeoutMs = 10000): Promise<GeoResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve({ ok: false, reason: "unsupported" });
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ ok: true, coords: { lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3) } }),
      (e) => resolve({ ok: false, reason: e.code === e.PERMISSION_DENIED ? "denied" : "unavailable" }),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 10 * 60 * 1000 }
    );
  });
}
