"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPinOff, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { LeafArt } from "@/components/art/leaf-art";
import { RiskBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/dropdown";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/misc";
import { formatDate } from "@/lib/format";
import { deleteField, fieldScans, useDB } from "@/lib/store";
import type { Field, RiskLevel } from "@/lib/types";

const RANK: Record<RiskLevel, number> = { high: 3, medium: 2, low: 1 };
const band: Record<RiskLevel, string> = { low: "from-healthy-soft", medium: "from-early-soft", high: "from-late-soft" };

function Fields() {
  const db = useDB();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("risk");
  const [toDelete, setToDelete] = useState<Field | null>(null);
  const risk = sp.get("risk") ?? "all";

  const cards = useMemo(() => {
    if (!db) return [];
    return db.fields
      .map((f) => {
        const scans = fieldScans(db, f.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
        return { ...f, count: scans.length, last: scans[0]?.created_at ?? null };
      })
      .filter((f) => (risk === "all" || f.current_risk === risk) && f.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : sort === "recent" ? (b.last ?? "").localeCompare(a.last ?? "") : RANK[b.current_risk] - RANK[a.current_risk]));
  }, [db, q, risk, sort]);

  if (!db) return <Skeleton className="h-96 rounded-card" />;

  return (
    <>
      <PageHeader
        title="My Fields"
        description="Organise your tomato plots and monitor their risk."
        actions={
          <Button href="/fields/new" variant="accent">
            <Plus className="h-4 w-4" /> Add Field
          </Button>
        }
      />

      {db.fields.length === 0 ? (
        <EmptyState art={<LeafArt className="h-28" />} title="Add your first field" body="Map a plot to group its scans and get spread forecasts." action="Add Field" href="/fields/new" />
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input aria-label="Search fields" placeholder="Search fields" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
            </div>
            <Select aria-label="Risk" value={risk} onChange={(e) => router.replace(e.target.value === "all" ? pathname : `${pathname}?risk=${e.target.value}`, { scroll: false })}>
              <option value="all">All risk levels</option>
              <option value="high">High risk</option>
              <option value="medium">Medium risk</option>
              <option value="low">Low risk</option>
            </Select>
            <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="risk">Sort: Highest risk</option>
              <option value="recent">Sort: Last scanned</option>
              <option value="name">Sort: Name</option>
            </Select>
          </div>

          {cards.length === 0 ? (
            <div className="card p-10 text-center text-muted">
              No fields match.{" "}
              <button
                className="font-medium text-accent hover:underline"
                onClick={() => {
                  setQ("");
                  router.replace(pathname);
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((f, i) => (
                <div key={f.id} className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                  <Link href={`/fields/${f.id}`} className="absolute inset-0 z-0" aria-label={`Open ${f.name}`} />
                  <div className={`relative grid h-36 place-items-center bg-gradient-to-br ${band[f.current_risk]} to-sunken`}>
                    <LeafArt variant={f.current_risk === "low" ? "healthy" : "early_blight"} seed={i + 3} className="h-28 -rotate-12 opacity-90" />
                    {f.latitude == null && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-medium text-muted">
                        <MapPinOff className="h-3 w-3" /> Location needed
                      </span>
                    )}
                    <div className="absolute right-3 top-3 z-10">
                      <Menu>
                        <MenuTrigger className="grid h-9 w-9 place-items-center rounded-full bg-surface/90 hover:bg-surface" aria-label={`${f.name} options`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </MenuTrigger>
                        <MenuContent>
                          <MenuItem onSelect={() => router.push(`/fields/${f.id}?edit=1`)}>
                            <Pencil className="h-4 w-4" /> Edit
                          </MenuItem>
                          <MenuItem danger onSelect={() => setToDelete(f)}>
                            <Trash2 className="h-4 w-4" /> Delete
                          </MenuItem>
                        </MenuContent>
                      </Menu>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="title-card">{f.name}</h2>
                      <RiskBadge risk={f.current_risk} short />
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      Tomato{f.variety ? ` · ${f.variety}` : ""} · {f.area_acres} acres
                    </p>
                    <div className="mt-auto flex justify-between pt-5 text-sm text-muted">
                      <span>Last scan: {f.last ? formatDate(f.last, { day: "numeric", month: "short" }) : "—"}</span>
                      <span>
                        {f.count} scan{f.count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete ${toDelete?.name}?`}
        description="The field and its forecasts are removed. Its scans stay in your history without a field."
        confirmLabel="Delete Field"
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteField(toDelete.id);
          toast.success("Field deleted");
          setToDelete(null);
        }}
      />
    </>
  );
}

export default function FieldsPage() {
  return (
    <Suspense>
      <Fields />
    </Suspense>
  );
}
