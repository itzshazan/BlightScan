"use client";
import { useId, useMemo } from "react";
import type { DiseaseLabel, Scan } from "@/lib/types";

// Procedural tomato leaflet illustration used wherever there is no real photo yet
// (seeded demo scans, disease cards, empty states). Variants match the three model classes.

const H = 280;
const BASE_Y = 258;
const TIP_Y = 16;

function rng(seed: number) {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

const halfWidth = (t: number) => 78 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.85);
const midX = (t: number) => 100 + 7 * Math.sin(Math.PI * t);
const yAt = (t: number) => BASE_Y - t * (BASE_Y - TIP_Y);

function outline() {
  const N = 140;
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const phase = (t * 10.5) % 1;
    const tooth = phase < 0.72 ? phase / 0.72 : (1 - phase) / 0.28;
    const w = halfWidth(t) * (0.93 + 0.09 * tooth);
    left.push([midX(t) - w, yAt(t)]);
    right.push([midX(t) + w * 0.95, yAt(t)]);
  }
  const pts = [...left, ...right.reverse()];
  return "M" + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") + "Z";
}

function veins() {
  const out: string[] = [];
  for (let k = 0; k < 8; k++) {
    const t = 0.1 + k * 0.1;
    const x0 = midX(t);
    const y0 = yAt(t);
    const t1 = Math.min(0.97, t + 0.09);
    for (const side of [-1, 1]) {
      const w = halfWidth(t1) * 0.86 * (side > 0 ? 0.95 : 1);
      const x1 = midX(t1) + side * w;
      const y1 = yAt(t1);
      const cx = x0 + side * w * 0.45;
      const cy = (y0 + y1) / 2 + 6;
      out.push(`M${x0.toFixed(1)},${y0.toFixed(1)}Q${cx.toFixed(1)},${cy.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`);
    }
  }
  return out;
}

function blob(cx: number, cy: number, r: number, rand: () => number) {
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.7 + rand() * 0.55);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[(i + 1) % n];
    const q = pts[(i + 2) % n];
    d += `Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${((p[0] + q[0]) / 2).toFixed(1)},${((p[1] + q[1]) / 2).toFixed(1)}`;
  }
  return d + "Z";
}

const PALETTE: Record<DiseaseLabel, [string, string, string]> = {
  healthy: ["#4fa55a", "#2f7a3e", "#cde8b5"],
  early_blight: ["#8aac4c", "#55893c", "#e3efc3"],
  late_blight: ["#6f9450", "#4a7238", "#d5e3c0"],
};

interface Lesion {
  x: number;
  y: number;
  r: number;
  d?: string;
  halo?: string;
}

export function LeafArt({ variant = "healthy", seed = 1, className, title }: { variant?: DiseaseLabel; seed?: number; className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  const shape = useMemo(outline, []);
  const veinPaths = useMemo(veins, []);

  const lesions = useMemo<Lesion[]>(() => {
    const rand = rng(seed + (variant === "late_blight" ? 50 : 0));
    const spot = (tMin: number, tMax: number, edge: boolean) => {
      const t = tMin + rand() * (tMax - tMin);
      const side = rand() > 0.5 ? 1 : -1;
      const off = halfWidth(t) * (edge ? 0.55 + rand() * 0.35 : 0.2 + rand() * 0.5);
      return { x: midX(t) + side * off, y: yAt(t) };
    };
    if (variant === "early_blight") {
      return Array.from({ length: 7 }, () => ({ ...spot(0.08, 0.7, false), r: 5 + rand() * 7 }));
    }
    if (variant === "late_blight") {
      return Array.from({ length: 4 }, (_, i) => {
        const p = spot(i === 0 ? 0.75 : 0.2, i === 0 ? 0.92 : 0.8, true);
        return { ...p, r: 14 + rand() * 14, d: blob(p.x, p.y, 14 + rand() * 14, rand), halo: blob(p.x, p.y, 24 + rand() * 12, rand) };
      });
    }
    return [];
  }, [variant, seed]);

  const [c1, c2, vein] = PALETTE[variant] ?? PALETTE.healthy;

  return (
    <svg viewBox={`0 0 200 ${H}`} className={className} role="img" aria-label={title ?? `Illustration of a ${variant.replace("_", " ")} tomato leaf`}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <clipPath id={`c${id}`}>
          <path d={shape} />
        </clipPath>
        <radialGradient id={`h${id}`}>
          <stop offset="0.45" stopColor="#e8cf5e" stopOpacity="0.85" />
          <stop offset="1" stopColor="#e8cf5e" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path d={`M${midX(0)},${BASE_Y} L${midX(0) - 2},${H}`} stroke={c2} strokeWidth="5" strokeLinecap="round" />
      <path d={shape} fill={`url(#g${id})`} />

      <g clipPath={`url(#c${id})`}>
        {variant === "early_blight" && <path d={shape} fill="#e3c75a" opacity="0.18" />}
        {veinPaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={vein} strokeOpacity="0.45" strokeWidth="1.3" strokeLinecap="round" />
        ))}

        {variant === "early_blight" &&
          lesions.map((l, i) => (
            <g key={i}>
              <circle cx={l.x} cy={l.y} r={l.r * 2.1} fill={`url(#h${id})`} />
              <circle cx={l.x} cy={l.y} r={l.r} fill="#6a4524" />
              <circle cx={l.x} cy={l.y} r={l.r * 0.72} fill="none" stroke="#3b2614" strokeWidth="1.1" />
              <circle cx={l.x} cy={l.y} r={l.r * 0.44} fill="none" stroke="#3b2614" strokeWidth="1" />
              <circle cx={l.x} cy={l.y} r={l.r * 0.16} fill="#2e1d0f" />
            </g>
          ))}

        {variant === "late_blight" &&
          lesions.map((l, i) => (
            <g key={i}>
              <path d={l.halo} fill="#9fae6a" opacity="0.55" />
              <path d={l.d} fill="#3d3b26" opacity="0.92" />
              {i === 1 && <path d={l.halo} fill="none" stroke="#f4f1e6" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="1 3" />}
            </g>
          ))}
      </g>

      <path d={`M${midX(0)},${BASE_Y} Q${midX(0.5) + 2},${yAt(0.5)} ${midX(0.98)},${yAt(0.98)}`} fill="none" stroke={vein} strokeOpacity="0.75" strokeWidth="2" />
    </svg>
  );
}

/** Displayable photo URL: signed URL (Supabase) or inline data URL (demo). */
export function scanImageSrc(scan: Scan): string | null {
  if (scan.image_url) return scan.image_url;
  return scan.image_path?.startsWith("data:") ? scan.image_path : null;
}

/** Thumbnail: real photo when present, otherwise the illustration. */
export function ScanImage({ scan, className, imgClassName }: { scan: Scan; className?: string; imgClassName?: string }) {
  const src = scanImageSrc(scan);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="Leaf photo" className={imgClassName ?? "h-full w-full object-cover"} />;
  }
  const seed = [...scan.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <div className={className ?? "grid h-full w-full place-items-center bg-sunken"}>
      <LeafArt variant={scan.predicted_label} seed={seed} className="h-[88%] w-auto" />
    </div>
  );
}
