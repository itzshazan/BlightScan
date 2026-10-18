"use client";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight, Cpu } from "lucide-react";
import { DailyBars } from "@/components/charts/charts";
import { ScanImage } from "@/components/art/leaf-art";
import { ResultBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Skeleton, SkeletonCards } from "@/components/ui/misc";
import { formatDate } from "@/lib/format";
import { model } from "@/lib/site";
import { effectiveLabel, staffView, useDB } from "@/lib/store";

// Numbers here come from /api/admin/stats once the backend exists.
export default function AdminOverview() {
  const db = useDB();
  const stats = useMemo(() => {
    if (!db) return null;
    const { scans } = staffView(db);
    const today = new Date().toISOString().slice(0, 10);
    const diseased = scans.filter((s) => effectiveLabel(s) !== "healthy").length;
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(Date.now() - (29 - i) * 86400000);
      const key = d.toISOString().slice(0, 10);
      return { day: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), count: scans.filter((s) => s.created_at.slice(0, 10) === key).length };
    });
    const avgConf = scans.length ? scans.reduce((a, s) => a + s.confidence, 0) / scans.length : 0;
    const review = scans.filter((s) => s.review_status === "requested" || (s.confidence < 60 && s.review_status !== "reviewed")).sort((a, b) => a.confidence - b.confidence);
    return {
      users: db.users.length,
      scans: scans.length,
      today: scans.filter((s) => s.created_at.slice(0, 10) === today).length,
      pct: scans.length ? Math.round((diseased / scans.length) * 100) : 0,
      days,
      avgConf,
      review,
    };
  }, [db]);

  if (!stats)
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <SkeletonCards />
      </div>
    );

  return (
    <>
      <PageHeader title="Platform overview" description="Monitor usage, scan activity, and the deployed model." />
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { l: "Total users", v: stats.users, href: "/admin/users" },
            { l: "Total scans", v: stats.scans, href: "/admin/scans" },
            { l: "Scans today", v: stats.today, href: "/admin/scans" },
            { l: "Diseased", v: `${stats.pct}%`, href: "/admin/scans" },
          ].map((s) => (
            <Link key={s.l} href={s.href} className="card group p-5 hover:shadow-lg">
              <div className="flex justify-between">
                <p className="text-sm text-muted">{s.l}</p>
                <ArrowUpRight className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100" />
              </div>
              <p className="mt-4 font-serif text-[2.75rem] leading-none tracking-[-0.04em]">{s.v}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="card p-6">
            <h2 className="mb-4 font-medium">Scans per day · last 30 days</h2>
            <DailyBars data={stats.days} />
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-accent" />
              <h2 className="font-medium">Active model</h2>
            </div>
            <dl className="mt-5 divide-y divide-line/10 text-[15px]">
              {[
                ["Version", model.version],
                ["Architecture", "DINOv2-small (int8)"],
                ["Test accuracy", model.metrics.accuracy != null ? `${model.metrics.accuracy}%` : "Not yet recorded"],
                ["Avg. confidence", `${stats.avgConf.toFixed(1)}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Scans needing review</h2>
            <Link href="/admin/scans?filter=review" className="text-sm font-semibold text-accent hover:underline">
              Open queue
            </Link>
          </div>
          {stats.review.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Nothing waiting for review.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line/10">
              {stats.review.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center gap-4 py-3">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                    <ScanImage scan={s} />
                  </span>
                  <ResultBadge label={s.predicted_label} />
                  <span className="text-sm font-semibold text-early">{s.confidence}%</span>
                  <span className="hidden text-sm text-muted sm:inline">{formatDate(s.created_at)}</span>
                  <Button href={`/admin/scans?filter=review&open=${s.id}`} variant="outline" size="sm" className="ml-auto">
                    Review
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button href="/admin/users" variant="outline">
            Manage Users
          </Button>
          <Button href="/admin/scans" variant="outline">
            Review Scans
          </Button>
          <Button href="/admin/messages" variant="outline">
            Contact Messages
          </Button>
        </div>
      </div>
    </>
  );
}
