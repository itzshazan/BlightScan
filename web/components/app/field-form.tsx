"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Crosshair, Info, X } from "lucide-react";
import { PinMap } from "@/components/map";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";
import type { FieldInput } from "@/lib/store";
import type { Field } from "@/lib/types";

interface FieldFormProps {
  initial?: Field;
  onSubmit: (data: FieldInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

type Values = { name: string; variety: string; area_acres: string; planting_date: string };

export function FieldForm({ initial, onSubmit, onCancel, submitLabel = "Save Field" }: FieldFormProps) {
  const [v, setV] = useState<Values>({
    name: initial?.name ?? "",
    variety: initial?.variety ?? "",
    area_acres: initial?.area_acres != null ? String(initial.area_acres) : "",
    planting_date: initial?.planting_date ?? "",
  });
  const [pos, setPos] = useState<[number, number] | null>(initial?.latitude != null && initial.longitude != null ? [initial.latitude, initial.longitude] : null);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const set = (k: keyof Values) => (e: ChangeEvent<HTMLInputElement>) => setV((x) => ({ ...x, [k]: e.target.value }));

  const locate = () => {
    if (!navigator.geolocation) return toast.error("Location isn't available in this browser");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos([+p.coords.latitude.toFixed(5), +p.coords.longitude.toFixed(5)]);
        setLocating(false);
      },
      () => {
        toast.error("Couldn't get your location", { description: "Allow location access, or click the map instead." });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!v.name.trim()) errs.name = "Give the field a name.";
    const area = Number(v.area_acres);
    if (!v.area_acres || !(area > 0)) errs.area_acres = "Enter the area in acres, e.g. 2.5.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await onSubmit({
        name: v.name.trim(),
        variety: v.variety.trim(),
        area_acres: Math.round(area * 100) / 100,
        planting_date: v.planting_date || null,
        latitude: pos?.[0] ?? null,
        longitude: pos?.[1] ?? null,
      });
    } catch {
      toast.error("Couldn't save the field");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-6 p-6 md:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Field name *" htmlFor="name" error={errors.name}>
          <Input id="name" placeholder="e.g. North Field" value={v.name} onChange={set("name")} invalid={!!errors.name} />
        </FormField>
        <FormField label="Crop" htmlFor="crop" hint="Tomato is the only supported crop.">
          <Input id="crop" value="Tomato" disabled />
        </FormField>
        <FormField label="Variety" optional htmlFor="variety">
          <Input id="variety" placeholder="Enter tomato variety" value={v.variety} onChange={set("variety")} />
        </FormField>
        <FormField label="Area in acres *" htmlFor="area" error={errors.area_acres}>
          <Input id="area" type="number" inputMode="decimal" min="0" step="0.1" placeholder="Enter field area" value={v.area_acres} onChange={set("area_acres")} invalid={!!errors.area_acres} />
        </FormField>
        <FormField label="Planting date" optional htmlFor="planting">
          <Input id="planting" type="date" value={v.planting_date ?? ""} max={new Date().toISOString().slice(0, 10)} onChange={set("planting_date")} />
        </FormField>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="field-label mb-0">Location</p>
            <p className="text-sm text-muted">Click the map to drop a pin on your field.</p>
          </div>
          <div className="flex gap-2">
            {pos && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setPos(null)}>
                <X className="h-3.5 w-3.5" /> Clear pin
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" loading={locating} onClick={locate}>
              {!locating && <Crosshair className="h-3.5 w-3.5" />} Use My Location
            </Button>
          </div>
        </div>
        <div className="h-80 overflow-hidden rounded-card border border-line/10">
          <PinMap value={pos} onChange={setPos} className="h-80" />
        </div>
        <p className="mt-2 text-sm text-muted">{pos ? `Latitude ${pos[0]} · Longitude ${pos[1]}` : "No location set"}</p>
        {!pos && (
          <p className="mt-2 flex items-start gap-2 rounded-xl bg-info-soft p-3 text-sm text-info">
            <Info className="mt-0.5 h-4 w-4 shrink-0" /> You can skip the location, but spread forecasts need coordinates to fetch weather.
          </p>
        )}
      </div>

      <div className="flex justify-between gap-3 border-t border-line/10 pt-6">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="accent" loading={busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
