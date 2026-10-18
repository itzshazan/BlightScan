"use client";
import { Check, FlaskConical, Leaf } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TreatmentTabs({ organic, chemical }: { organic: string[]; chemical: string[] }) {
  const List = ({ items }: { items: string[] }) => (
    <ul className="space-y-3">
      {items.map((t) => (
        <li key={t} className="flex gap-3 text-[16px] leading-relaxed">
          <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
  return (
    <Tabs defaultValue="organic">
      <TabsList>
        <TabsTrigger value="organic" className="inline-flex items-center gap-2">
          <Leaf className="h-4 w-4" /> Organic &amp; Cultural
        </TabsTrigger>
        <TabsTrigger value="chemical" className="inline-flex items-center gap-2">
          <FlaskConical className="h-4 w-4" /> Chemical Options
        </TabsTrigger>
      </TabsList>
      <TabsContent value="organic" className="mt-6">
        <List items={organic} />
      </TabsContent>
      <TabsContent value="chemical" className="mt-6">
        <List items={chemical} />
        <p className="mt-5 rounded-xl bg-early-soft px-4 py-3 text-sm text-early">
          Product names are examples of active ingredients, not recommendations. Check what is registered in your state and follow the label.
        </p>
      </TabsContent>
    </Tabs>
  );
}
