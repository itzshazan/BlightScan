"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Camera, CheckCircle2, CloudSun, ImageUp, Info, Loader2, MapPin, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { LeafArt } from "@/components/art/leaf-art";
import { Button } from "@/components/ui/button";
import { FormField, Select, Textarea } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { compressImage } from "@/lib/predict";
import { getPosition, type Coords } from "@/lib/geo";
import { submitScan, useDB } from "@/lib/store";
import { supabaseEnabled } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX = 5 * 1024 * 1024;
const TIPS = [
  ["One leaf", "A single leaflet, not the whole plant"],
  ["Good light", "Daylight, no harsh shadow or flash glare"],
  ["Plain background", "Hold it against paper or your palm"],
  ["Fill the frame", "Leaf edges close to the photo edges"],
];

function Step({ n, title, children, done }: { n: number; title: string; children: ReactNode; done: boolean }) {
  return (
    <section className="card p-6 md:p-8">
      <div className="flex items-center gap-3">
        <span className={cn("grid h-8 w-8 place-items-center rounded-full text-sm font-semibold", done ? "bg-accent text-white" : "bg-sunken")}>
          {done ? <CheckCircle2 className="h-4 w-4" /> : n}
        </span>
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]">
          Step {n} · {title}
        </h2>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ScanForm() {
  const db = useDB();
  const router = useRouter();
  const params = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [fieldId, setFieldId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [drag, setDrag] = useState(false);
  const [tab, setTab] = useState("upload");
  const [stage, setStage] = useState<string | null>(null);
  // Phone location for live weather when the field has no pin. "idle" = not asked yet.
  const [geo, setGeo] = useState<{ state: "idle" | "locating" | "ok" | "denied" | "unavailable"; coords?: Coords }>({ state: "idle" });

  async function locate() {
    setGeo({ state: "locating" });
    const g = await getPosition();
    const next = g.ok ? ({ state: "ok", coords: g.coords } as const) : ({ state: g.reason === "denied" ? "denied" : "unavailable" } as const);
    setGeo(next);
    return next.state === "ok" ? next.coords : null;
  }

  useEffect(() => {
    const f = params.get("field");
    if (f) setFieldId(f);
  }, [params]);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const accept = useCallback((f: File | null | undefined) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) return setError("Use a JPG, PNG or WEBP image.");
    if (f.size > MAX) return setError(`That file is ${(f.size / 1048576).toFixed(1)} MB. The limit is 5 MB.`);
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const clear = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    if (camRef.current) camRef.current.value = "";
  };

  async function analyse() {
    if (!file || !db) return;
    try {
      setStage("Preparing photo…");
      const dataUrl = await compressImage(file);
      // Ask for the phone's location once, unless the field already has a pin. Refusal is fine: no weather.
      let coords = geo.coords ?? null;
      if (!fieldHasPin && geo.state === "idle") {
        setStage("Checking local weather…");
        coords = await locate();
      }
      const id = await submitScan({ dataUrl, fieldId: fieldId || null, notes: notes.trim(), coords: fieldHasPin ? null : coords }, setStage);
      router.push(`/scan/${id}`);
    } catch (e) {
      setStage(null);
      toast.error("Couldn't analyse the leaf", { description: e instanceof Error ? e.message : "Please try again in a minute." });
    }
  }

  const selected = db?.fields.find((f) => f.id === fieldId);
  const fieldHasPin = selected?.latitude != null && selected.longitude != null;
  if (!db) return <Skeleton className="h-[640px] rounded-card" />;

  return (
    <>
      <div className="mb-8">
        <h1 className="display-3">Scan a tomato leaf</h1>
        <p className="mt-1.5 text-muted">Choose a field, add a photo, and run the classifier.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Step n={1} title="Choose field" done={!!fieldId}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <FormField label="Field" htmlFor="field" className="flex-1">
                <Select id="field" value={fieldId} onChange={(e) => setFieldId(e.target.value)}>
                  <option value="">No field</option>
                  {db.fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                      {f.latitude == null ? " (no location)" : ""}
                    </option>
                  ))}
                </Select>
              </FormField>
              <Button href="/fields/new?return=/scan" variant="ghost" className="sm:mb-0.5">
                <Plus className="h-4 w-4" /> Add a field
              </Button>
            </div>
            {/* Live weather at the scan location: field pin, else the phone's GPS */}
            {/* Phones: button drops under the text (2nd column); sm+: it sits on the right */}
            <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-3 rounded-2xl bg-sunken px-4 py-3.5 text-[15px] sm:grid-cols-[auto_minmax(0,1fr)_auto]">
              <CloudSun className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="font-medium">Live weather</p>
                {fieldHasPin ? (
                  <p className="text-muted">Humidity and rainfall at {selected!.name} will be saved with this scan and used for the spread forecast.</p>
                ) : geo.state === "ok" ? (
                  <p className="text-muted">
                    <MapPin className="mr-1 inline h-3.5 w-3.5 -translate-y-px" />
                    Using your current location ({geo.coords!.lat.toFixed(3)}, {geo.coords!.lon.toFixed(3)}).
                  </p>
                ) : geo.state === "denied" || geo.state === "unavailable" ? (
                  <p className="text-muted">
                    {geo.state === "denied" ? "Location not shared" : "Location unavailable"}, so this scan will be saved without weather.{" "}
                    {selected ? "Pin this field on the map" : "Pick a mapped field"} to add it.
                  </p>
                ) : (
                  <p className="text-muted">Share your location so humidity and rainfall where you are can be saved with the scan and used for a 7-day spread forecast.</p>
                )}
              </div>
              {!fieldHasPin && geo.state !== "ok" && (
                <Button type="button" variant="outline" size="sm" className="col-start-2 justify-self-start sm:col-start-auto" onClick={locate} disabled={geo.state === "locating"}>
                  {geo.state === "locating" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                  {geo.state === "denied" || geo.state === "unavailable" ? "Try again" : "Use my location"}
                </Button>
              )}
            </div>
          </Step>

          <Step n={2} title="Add a photo" done={!!file}>
            {!preview ? (
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="upload" className="inline-flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Upload
                  </TabsTrigger>
                  <TabsTrigger value="camera" className="inline-flex items-center gap-2">
                    <Camera className="h-4 w-4" /> Camera
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-5">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDrag(false);
                      accept(e.dataTransfer.files?.[0]);
                    }}
                    className={cn(
                      "flex flex-col items-center rounded-card border-2 border-dashed px-6 py-14 text-center transition-colors",
                      drag ? "border-accent bg-accent-tint" : error ? "border-late/50" : "border-line/20 bg-sunken/50"
                    )}
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-surface shadow-sm">
                      <ImageUp className="h-6 w-6 text-accent" />
                    </span>
                    <p className="mt-5 text-lg font-medium">Drop your leaf photo here</p>
                    <p className="mt-1 text-muted">or choose an image from your device</p>
                    <Button className="mt-6" onClick={() => fileRef.current?.click()}>
                      Browse Files
                    </Button>
                    <p className="mt-4 text-sm text-muted">JPG, PNG, WEBP · Max 5 MB</p>
                    <input ref={fileRef} type="file" accept={TYPES.join(",")} className="sr-only" onChange={(e) => accept(e.target.files?.[0])} aria-label="Choose leaf photo" />
                  </div>
                </TabsContent>
                <TabsContent value="camera" className="mt-5">
                  <div className={cn("flex flex-col items-center rounded-card border-2 border-dashed px-6 py-14 text-center", error ? "border-late/50" : "border-line/20 bg-sunken/50")}>
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-surface shadow-sm">
                      <Camera className="h-6 w-6 text-accent" />
                    </span>
                    <p className="mt-5 text-lg font-medium">Use your phone or laptop camera</p>
                    <p className="mt-1 max-w-sm text-muted">On a phone this opens the rear camera. On a laptop your browser may ask you to pick a file instead.</p>
                    <Button className="mt-6" onClick={() => camRef.current?.click()}>
                      <Camera className="h-4 w-4" /> Capture
                    </Button>
                    <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => accept(e.target.files?.[0])} aria-label="Capture leaf photo" />
                  </div>
                </TabsContent>
                {error && (
                  <p className="field-error" role="alert">
                    {error}
                  </p>
                )}
              </Tabs>
            ) : (
              /* 3 · Preview */
              <div className="grid gap-6 sm:grid-cols-[240px_1fr]">
                <div className="relative aspect-square overflow-hidden rounded-card bg-sunken">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Selected leaf" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <p className="font-medium">{file?.name}</p>
                  <p className="text-sm text-muted">{((file?.size ?? 0) / 1048576).toFixed(2)} MB · will be resized to 1024 px</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clear();
                        setTimeout(() => (tab === "camera" ? camRef : fileRef).current?.click(), 50);
                      }}
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Retake
                    </Button>
                    <Button variant="danger-outline" size="sm" onClick={clear}>
                      <Trash2 className="h-3.5 w-3.5" /> Remove Photo
                    </Button>
                  </div>
                  <FormField label="Notes" optional htmlFor="notes" className="mt-5">
                    <Textarea id="notes" rows={3} className="min-h-[96px]" placeholder="Add observations or symptoms" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </FormField>
                </div>
                {/* hidden inputs stay mounted so Retake can reopen them */}
                <input ref={fileRef} type="file" accept={TYPES.join(",")} className="sr-only" onChange={(e) => accept(e.target.files?.[0])} tabIndex={-1} aria-hidden />
                <input ref={camRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => accept(e.target.files?.[0])} tabIndex={-1} aria-hidden />
              </div>
            )}
          </Step>

          <Button variant="accent" size="lg" className="w-full" disabled={!file || !!stage} onClick={analyse}>
            Analyse Leaf
          </Button>
          <p className="flex items-start gap-2 text-sm text-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            {supabaseEnabled
              ? "The first scan after a quiet period can take up to a minute while the model service wakes up."
              : "Demo mode: results come from a simple colour heuristic in your browser, not the model. Add Supabase keys to use the real model."}
          </p>
        </div>

        {/* 4 · Tips */}
        <aside className="space-y-4">
          <div className="card p-6">
            <h2 className="font-medium">Photo tips</h2>
            <ul className="mt-4 space-y-4">
              {TIPS.map(([t, d]) => (
                <li key={t} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium">{t}</p>
                    <p className="text-sm text-muted">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card bg-sunken p-6 text-sm">
            <p className="font-medium">Not sure what you&apos;re looking at?</p>
            <Link href="/diseases" className="mt-1 inline-block text-accent hover:underline">
              Compare symptoms in the Disease Library
            </Link>
          </div>
        </aside>
      </div>

      {stage && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-page/95 backdrop-blur" role="status" aria-live="polite">
          <div className="text-center">
            <div className="relative mx-auto h-48 w-40 overflow-hidden rounded-card bg-sunken">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <LeafArt className="h-full" />
              )}
              <div className="absolute inset-x-0 h-[2px] animate-scan bg-accent shadow-[0_0_20px_4px_rgb(var(--accent)/.6)]" />
            </div>
            <p className="mt-6 text-xl font-medium">{stage}</p>
            <p className="mt-1 text-muted">This usually takes a few seconds.</p>
          </div>
        </div>
      )}
    </>
  );
}

export default function ScanPage() {
  return (
    <Suspense>
      <ScanForm />
    </Suspense>
  );
}
