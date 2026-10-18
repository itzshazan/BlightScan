"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, MapPin, Plus, ShieldAlert, X } from "lucide-react";
import { ScansPerWeek, ResultDonut, type WeekRow } from "@/components/charts/charts";
import type { DiseaseLabel, Field, Scan, SpreadPrediction } from "@/lib/types";
import { WeatherCard } from "@/components/app/weather-card";
import { LeafArt, ScanImage } from "@/components/art/leaf-art";
import { ResultBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton, SkeletonCards } from "@/components/ui/misc";
import { effectiveLabel, latestSpread, useDB } from "@/lib/store";
import { greeting, relativeDay } from "@/lib/format";

const WEEK = 7 * 86400000;

function weekly(scans: Scan[]): WeekRow[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  return Array.from({ length: 8 }, (_, i) => {
    const from = start.getTime() - (7 - i) * WEEK;
    const inWeek = scans.filter((s) => {
      const t = new Date(s.created_at).getTime();
      return t >= from && t < from + WEEK;
    });
    const row: WeekRow = { week: new Date(from).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), healthy: 0, early_blight: 0, late_blight: 0 };
    inWeek.forEach((s) => row[effectiveLabel(s)]++);
    return row;
  });
}

export default function DashboardPage() {
  const db = useDB();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    try {
      setDismissed(JSON.parse(sessionStorage.getItem("bs-dismissed") || "[]"));
    } catch {}
  }, []);

  const data = useMemo(() => {
    if (!db) return null;
    const scans = [...db.scans].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const diseased = scans.filter((s) => effectiveLabel(s) !== "healthy");
    const high = db.fields.filter((f) => f.current_risk === "high");
    const alerts = db.fields
      .map((f) => ({ field: f, sp: latestSpread(db, f.id) }))
      .filter((a): a is { field: Field; sp: SpreadPrediction } => !!a.sp && a.field.current_risk !== "low" && Date.now() - new Date(a.sp.created_at).getTime() < WEEK)
      .sort((a, b) => b.sp.risk_score - a.sp.risk_score);
    const counts: Record<DiseaseLabel, number> = { healthy: 0, early_blight: 0, late_blight: 0 };
    scans.forEach((s) => counts[effectiveLabel(s)]++);
    return { scans, diseased, high, alerts, counts, weeks: weekly(scans), defaultField: db.fields.find((f) => f.latitude != null) };
  }, [db]);

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      sessionStorage.setItem("bs-dismissed", JSON.stringify(next));
    } catch {}
  };

  if (!db || !data || !now)
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-80" />
        <SkeletonCards />
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-56 rounded-card" />
          <Skeleton className="h-56 rounded-card" />
        </div>
      </div>
    );

  const first = db.profile.full_name?.split(" ")[0] ?? "there";
  const location = [db.profile.district, db.profile.state].filter(Boolean).join(", ");

  return (
    <>
      {/* 1 · Greeting */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="display-3">
            {greeting(now)}, {first}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-muted">
            <span>{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {location}
              </span>
            )}
          </p>
        </div>
        <Button href="/scan" variant="accent">
          <Plus className="h-4 w-4" /> New Scan
        </Button>
      </div>

      {data.scans.length === 0 ? (
        <EmptyState
          art={<LeafArt variant="healthy" className="h-28" />}
          title="Run your first scan"
          body="Photograph one tomato leaf to get a diagnosis, treatment guidance and a spread forecast."
          action="Start Scanning"
          href="/scan"
        />
      ) : (
        <div className="space-y-6">
          {/* 2 · Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Total scans", value: data.scans.length, href: "/history" },
              { label: "Diseased detected", value: data.diseased.length, href: "/history?result=diseased", tone: "text-early" },
              { label: "Fields monitored", value: db.fields.length, href: "/fields" },
              { label: "High-risk fields", value: data.high.length, href: "/fields?risk=high", tone: data.high.length ? "text-late" : "" },
            ].map((s) => (
              <Link key={s.label} href={s.href} className="card group p-5 transition-shadow hover:shadow-lg">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-muted">{s.label}</p>
                  <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className={`mt-4 font-serif text-[2.75rem] leading-none tracking-[-0.04em] ${s.tone ?? ""}`}>{s.value}</p>
              </Link>
            ))}
          </div>

          {/* 3 · Risk alerts + 4 · Weather */}
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="card p-6">
              <h2 className="font-medium">Risk alerts</h2>
              <div className="mt-4 space-y-3">
                {data.alerts.filter((a) => !dismissed.includes(a.sp.id)).length === 0 && (
                  <p className="rounded-2xl bg-healthy-soft px-4 py-3 text-sm text-healthy">No active risk alerts. Conditions look calm across your fields.</p>
                )}
                {data.alerts
                  .filter((a) => !dismissed.includes(a.sp.id))
                  .map(({ field, sp }) => (
                    <div
                      key={sp.id}
                      role="alert"
                      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${sp.risk_level === "high" ? "border-late/25 bg-late-soft" : "border-early/25 bg-early-soft"}`}
                    >
                      <ShieldAlert className={`mt-0.5 h-5 w-5 shrink-0 ${sp.risk_level === "high" ? "text-late" : "text-early"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {field.name} · {sp.risk_level === "high" ? "High" : "Medium"} risk ({sp.risk_score})
                        </p>
                        <p className="mt-0.5 text-sm text-ink/75">{sp.summary}</p>
                        <Link href={`/fields/${field.id}`} className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold hover:underline">
                          View field <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                      <button onClick={() => dismiss(sp.id)} className="rounded-full p-1 text-muted hover:bg-ink/5" aria-label={`Dismiss alert for ${field.name}`}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
            <WeatherCard field={data.defaultField} />
          </div>

          {/* 6 · Charts */}
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="card p-6">
              <h2 className="mb-4 font-medium">Scans per week</h2>
              <ScansPerWeek data={data.weeks} />
            </div>
            <div className="card p-6">
              <h2 className="mb-5 font-medium">Diagnosis breakdown</h2>
              <ResultDonut counts={data.counts} />
            </div>
          </div>

          {/* 5 · Recent scans */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Recent scans</h2>
              <Link href="/history" className="text-sm font-semibold text-accent hover:underline">
                View all
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-line/10">
              {data.scans.slice(0, 5).map((s) => {
                const field = db.fields.find((f) => f.id === s.field_id);
                return (
                  <li key={s.id}>
                    <Link href={`/scan/${s.id}`} className="-mx-3 flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-ink/[0.03]">
                      <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                        <ScanImage scan={s} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <ResultBadge label={effectiveLabel(s)} />
                          <span className="text-sm font-semibold">{s.confidence}%</span>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted">{field?.name ?? "No field"}</p>
                      </div>
                      <span className="shrink-0 text-sm text-muted">{relativeDay(s.created_at)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
