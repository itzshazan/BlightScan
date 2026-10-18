import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LABELS, RISK_LABELS } from "@/lib/format";
import type { DiseaseLabel, RiskLevel } from "@/lib/types";

const labelTone: Record<DiseaseLabel, string> = {
  healthy: "bg-healthy-soft text-healthy",
  early_blight: "bg-early-soft text-early",
  late_blight: "bg-late-soft text-late",
};
const riskTone: Record<RiskLevel, string> = {
  low: "bg-healthy-soft text-healthy",
  medium: "bg-early-soft text-early",
  high: "bg-late-soft text-late",
};

export function Badge({ className, children, dot, tone = "bg-ink/5 text-ink" }: { className?: string; children: ReactNode; dot?: boolean; tone?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold tracking-normal", tone, className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function ResultBadge({ label, className }: { label: DiseaseLabel; className?: string }) {
  return (
    <Badge dot tone={labelTone[label]} className={className}>
      {LABELS[label]}
    </Badge>
  );
}

export function RiskBadge({ risk, className, short }: { risk: RiskLevel; className?: string; short?: boolean }) {
  return (
    <Badge dot tone={riskTone[risk]} className={className}>
      {short ? risk[0].toUpperCase() + risk.slice(1) : RISK_LABELS[risk]}
    </Badge>
  );
}

// Fixed hex values for charts and map markers (Greenhouse mint-900 / persimmon-700 / brick red).
export const riskColor: Record<RiskLevel, string> = { low: "#008561", medium: "#d87220", high: "#b02a1e" };
export const labelColor: Record<DiseaseLabel, string> = { healthy: "#008561", early_blight: "#d87220", late_blight: "#b02a1e" };
