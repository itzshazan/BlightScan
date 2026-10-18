"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { ScanImage } from "@/components/art/leaf-art";
import { Badge, ResultBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { PageHeader, Skeleton } from "@/components/ui/misc";
import { LABELS, formatDate } from "@/lib/format";
import { reviewScan, staffView, useDB } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { DiseaseLabel } from "@/lib/types";

const statusTone = { none: "bg-ink/5 text-muted", requested: "bg-early-soft text-early", reviewed: "bg-info-soft text-info" };
const statusLabel = { none: "Not reviewed", requested: "Requested", reviewed: "Reviewed" };

function Review() {
  const db = useDB();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [lowOnly, setLowOnly] = useState(sp.get("filter") === "review");
  const [openId, setOpenId] = useState(sp.get("open"));
  const [label, setLabel] = useState<DiseaseLabel>("healthy");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const view = useMemo(() => (db ? staffView(db) : null), [db]);
  const open = view?.scans.find((s) => s.id === openId);
  useEffect(() => {
    if (open) {
      setLabel(open.expert_label ?? open.predicted_label);
      setNote(open.expert_note ?? "");
    }
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => {
    if (!view) return [];
    return view.scans
      .filter((s) => {
        const field = view.fields.find((f) => f.id === s.field_id)?.name ?? "";
        if (q && !`${LABELS[s.predicted_label]} ${field} ${s.notes}`.toLowerCase().includes(q.toLowerCase())) return false;
        if (status !== "all" && s.review_status !== status) return false;
        if (lowOnly && !(s.review_status === "requested" || s.confidence < 60)) return false;
        return true;
      })
      .sort((a, b) => (a.review_status === "requested" ? -1 : 0) - (b.review_status === "requested" ? -1 : 0) || a.confidence - b.confidence);
  }, [view, q, status, lowOnly]);

  if (!db) return <Skeleton className="h-96 rounded-card" />;

  const dirty = open && (label !== (open.expert_label ?? open.predicted_label) || note !== (open.expert_note ?? ""));
  const close = () => {
    if (dirty && !confirm("Discard your unsaved review?")) return;
    setOpenId(null);
    router.replace(pathname + (lowOnly ? "?filter=review" : ""), { scroll: false });
  };

  return (
    <>
      <PageHeader title="Scan review" description="Review uncertain predictions and record corrections." />
      <div className="card mb-4 grid gap-3 p-4 md:grid-cols-[1.5fr_1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input aria-label="Search" placeholder="Search label, field or notes" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="requested">Requested</option>
          <option value="reviewed">Reviewed</option>
          <option value="none">Not reviewed</option>
        </Select>
        <button onClick={() => setLowOnly((v) => !v)} aria-pressed={lowOnly} className={cn("h-12 rounded-xl border px-4 text-[15px] font-medium", lowOnly ? "border-accent bg-accent-tint text-ink" : "border-line/20 text-muted")}>
          Needs review (requested or &lt; 60%)
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[15px]">
          <thead className="border-b border-line/10 text-sm text-muted">
            <tr>
              {["Photo", "Prediction", "Confidence", "Field", "Date", "Status", ""].map((h) => (
                <th key={h} className="p-4 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/10">
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-ink/[0.02]">
                <td className="p-4">
                  <span className="block h-12 w-12 overflow-hidden rounded-lg">
                    <ScanImage scan={s} />
                  </span>
                </td>
                <td className="p-4">
                  <ResultBadge label={s.predicted_label} />
                </td>
                <td className={cn("p-4 font-semibold", s.confidence < 60 && "text-early")}>{s.confidence}%</td>
                <td className="p-4 text-muted">{view?.fields.find((f) => f.id === s.field_id)?.name ?? "—"}</td>
                <td className="p-4 text-muted">{formatDate(s.created_at)}</td>
                <td className="p-4">
                  <Badge tone={statusTone[s.review_status]}>{statusLabel[s.review_status]}</Badge>
                </td>
                <td className="p-4 text-right">
                  <Button variant="outline" size="sm" onClick={() => setOpenId(s.id)}>
                    Review
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted">
                  No scans match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!open}
        onOpenChange={(o) => !o && close()}
        title="Review scan"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="accent"
              loading={busy}
              onClick={async () => {
                if (!open) return;
                setBusy(true);
                // PATCH /api/scans/[id]/review
                await reviewScan(open.id, { expert_label: label, expert_note: note.trim() || null, review_status: "reviewed", reviewed_by: user?.role === "admin" ? "demo-admin" : "demo-expert", reviewed_at: new Date().toISOString() });
                setBusy(false);
                toast.success("Review saved");
                setOpenId(null);
              }}
            >
              Save Review
            </Button>
          </>
        }
      >
        {open && (
          <div className="space-y-6">
            <div className="aspect-square overflow-hidden rounded-card">
              <ScanImage scan={open} />
            </div>
            <div className="rounded-2xl bg-sunken p-4 text-[15px]">
              Model prediction: <span className="font-semibold">{LABELS[open.predicted_label]}</span> · Confidence: <span className="font-semibold">{open.confidence}%</span>
              {open.notes && <p className="mt-2 text-sm text-muted">Farmer note: “{open.notes}”</p>}
            </div>
            <FormField label="Correct label" htmlFor="label">
              <Select id="label" value={label} onChange={(e) => setLabel(e.target.value as DiseaseLabel)}>
                <option value="healthy">Healthy</option>
                <option value="early_blight">Early Blight</option>
                <option value="late_blight">Late Blight</option>
              </Select>
            </FormField>
            <FormField label="Expert notes" optional htmlFor="note">
              <Textarea id="note" rows={4} placeholder="What did you see? Any advice for the grower?" value={note} onChange={(e) => setNote(e.target.value)} />
            </FormField>
          </div>
        )}
      </Drawer>
    </>
  );
}

export default function AdminScansPage() {
  return (
    <Suspense>
      <Review />
    </Suspense>
  );
}
