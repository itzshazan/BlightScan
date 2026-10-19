"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, Eye, LayoutGrid, Rows3, Search, Trash2, X } from "lucide-react";
import { LeafArt, ScanImage } from "@/components/art/leaf-art";
import { ResultBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { LABELS, affectedArea, formatDate } from "@/lib/format";
import { deleteScans, effectiveLabel, useDB } from "@/lib/store";
import { cn } from "@/lib/utils";
import { supabaseEnabled } from "@/lib/supabase/env";
import type { Field, Scan } from "@/lib/types";

const PER_PAGE = 10;
const VIEWS = [
  ["table", Rows3, "Table"],
  ["grid", LayoutGrid, "Grid"],
] as const;

function toCSV(rows: Scan[], fields: Field[]) {
  const head = ["id", "date", "result", "model_label", "confidence", "severity", "diseased_area_pct", "field", "review_status", "notes"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((s) =>
    [s.id, s.created_at, LABELS[effectiveLabel(s)], LABELS[s.predicted_label], s.confidence, s.severity, affectedArea(s), fields.find((f) => f.id === s.field_id)?.name ?? "", s.review_status, s.notes]
      .map(esc)
      .join(",")
  );
  return [head.join(","), ...lines].join("\n");
}

function History() {
  const db = useDB();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<string[] | null>(null);

  const q = sp.get("q") ?? "";
  const result = sp.get("result") ?? "all";
  const fieldF = sp.get("field") ?? "all";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const sort = sp.get("sort") ?? "newest";
  const view = sp.get("view") ?? "table";
  const page = Math.max(1, Number(sp.get("page") ?? 1));

  const setParam = (patch: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v === "" || v == null || v === "all" || (k === "sort" && v === "newest") || (k === "view" && v === "table") ? next.delete(k) : next.set(k, v)));
    if (resetPage) next.delete("page");
    router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false });
    setSelected([]);
  };

  const rows = useMemo(() => {
    if (!db) return [];
    let r = db.scans.filter((s) => {
      const l = effectiveLabel(s);
      if (result === "diseased" ? l === "healthy" : result !== "all" && l !== result) return false;
      if (fieldF === "none" ? s.field_id : fieldF !== "all" && s.field_id !== fieldF) return false;
      if (q && !(s.notes ?? "").toLowerCase().includes(q.toLowerCase())) return false;
      const d = s.created_at.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
    r = [...r].sort((a, b) => (sort === "oldest" ? a.created_at.localeCompare(b.created_at) : sort === "confidence" ? b.confidence - a.confidence : b.created_at.localeCompare(a.created_at)));
    return r;
  }, [db, q, result, fieldF, from, to, sort]);

  if (!db) return <Skeleton className="h-[560px] rounded-card" />;

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const current = Math.min(page, pages);
  const pageRows = rows.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const filtered = q || result !== "all" || fieldF !== "all" || from || to;
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));
  const fieldName = (id: string | null) => db.fields.find((f) => f.id === id)?.name ?? "No field";
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // GET /api/scans/export with the current filters
  const exportCSV = () => {
    if (supabaseEnabled) {
      // GET /api/scans/export applies the same filters on the server.
      window.location.href = `/api/scans/export?${sp.toString()}`;
      return;
    }
    const blob = new Blob([toCSV(rows, db.fields)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `blightscan-scans-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Exported ${rows.length} scan${rows.length === 1 ? "" : "s"}`);
  };

  if (db.scans.length === 0)
    return (
      <>
        <PageHeader title="Scan History" description="Review earlier scans and compare predictions." />
        <EmptyState art={<LeafArt className="h-28" />} title="No scans yet" body="Your scans will appear here." action="Start Your First Scan" href="/scan" />
      </>
    );

  return (
    <>
      <PageHeader
        title="Scan History"
        description="Review earlier scans and compare predictions."
        actions={
          <Button variant="outline" onClick={exportCSV} disabled={!rows.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="card mb-4 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1.6fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input aria-label="Search notes" placeholder="Search notes" defaultValue={q} key={q} className="pl-10" onKeyDown={(e) => e.key === "Enter" && setParam({ q: e.currentTarget.value })} onBlur={(e) => e.currentTarget.value !== q && setParam({ q: e.currentTarget.value })} />
        </div>
        <Select aria-label="Result" value={result} onChange={(e) => setParam({ result: e.target.value })}>
          <option value="all">All results</option>
          <option value="healthy">Healthy</option>
          <option value="early_blight">Early Blight</option>
          <option value="late_blight">Late Blight</option>
          <option value="diseased">Any blight</option>
        </Select>
        <Select aria-label="Field" value={fieldF} onChange={(e) => setParam({ field: e.target.value })}>
          <option value="all">All fields</option>
          {db.fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
          <option value="none">No field</option>
        </Select>
        <div className="flex items-center gap-2">
          <Input type="date" aria-label="From date" value={from} max={to || undefined} onChange={(e) => setParam({ from: e.target.value })} className="px-3" />
          <span className="text-muted">–</span>
          <Input type="date" aria-label="To date" value={to} min={from || undefined} onChange={(e) => setParam({ to: e.target.value })} className="px-3" />
        </div>
        <Select aria-label="Sort" value={sort} onChange={(e) => setParam({ sort: e.target.value })}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="confidence">Confidence</option>
        </Select>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">
            {rows.length} scan{rows.length === 1 ? "" : "s"}
          </span>
          {filtered && (
            <button onClick={() => router.replace(pathname)} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
          {selected.length > 0 && (
            <Button variant="danger-outline" size="sm" onClick={() => setConfirm(selected)}>
              <Trash2 className="h-3.5 w-3.5" /> Delete selected ({selected.length})
            </Button>
          )}
        </div>
        <div className="inline-flex rounded-pill bg-sunken p-1" role="group" aria-label="View">
          {VIEWS.map(([v, Icon, l]) => (
            <button key={v} onClick={() => setParam({ view: v }, false)} aria-pressed={view === v} className={cn("inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-sm font-medium text-muted", view === v && "bg-surface text-ink shadow-sm")}>
              <Icon className="h-4 w-4" /> {l}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState art={<LeafArt variant="early_blight" className="h-24" />} title="No matching scans" body="Try a different result, field or date range." action="Clear Filters" onAction={() => router.replace(pathname)} />
      ) : view === "table" ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[15px]">
            <thead className="border-b border-line/10 text-sm text-muted">
              <tr>
                <th className="w-12 p-4">
                  <input type="checkbox" aria-label="Select page" checked={allOnPage} onChange={() => setSelected(allOnPage ? selected.filter((id) => !pageRows.some((r) => r.id === id)) : [...new Set([...selected, ...pageRows.map((r) => r.id)])])} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                </th>
                <th className="p-4 font-medium">Photo</th>
                <th className="p-4 font-medium">Result</th>
                <th className="p-4 font-medium">Confidence</th>
                <th className="p-4 font-medium">Field</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/10">
              {pageRows.map((s) => (
                <tr key={s.id} className={cn("hover:bg-ink/[0.02]", selected.includes(s.id) && "bg-accent-tint")}>
                  <td className="p-4">
                    <input type="checkbox" aria-label="Select scan" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} className="h-4 w-4 accent-[rgb(var(--accent))]" />
                  </td>
                  <td className="p-4">
                    <Link href={`/scan/${s.id}`} className="block h-12 w-12 overflow-hidden rounded-lg">
                      <ScanImage scan={s} />
                    </Link>
                  </td>
                  <td className="p-4">
                    <ResultBadge label={effectiveLabel(s)} />
                    {s.review_status === "requested" && <span className="ml-2 text-xs text-muted">Review requested</span>}
                  </td>
                  <td className={cn("p-4 font-semibold", s.confidence < 60 && "text-early")}>{s.confidence}%</td>
                  <td className="p-4 text-muted">{fieldName(s.field_id)}</td>
                  <td className="p-4 text-muted">{formatDate(s.created_at)}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <Button href={`/scan/${s.id}`} variant="ghost" size="sm">
                        <Eye className="h-4 w-4" /> View
                      </Button>
                      <button onClick={() => setConfirm([s.id])} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-late-soft hover:text-late" aria-label="Delete scan">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {pageRows.map((s) => (
            <div key={s.id} className={cn("card group relative overflow-hidden", selected.includes(s.id) && "ring-2 ring-accent")}>
              <input type="checkbox" aria-label="Select scan" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} className="absolute left-3 top-3 z-10 h-4 w-4 accent-[rgb(var(--accent))]" />
              <Link href={`/scan/${s.id}`}>
                <div className="aspect-square">
                  <ScanImage scan={s} />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <ResultBadge label={effectiveLabel(s)} />
                    <span className="text-sm font-semibold">{s.confidence}%</span>
                  </div>
                  <p className="mt-2 truncate text-sm text-muted">
                    {fieldName(s.field_id)} · {formatDate(s.created_at, { day: "numeric", month: "short" })}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {rows.length > PER_PAGE && (
        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setParam({ page: String(current - 1) }, false)}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-muted">
            Page {current} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={current >= pages} onClick={() => setParam({ page: String(current + 1) }, false)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm && confirm.length > 1 ? `Delete ${confirm.length} scans?` : "Delete this scan?"}
        description="Photos and results will be permanently removed."
        onConfirm={async () => {
          if (!confirm) return;
          await deleteScans(confirm);
          toast.success(confirm.length > 1 ? `${confirm.length} scans deleted` : "Scan deleted");
          setSelected((s) => s.filter((id) => !confirm.includes(id)));
          setConfirm(null);
        }}
      />
    </>
  );
}

export default function HistoryPage() {
  return (
    <Suspense>
      <History />
    </Suspense>
  );
}
