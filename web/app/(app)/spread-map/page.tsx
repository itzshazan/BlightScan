"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, MapPinOff, RefreshCw } from "lucide-react";
import { RiskMap } from "@/components/map";
import { RiskBadge, riskColor } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Skeleton } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/format";
import { effectiveLabel, fieldScans, latestSpread, runFieldForecast, useDB } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";

const LEVELS: (RiskLevel | "all")[] = ["all", "low", "medium", "high"];

export default function SpreadMapPage() {
  const db = useDB();
  const [level, setLevel] = useState<RiskLevel | "all">("all");
  const [progress, setProgress] = useState<string | null>(null);

  const fields = useMemo(() => {
    if (!db) return [];
    return db.fields.map((f) => {
      const sp = latestSpread(db, f.id);
      const last = fieldScans(db, f.id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      return { ...f, score: sp?.risk_score ?? null, updated: sp ? formatDateTime(sp.created_at) : null, lastLabel: last ? effectiveLabel(last) : null };
    });
  }, [db]);

  if (!db) return <Skeleton className="h-[640px] rounded-card" />;

  const shown = fields.filter((f) => level === "all" || f.current_risk === level);
  const located = shown.filter((f) => f.latitude != null);
  const unlocated = fields.filter((f) => f.latitude == null);

  // POST /api/forecast/refresh-all
  const refreshAll = async () => {
    const targets = db.fields.filter((f) => f.latitude != null);
    let ok = 0;
    let skipped = 0;
    for (let i = 0; i < targets.length; i++) {
      setProgress(`${i + 1} of ${targets.length}`);
      try {
        const r = await runFieldForecast(targets[i]);
        r.ok ? ok++ : skipped++;
      } catch {
        skipped++;
      }
    }
    setProgress(null);
    if (ok && !skipped) toast.success(`Updated ${ok} forecast${ok === 1 ? "" : "s"}`);
    else if (ok) toast.warning(`Updated ${ok}, skipped ${skipped}`, { description: "Skipped fields have no diseased scans to forecast from." });
    else toast.error("No forecasts updated", { description: "Fields need a location and a diseased scan." });
  };

  return (
    <>
      <PageHeader
        title="Spread Risk Map"
        description="Weather-driven risk across your located fields."
        actions={
          <Button variant="outline" loading={!!progress} onClick={refreshAll}>
            {!progress && <RefreshCw className="h-4 w-4" />} {progress ? `Refreshing ${progress}` : "Refresh All Forecasts"}
          </Button>
        }
      />

      <div className="mb-4 inline-flex flex-wrap rounded-pill bg-sunken p-1" role="group" aria-label="Filter by risk">
        {LEVELS.map((l) => (
          <button key={l} onClick={() => setLevel(l)} aria-pressed={level === l} className={cn("inline-flex items-center gap-2 rounded-pill px-4 py-1.5 text-sm font-medium capitalize text-muted", level === l && "bg-surface text-ink shadow-sm")}>
            {l !== "all" && <span className="h-2 w-2 rounded-full" style={{ background: riskColor[l] }} />}
            {l === "all" ? "All risk" : l}
          </button>
        ))}
      </div>

      <div className="card grid overflow-hidden lg:grid-cols-[1fr_300px]">
        <div className="relative h-[460px] lg:h-[600px]">
          <RiskMap fields={located} className="h-[460px] lg:h-[600px]" />
          <div className="absolute bottom-4 left-4 z-[400] rounded-2xl bg-surface/95 px-4 py-3 text-sm shadow-lg">
            <p className="mb-2 font-medium">Risk level</p>
            <ul className="space-y-1.5">
              {(["low", "medium", "high"] as const).map((l) => (
                <li key={l} className="flex items-center gap-2 capitalize">
                  <span className="h-3 w-3 rounded-full border-2 border-white" style={{ background: riskColor[l] }} /> {l}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Larger circle = higher score</p>
          </div>
        </div>
        <aside className="border-t border-line/10 p-5 lg:border-l lg:border-t-0">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Your fields</h2>
          <ul className="mt-3 divide-y divide-line/10">
            {located.length === 0 && <li className="py-4 text-sm text-muted">No located fields at this risk level.</li>}
            {located
              .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
              .map((f) => (
                <li key={f.id}>
                  <Link href={`/fields/${f.id}`} className="group flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium group-hover:underline">{f.name}</p>
                      <p className="text-xs text-muted">{f.score != null ? `Score ${f.score}` : "No forecast yet"}</p>
                    </div>
                    <RiskBadge risk={f.current_risk} short />
                  </Link>
                </li>
              ))}
          </ul>
          {unlocated.length > 0 && (
            <div className="mt-6 rounded-2xl bg-sunken p-4">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <MapPinOff className="h-4 w-4" /> Location needed
              </p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {unlocated.map((f) => (
                  <li key={f.id}>
                    <Link href={`/fields/${f.id}?edit=1`} className="inline-flex items-center gap-1 text-accent hover:underline">
                      {f.name} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
