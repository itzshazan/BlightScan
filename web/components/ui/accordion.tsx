"use client";
import * as A from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";

/** BetterHelp-style FAQ: full-width rows, plus icon rotates to a cross. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <A.Root type="single" collapsible className="divide-y divide-line/15 border-y border-line/15">
      {items.map((item, i) => (
        <A.Item key={i} value={String(i)}>
          <A.Header>
            <A.Trigger className="group flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium tracking-[-0.02em] md:text-xl">
              {item.q}
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line/20 transition-transform duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:bg-ink group-data-[state=open]:text-page">
                <Plus className="h-4 w-4" />
              </span>
            </A.Trigger>
          </A.Header>
          <A.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <p className="max-w-3xl pb-6 text-[17px] leading-relaxed text-muted">{item.a}</p>
          </A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
