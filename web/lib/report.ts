"use client";
// Download Report (PDF), generated client-side with jsPDF (spec 4.9).
import { LABELS, RISK_LABELS, affectedArea, formatDateTime } from "./format";
import { getByLabel } from "./diseases";
import type { DiseaseLabel, Field, Scan, SpreadPrediction } from "./types";

interface ReportInput {
  scan: Scan;
  field?: Field | null;
  spread?: SpreadPrediction | null;
  label: DiseaseLabel;
}

/** jsPDF needs a data URL; signed Supabase URLs are fetched and converted. */
async function imageDataUrl(scan: Scan): Promise<string | null> {
  if (scan.image_path?.startsWith("data:")) return scan.image_path;
  if (!scan.image_url) return null;
  try {
    const blob = await (await fetch(scan.image_url)).blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadScanReport({ scan, field, spread, label }: ReportInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = M;

  doc.setFillColor(3, 28, 23);
  doc.rect(0, 0, W, 84, "F");
  doc.setTextColor(230, 255, 248);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("BlightScan · Scan report", M, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(formatDateTime(scan.created_at), W - M, 50, { align: "right" });
  y = 120;

  const image = await imageDataUrl(scan);
  if (image) {
    try {
      doc.addImage(image, "JPEG", M, y, 180, 180, undefined, "FAST");
    } catch {}
  }
  const x = image ? M + 200 : M;
  doc.setTextColor(21, 55, 44);
  doc.setFontSize(11);
  doc.text("Diagnosis", x, y + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(LABELS[label], x, y + 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = [
    `Confidence: ${scan.confidence}%`,
    `Severity: ${scan.severity}${affectedArea(scan) != null ? ` (about ${affectedArea(scan)}% of the leaf affected)` : ""}`,
    `Field: ${field?.name ?? "No field"}`,
    `Model: ${scan.model_version}`,
    ...(Object.entries(scan.probabilities) as [DiseaseLabel, number][]).map(([k, v]) => `${LABELS[k]}: ${(v * 100).toFixed(1)}%`),
  ];
  lines.forEach((l, i) => doc.text(l, x, y + 66 + i * 16));
  if (scan.expert_label) doc.text(`Reviewed by expert: ${LABELS[scan.expert_label]}`, x, y + 66 + lines.length * 16);
  if (scan.weather) {
    const w = scan.weather;
    doc.text(`When photographed: ${Math.round(w.temperature)}°C, ${w.humidity}% RH, ${w.rain_24h} mm rain in 24 h`, x, y + 66 + (lines.length + 1) * 16);
  }
  y += 220;

  if (spread) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`Spread forecast: ${RISK_LABELS[spread.risk_level]} (${spread.risk_score}/100)`, M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 16;
    doc.text(doc.splitTextToSize(spread.summary, W - 2 * M), M, y);
    y += 18;
    doc.text(spread.forecast.map((p) => `${p.date.slice(5)}: ${p.score}`).join("   "), M, y);
    y += 30;
  }

  const info = getByLabel(label);
  const section = (title: string, items: string[]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, M, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    items.forEach((t) => {
      const wrapped: string[] = doc.splitTextToSize(`•  ${t}`, W - 2 * M);
      if (y + wrapped.length * 13 > 790) {
        doc.addPage();
        y = M;
      }
      doc.text(wrapped, M, y);
      y += wrapped.length * 13 + 3;
    });
    y += 12;
  };
  section("Organic & cultural", info.treatment_organic);
  section("Chemical options", info.treatment_chemical);
  if (info.prevention) section("Prevention", info.prevention);

  doc.setFontSize(8);
  doc.setTextColor(82, 107, 99);
  doc.text("Decision support only. Confirm with your local KVK or extension officer before treating.", M, 815);
  doc.save(`blightscan-${scan.id.slice(0, 8)}.pdf`);
}
