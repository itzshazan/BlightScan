"use client";
// Loaded only on the client via components/map/index.js (Leaflet needs window).
import { useEffect } from "react";
import Link from "next/link";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { riskColor } from "@/components/ui/badge";
import { LABELS, RISK_LABELS } from "@/lib/format";
import type { DiseaseLabel, Field } from "@/lib/types";

type LatLng = [number, number];

/** A field plus the bits the map popup shows. */
export interface MapField extends Field {
  score?: number | null;
  lastLabel?: DiseaseLabel | null;
  updated?: string | null;
}

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const DEFAULT_CENTER: LatLng = [28.16, 77.33]; // Palwal / Faridabad farmland

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [60, 60] });
    else if (points.length === 1) map.setView(points[0], 13);
  }, [map, points]);
  return null;
}

function ClickToPlace({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick([+e.latlng.lat.toFixed(5), +e.latlng.lng.toFixed(5)]) });
  return null;
}

function Recenter({ center, zoom }: { center: LatLng; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? map.getZoom());
  }, [map, center, zoom]);
  return null;
}

/** Single-field pin (field detail) or picker (add field). */
export function PinMap({ value, onChange, zoom = 13, className = "h-72" }: { value: LatLng | null; onChange?: (p: LatLng) => void; zoom?: number; className?: string }) {
  const center = value ?? DEFAULT_CENTER;
  return (
    <MapContainer center={center} zoom={value ? zoom : 10} scrollWheelZoom={!!onChange} className={className}>
      <TileLayer url={TILES} attribution={ATTRIBUTION} />
      {onChange && <ClickToPlace onPick={onChange} />}
      {value && <Recenter center={value} />}
      {value && (
        <>
          <Circle center={value} radius={180} pathOptions={{ color: "#008561", weight: 1, fillOpacity: 0.12 }} />
          <CircleMarker center={value} radius={9} pathOptions={{ color: "#fff", weight: 3, fillColor: "#008561", fillOpacity: 1 }} />
        </>
      )}
    </MapContainer>
  );
}

/** Every located field as a risk-coloured circle; radius grows with score. */
export function RiskMap({ fields, className = "h-[560px]" }: { fields: MapField[]; className?: string }) {
  const located = fields.filter((f): f is MapField & { latitude: number; longitude: number } => f.latitude != null && f.longitude != null);
  const points = located.map((f): LatLng => [f.latitude, f.longitude]);
  return (
    <MapContainer center={points[0] ?? DEFAULT_CENTER} zoom={11} className={className}>
      <TileLayer url={TILES} attribution={ATTRIBUTION} />
      <FitBounds points={points} />
      {located.map((f) => (
        <CircleMarker
          key={f.id}
          center={[f.latitude, f.longitude]}
          radius={10 + (f.score ?? 0) / 4}
          pathOptions={{ color: "#fff", weight: 2, fillColor: riskColor[f.current_risk], fillOpacity: 0.8 }}
        >
          <Popup>
            <div className="min-w-[180px] font-sans">
              <p className="text-[15px] font-semibold">{f.name}</p>
              <p className="mt-1 text-sm" style={{ color: riskColor[f.current_risk] }}>
                {RISK_LABELS[f.current_risk]}
                {f.score != null && ` · score ${f.score}`}
              </p>
              <p className="mt-1 text-xs text-gray-600">Last diagnosis: {f.lastLabel ? LABELS[f.lastLabel] : "No scans yet"}</p>
              {f.updated && <p className="text-xs text-gray-600">Updated {f.updated}</p>}
              <Link href={`/fields/${f.id}`} className="mt-2 inline-block text-sm font-semibold" style={{ color: "#008561" }}>
                Open field →
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
