import type { DiseaseLabel, RiskLevel } from "./types";

export const LABELS: Record<DiseaseLabel, string> = {
  healthy: "Healthy",
  early_blight: "Early Blight",
  late_blight: "Late Blight",
};

export const RISK_LABELS: Record<RiskLevel, string> = { low: "Low risk", medium: "Medium risk", high: "High risk" };

export const RISK_MESSAGES: Record<RiskLevel, string> = {
  low: "Conditions unfavourable for spread. Keep monitoring.",
  medium: "Spread possible. Inspect nearby plants within 3 days.",
  high: "High risk of spread. Remove infected leaves and treat now.",
};

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", opts);
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function relativeDay(iso: string) {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(iso, { day: "numeric", month: "short" });
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function riskFromScore(score: number): RiskLevel {
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
}
