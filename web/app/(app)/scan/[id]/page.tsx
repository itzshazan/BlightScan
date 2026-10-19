"use client";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, Camera, Download, Link2, MapPinned, Trash2, TriangleAlert, UserRoundSearch } from "lucide-react";
import { ScanImage } from "@/components/art/leaf-art";
import { SpreadPanel } from "@/components/app/spread-panel";
import { TreatmentTabs } from "@/components/scan/treatment-tabs";
import { ResultBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Crumbs, Skeleton } from "@/components/ui/misc";
import { getByLabel } from "@/lib/diseases";
import { LABELS, affectedArea, formatDateTime } from "@/lib/format";
import { deleteScans, effectiveLabel, reviewScan, scanSpread, useDB } from "@/lib/store";
import { ScanConditions } from "@/components/app/scan-conditions";
import { downloadScanReport } from "@/lib/report";
import type { DiseaseLabel } from "@/lib/types";

const tone: Record<DiseaseLabel, string> = { healthy: "text-healthy", early_blight: "text-early", late_blight: "text-late" };
const bar: Record<DiseaseLabel, string> = { healthy: "bg-healthy", early_blight: "bg-early", late_blight: "bg-late" };
const ORDER: DiseaseLabel[] = ["healthy", "early_blight", "late_blight"];

export default function ScanResultPage({ params }: { params: { id: string } }) {
  const db = useDB();
  const router = useRouter();
  const [pdfBusy, setPdfBusy] = useState(false);
  const [showMask, setShowMask] = useState(true);

  if (!db)
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-80 rounded-card" />
      </div>
    );

  const scan = db.scans.find((s) => s.id === params.id);
  if (!scan) notFound();

  const field = db.fields.find((f) => f.id === scan.field_id);
  const label = effectiveLabel(scan);
  const info = getByLabel(label);
  const diseased = label !== "healthy";
  const spread = diseased ? scanSpread(db, scan) : null;
  const low = scan.confidence < 60;
  const severity = { low: "Low", moderate: "Moderate", high: "High" }[scan.severity];
  const area = diseased ? affectedArea(scan) : null;
  const mask = area != null ? scan.lesion_mask : null;

  return (
    <>
      <Crumbs items={[{ label: "Scan History", href: "/history" }, { label: "Scan Result" }]} />
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="display-3">Scan result</h1>
        <p className="text-muted">
          {formatDateTime(scan.created_at)} · {field?.name ?? "No field"}
        </p>
      </div>

      <div className="space-y-6">
        {/* 1 · Diagnosis card */}
        <section className="card grid overflow-hidden md:grid-cols-[minmax(0,360px)_1fr]">
          <div className="relative aspect-square bg-sunken md:aspect-auto md:min-h-[360px]">
            <ScanImage scan={scan} />
            {/* The mask has the photo's framing, so object-cover crops both the same way */}
            {mask && showMask && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mask} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
            )}
            {mask && (
              <button
                type="button"
                onClick={() => setShowMask((v) => !v)}
                aria-pressed={showMask}
                className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-deep/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-deep"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${showMask ? "bg-[#e11d48]" : "border border-white/70"}`} />
                {showMask ? "Hide affected area" : "Show affected area"}
              </button>
            )}
          </div>
          <div className="flex flex-col p-6 md:p-8">
            <p className="text-sm text-muted">{scan.expert_label ? "Expert-reviewed diagnosis" : "Model diagnosis"}</p>
            <p className={`mt-1 font-serif text-[2.75rem] leading-none tracking-[-0.04em] md:text-[3.5rem] ${tone[label]}`}>{LABELS[label]}</p>

            <div className="mt-8">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Confidence</span>
                <span className="text-2xl font-semibold tracking-[-0.02em]">{scan.confidence}%</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink/10" role="meter" aria-valuenow={scan.confidence} aria-valuemin={0} aria-valuemax={100} aria-label="Confidence">
                <div className={`h-full rounded-full ${bar[scan.predicted_label]}`} style={{ width: `${scan.confidence}%` }} />
              </div>
            </div>

            <dl className="mt-8 grid grid-cols-3 gap-3 text-sm">
              {[
                ["Severity", diseased ? severity : "None", area != null ? `${area}% of leaf` : null],
                ["Date", new Date(scan.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), null],
                ["Field", field?.name ?? "—", null],
              ].map(([k, v, sub]) => (
                <div key={k} className="rounded-2xl bg-sunken p-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="mt-1 truncate font-semibold">{v}</dd>
                  {sub && <dd className="truncate text-xs text-muted">{sub}</dd>}
                </div>
              ))}
            </dl>

            {/* Severity method: older scans (before leaf-area measurement) have no diseased_area and get no note */}
            {diseased && scan.diseased_area !== undefined && scan.diseased_area !== null && (
              <p className="mt-3 text-xs leading-relaxed text-muted">
                {area != null
                  ? `About ${area}% of the leaf shows lesions, measured from leaf colour. Severity bands: under 25% low, 25–50% moderate, over 50% high.`
                  : "We couldn't measure the affected area on this photo, so severity is set to moderate. For a measurement, photograph one leaf against a plain background."}
              </p>
            )}

            {/* 3 · Low confidence, plus the model's reason when it has one */}
            {(low || scan.model_note) && (
              <div className="mt-6 flex gap-3 rounded-2xl border border-early/30 bg-early-soft p-4 text-sm" role="alert">
                <TriangleAlert className="h-5 w-5 shrink-0 text-early" />
                <div className="space-y-1">
                  {low && (
                    <p>
                      <span className="font-semibold">We&apos;re not sure.</span> Retake the photo in better light or ask an expert.
                    </p>
                  )}
                  {scan.model_note && <p>{scan.model_note}</p>}
                </div>
              </div>
            )}

            {/* 7 · Expert review */}
            {scan.review_status === "reviewed" && scan.expert_label && (
              <div className="mt-6 flex gap-3 rounded-2xl bg-info-soft p-4 text-sm text-info">
                <BadgeCheck className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Reviewed by expert: {LABELS[scan.expert_label]}</p>
                  {scan.expert_note && <p className="mt-1 text-ink/80">{scan.expert_note}</p>}
                  {scan.expert_label !== scan.predicted_label && <p className="mt-1 text-ink/60">Model originally predicted {LABELS[scan.predicted_label]}.</p>}
                </div>
              </div>
            )}
            {scan.review_status === "requested" && <p className="mt-6 rounded-2xl bg-sunken p-4 text-sm text-muted">Expert review requested. You&apos;ll see the reviewer&apos;s label here.</p>}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 2 · Probability breakdown */}
          <section className="card p-6">
            <h2 className="font-medium">Class probabilities</h2>
            <div className="mt-5 space-y-4">
              {ORDER.map((k) => {
                const v = Math.round(scan.probabilities[k] * 1000) / 10;
                return (
                  <div key={k} className="grid grid-cols-[110px_1fr_52px] items-center gap-3 text-[15px]">
                    <span className={k === scan.predicted_label ? "font-semibold" : "text-muted"}>{LABELS[k]}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-ink/10">
                      <span className={`block h-full rounded-full ${bar[k]}`} style={{ width: `${v}%` }} />
                    </span>
                    <span className="text-right font-semibold">{v}%</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4 · What this means */}
          <section className="card p-6">
            <h2 className="font-medium">What this result means</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{info.summary}</p>
            {info.slug && (
              <Link href={`/diseases/${info.slug}`} className="mt-4 inline-block text-[15px] font-semibold text-accent hover:underline">
                Read the {info.name} guide →
              </Link>
            )}
            {!diseased && <p className="mt-4 text-sm text-muted">A healthy result means no blight was detected on this leaf. It does not rule out other problems.</p>}
          </section>
        </div>

        {/* Live weather at the scan location */}
        {scan.weather && <ScanConditions weather={scan.weather} label={label} />}

        {/* 6 · Spread forecast */}
        {diseased && (
          <section className="card p-6">
            <h2 className="font-medium">7-day spread-risk forecast</h2>
            <div className="mt-4">
              {spread ? (
                <SpreadPanel prediction={spread} />
              ) : (
                <p className="rounded-2xl bg-sunken p-4 text-sm text-muted">
                  No location was shared when this photo was taken, so no forecast was made.{" "}
                  <Link href={field ? `/fields/${field.id}?edit=1` : "/fields/new"} className="font-medium text-accent hover:underline">
                    {field ? "Pin this field on the map" : "Add a mapped field"}
                  </Link>{" "}
                  or allow location on your next scan.
                </p>
              )}
            </div>
          </section>
        )}

        {/* 5 · Recommended actions */}
        <section className="card p-6">
          <h2 className="mb-5 font-medium">Recommended next steps</h2>
          <TreatmentTabs organic={info.treatment_organic} chemical={info.treatment_chemical} />
        </section>

        {scan.notes && (
          <section className="card p-6">
            <h2 className="font-medium">Your notes</h2>
            <p className="mt-3 text-[15px] text-muted">{scan.notes}</p>
          </section>
        )}

        {/* 8 · Actions */}
        <div className="flex flex-wrap gap-2">
          <Button href="/scan" variant="accent">
            <Camera className="h-4 w-4" /> Scan Another Leaf
          </Button>
          {field && (
            <Button href={`/fields/${field.id}`} variant="outline">
              <MapPinned className="h-4 w-4" /> View Field
            </Button>
          )}
          <Button
            variant="outline"
            loading={pdfBusy}
            onClick={async () => {
              setPdfBusy(true);
              try {
                await downloadScanReport({ scan, field, spread, label });
                toast.success("Report downloaded");
              } catch {
                toast.error("Couldn't create the PDF");
              } finally {
                setPdfBusy(false);
              }
            }}
          >
            {!pdfBusy && <Download className="h-4 w-4" />} Download Report (PDF)
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied", { description: "Only you and reviewers can open it." });
              } catch {
                toast.error("Couldn't copy the link");
              }
            }}
          >
            <Link2 className="h-4 w-4" /> Share
          </Button>
          {scan.review_status === "none" && (
            <Button
              variant="outline"
              onClick={async () => {
                await reviewScan(scan.id, { review_status: "requested" });
                toast.success("Expert review requested");
              }}
            >
              <UserRoundSearch className="h-4 w-4" /> Request Expert Review
            </Button>
          )}
          <ConfirmDialog
            title="Delete this scan?"
            description="The photo and result will be permanently removed."
            confirmLabel="Delete Scan"
            onConfirm={async () => {
              await deleteScans([scan.id]);
              toast.success("Scan deleted");
              router.push("/history");
            }}
            trigger={
              <Button variant="danger-outline">
                <Trash2 className="h-4 w-4" /> Delete Scan
              </Button>
            }
          />
          <Button href="/history" variant="ghost">
            <ArrowLeft className="h-4 w-4" /> Back to History
          </Button>
        </div>
      </div>
    </>
  );
}
