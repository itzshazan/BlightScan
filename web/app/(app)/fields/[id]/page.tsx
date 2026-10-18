"use client";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Camera, MapPinOff, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { FieldForm } from "@/components/app/field-form";
import { SpreadPanel } from "@/components/app/spread-panel";
import { WeatherCard } from "@/components/app/weather-card";
import { ScanImage } from "@/components/art/leaf-art";
import { PinMap } from "@/components/map";
import { ResultBadge, RiskBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Crumbs, PageHeader, Skeleton } from "@/components/ui/misc";
import { relativeDay } from "@/lib/format";
import { deleteField, effectiveLabel, fieldScans, latestSpread, runFieldForecast, updateField, useDB } from "@/lib/store";

function FieldDetail({ id }: { id: string }) {
  const db = useDB();
  const router = useRouter();
  const sp = useSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const editing = sp.get("edit") === "1";

  if (!db) return <Skeleton className="h-[560px] rounded-card" />;
  const field = db.fields.find((f) => f.id === id);
  if (!field) notFound();

  const crumbs = <Crumbs items={[{ label: "My Fields", href: "/fields" }, { label: field.name }]} />;

  if (editing)
    return (
      <>
        <PageHeader crumbs={crumbs} title={`Edit ${field.name}`} />
        <div className="max-w-3xl">
          <FieldForm
            initial={field}
            submitLabel="Save Changes"
            onCancel={() => router.push(`/fields/${field.id}`)}
            onSubmit={async (data) => {
              await updateField(field.id, data);
              toast.success("Field updated");
              router.push(`/fields/${field.id}`);
            }}
          />
        </div>
      </>
    );

  const scans = fieldScans(db, field.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const spread = latestSpread(db, field.id);
  const hasDiseased = scans.some((s) => effectiveLabel(s) !== "healthy");

  const refresh = async () => {
    setRefreshing(true);
    try {
      const r = await runFieldForecast(field);
      if (r.ok) toast.success("Forecast updated", { description: r.source === "synthetic" ? "Weather service unreachable, used an estimate" : "Using live Open-Meteo weather" });
      else toast.error(r.reason === "no-location" ? "Add a location to forecast this field" : "No diseased scan in this field to forecast from");
    } catch (e) {
      toast.error("Couldn't refresh the forecast", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <PageHeader
        crumbs={crumbs}
        title={field.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            Tomato · {field.area_acres} acres{field.variety && ` · ${field.variety}`}
            <RiskBadge risk={field.current_risk} />
          </span>
        }
        actions={
          <>
            <Button href={`/scan?field=${field.id}`} variant="accent">
              <Camera className="h-4 w-4" /> Scan in This Field
            </Button>
            <Button variant="outline" loading={refreshing} onClick={refresh}>
              {!refreshing && <RefreshCw className="h-4 w-4" />} Refresh Forecast
            </Button>
            <Button href={`/fields/${field.id}?edit=1`} variant="outline">
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <ConfirmDialog
              title={`Delete ${field.name}?`}
              description="The field and its forecasts are removed. Its scans stay in your history without a field."
              confirmLabel="Delete Field"
              onConfirm={async () => {
                await deleteField(field.id);
                toast.success("Field deleted");
                router.push("/fields");
              }}
              trigger={
                <Button variant="danger-outline" aria-label="Delete field">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              }
            />
          </>
        }
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="card overflow-hidden">
            {field.latitude != null && field.longitude != null ? (
              <PinMap value={[field.latitude, field.longitude]} className="h-80" />
            ) : (
              <div className="grid h-80 place-items-center bg-sunken p-6 text-center">
                <div>
                  <MapPinOff className="mx-auto h-8 w-8 text-muted" />
                  <p className="mt-3 font-medium">No location set</p>
                  <Link href={`/fields/${field.id}?edit=1`} className="mt-1 inline-block text-sm text-accent hover:underline">
                    Add a location to enable forecasts
                  </Link>
                </div>
              </div>
            )}
          </div>
          <WeatherCard field={field} />
        </div>

        <section className="card p-6">
          <h2 className="font-medium">7-day spread-risk forecast</h2>
          <div className="mt-4">
            {spread ? (
              <SpreadPanel prediction={spread} />
            ) : (
              <p className="rounded-2xl bg-sunken p-4 text-sm text-muted">
                {field.latitude == null
                  ? "Forecast unavailable: this field needs a location."
                  : hasDiseased
                    ? "No forecast yet. Use Refresh Forecast to create one."
                    : "Forecast unavailable: no diseased scan in this field yet. Forecasts start after early or late blight is detected."}
              </p>
            )}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Scans in this field</h2>
            {scans.length > 0 && (
              <Link href={`/history?field=${field.id}`} className="text-sm font-semibold text-accent hover:underline">
                View All Scans
              </Link>
            )}
          </div>
          {scans.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No scans yet in this field.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line/10">
              {scans.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link href={`/scan/${s.id}`} className="-mx-3 flex items-center gap-4 rounded-xl px-3 py-3 hover:bg-ink/[0.03]">
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                      <ScanImage scan={s} />
                    </span>
                    <ResultBadge label={effectiveLabel(s)} />
                    <span className="text-sm font-semibold">{s.confidence}%</span>
                    <span className="ml-auto text-sm text-muted">{relativeDay(s.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export default function FieldPage({ params }: { params: { id: string } }) {
  return (
    <Suspense>
      <FieldDetail id={params.id} />
    </Suspense>
  );
}
