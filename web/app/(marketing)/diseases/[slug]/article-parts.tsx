"use client";
import { useEffect, useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, LineTabsList, LineTabsTrigger } from "@/components/ui/tabs";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export function PreventionChecklist({ items, storageKey }: { items: string[]; storageKey: string }) {
  const [done, setDone] = useState<number[]>([]);
  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(storageKey) || "[]"));
    } catch {}
  }, [storageKey]);
  const toggle = (i: number) => {
    const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i];
    setDone(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };
  return (
    <>
      <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {items.map((item, i) => {
          const on = done.includes(i);
          return (
            <li key={item}>
              <button
                onClick={() => toggle(i)}
                aria-pressed={on}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-4 text-left text-[15px] transition-colors",
                  on ? "border-accent/40 bg-accent-tint" : "border-line/10 bg-surface hover:border-line/30"
                )}
              >
                <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border", on ? "border-accent bg-accent text-white" : "border-line/30")}>
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className={cn(on && "text-muted line-through decoration-1")}>{item}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-muted">
        {done.length} of {items.length} done · saved in this browser
      </p>
    </>
  );
}

/** Healthline "How we reviewed this article" block with Sources / History tabs. */
export function ArticleFooter({ sources }: { sources: { title: string; url: string }[] }) {
  return (
    <section id="sources" className="scroll-mt-24 rounded-card border border-line/10 bg-surface p-6 md:p-8">
      <h2 className="text-lg font-semibold">How we wrote this article</h2>
      <Tabs defaultValue="sources" className="mt-5">
        <LineTabsList>
          <LineTabsTrigger value="sources">Sources</LineTabsTrigger>
          <LineTabsTrigger value="history">History</LineTabsTrigger>
        </LineTabsList>
        <TabsContent value="sources" className="pt-5 text-[15px]">
          <p className="text-muted">Guidance is summarised from university extension material. Always follow product labels and local advice.</p>
          <ul className="mt-4 space-y-2.5">
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1.5 text-accent hover:underline">
                  {s.title} <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="history" className="pt-5 text-[15px]">
          <p>
            <span className="font-medium">{site.legalUpdated}</span>
            <span className="text-muted"> · First published by the BlightScan project team.</span>
          </p>
        </TabsContent>
      </Tabs>
    </section>
  );
}
