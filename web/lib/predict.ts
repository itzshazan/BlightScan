// Client-side helpers for the scan flow.
// `demoPredict` stands in for FastAPI /predict in demo mode: a colour heuristic, NOT the real model.
import type { DiseaseLabel, Severity } from "./types";

export interface Prediction {
  label: DiseaseLabel;
  confidence: number;
  probabilities: Record<DiseaseLabel, number>;
  severity: Severity;
  model_version: string;
  inference_ms: number;
}

/** Step 1 of Analyse Leaf: resize to max 1024 px and re-encode as JPEG. */
export function compressImage(file: File, maxSize = 1024, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = url;
  });
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max];
}

export function demoPredict(dataUrl: string): Promise<Prediction> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const t0 = performance.now();
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 64, 64);
      const px = ctx.getImageData(0, 0, 64, 64).data;
      let green = 0,
        brown = 0,
        dark = 0,
        leaf = 0;
      for (let i = 0; i < px.length; i += 4) {
        const [h, s, v] = rgbToHsv(px[i], px[i + 1], px[i + 2]);
        if (s < 0.15 && v > 0.75) continue; // background
        leaf++;
        if (v < 0.28) dark++;
        else if (h >= 65 && h <= 170 && s > 0.2) green++;
        else if (h >= 10 && h < 65 && s > 0.25) brown++;
      }
      const n = Math.max(1, leaf);
      const raw: Record<DiseaseLabel, number> = { healthy: (green / n) * 4, early_blight: (brown / n) * 6 + 0.2, late_blight: (dark / n) * 7 + 0.1 };
      const labels = Object.keys(raw) as DiseaseLabel[];
      const sum = labels.reduce((a, k) => a + Math.exp(raw[k]), 0);
      const probabilities = Object.fromEntries(labels.map((k) => [k, +(Math.exp(raw[k]) / sum).toFixed(4)])) as Record<DiseaseLabel, number>;
      const label = labels.sort((a, b) => probabilities[b] - probabilities[a])[0];
      const confidence = +(probabilities[label] * 100).toFixed(2);
      resolve({
        label,
        confidence,
        probabilities,
        severity: label === "healthy" ? "low" : confidence > 85 ? "high" : "moderate",
        model_version: "demo-heuristic",
        inference_ms: Math.round(performance.now() - t0),
      });
    };
    img.src = dataUrl;
  });
}
