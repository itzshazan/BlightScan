"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Disease } from "@/lib/diseases";
import { classPhoto } from "@/lib/photos";

const CHIPS = ["ringed spots", "yellow halo", "water-soaked", "white growth", "lower leaves", "stem lesions"];

export function LibrarySearch({ diseases }: { diseases: Disease[] }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return diseases;
    return diseases.filter((d) =>
      [d.name, d.pathogen, d.summary, d.shortSymptom, ...d.symptoms, d.favourable_conditions].join(" ").toLowerCase().includes(term)
    );
  }, [q, diseases]);

  return (
    <>
      {/* Upwork-style search: large pill input with solid button and suggestion chips */}
      <form className="mt-10 flex max-w-2xl items-center gap-2 rounded-pill border border-line/20 bg-surface p-1.5 pl-5 shadow-sm focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15" onSubmit={(e) => e.preventDefault()} role="search">
        <Search className="h-5 w-5 shrink-0 text-muted" />
        <label htmlFor="disease-search" className="sr-only">
          Search diseases or symptoms
        </label>
        <input
          id="disease-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search diseases or symptoms"
          className="h-11 min-w-0 flex-1 bg-transparent text-[17px] placeholder:text-muted/70 focus:outline-none"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} className="inline-flex h-11 items-center gap-1 rounded-pill px-4 text-[15px] font-medium text-muted hover:bg-ink/5">
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="py-1.5 text-sm text-muted">Try:</span>
        {CHIPS.map((c) => (
          <button key={c} onClick={() => setQ(c)} className="rounded-full border border-line/15 bg-surface px-3 py-1.5 text-sm hover:border-accent hover:text-accent">
            {c}
          </button>
        ))}
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {results.map((d) => (
          <Link key={d.slug} href={`/diseases/${d.slug}`} className="card group grid overflow-hidden transition-shadow hover:shadow-xl sm:grid-cols-[220px_1fr]">
            <div className="relative min-h-[220px] overflow-hidden bg-sunken">
              <Image
                src={classPhoto[d.label].src}
                alt={classPhoto[d.label].alt}
                fill
                placeholder="blur"
                sizes="(min-width: 640px) 220px, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex flex-col p-7">
              <div className="flex items-center justify-between gap-3">
                <h2 className="title-card">{d.name}</h2>
                <Badge dot tone={d.severity === "High" ? "bg-late-soft text-late" : "bg-early-soft text-early"}>
                  {d.severity} severity
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted">
                Pathogen: <i>{d.pathogen}</i>
              </p>
              <p className="mt-4 text-muted">{d.shortSymptom}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-6 font-medium text-accent">
                Read {d.name} Guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
      {results.length === 0 && (
        <div className="card mt-6 p-10 text-center">
          <p className="title-card">No matches for “{q}”</p>
          <p className="mt-2 text-muted">BlightScan covers early and late blight. Try a symptom such as “ringed spots”.</p>
          <button onClick={() => setQ("")} className="mt-5 font-medium text-accent hover:underline">
            Clear search
          </button>
        </div>
      )}
    </>
  );
}
