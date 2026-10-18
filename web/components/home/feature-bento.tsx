import Image from "next/image";
import { productShots } from "@/lib/photos";
import { cn } from "@/lib/utils";

// Harvest-style bento: no cards or icons. Each tile is a tinted visual holding a real screenshot that
// bleeds off its bottom-right corner, with plain text underneath on the page background.
const TILES: { shot: keyof typeof productShots; title: string; body: string; wide?: boolean; tint: string; offset: string }[] = [
  {
    shot: "diagnose",
    title: "A diagnosis you can check",
    body: "Healthy, early blight or late blight, with the probability of each. Below 60% it asks you to retake the photo.",
    tint: "bg-sunken",
    offset: "left-[7%] top-[9%] w-[118%]",
  },
  {
    shot: "treat",
    title: "Clear next steps",
    body: "Organic and chemical options for the result, plus a prevention checklist for the rest of the field.",
    tint: "bg-accent-tint",
    offset: "left-[7%] top-[12%] w-[190%]",
  },
  {
    shot: "forecast",
    title: "A 7-day spread forecast",
    body: "Hourly temperature, humidity and rain at your field, turned into a daily risk score you can read.",
    tint: "bg-early-soft/60",
    offset: "left-[7%] top-[9%] w-[160%]",
  },
  {
    shot: "map",
    title: "Every field on one map",
    body: "Pin each plot once. The map colours it by its latest forecast, so the field to visit first stands out.",
    wide: true,
    tint: "bg-accent-tint",
    offset: "left-[6%] top-[10%] w-[105%]",
  },
  {
    shot: "history",
    title: "Your whole season in one place",
    body: "Every scan with its photo, result and field. Filter by result or date, and export to CSV.",
    wide: true,
    tint: "bg-sunken",
    offset: "left-[6%] top-[10%] w-[110%]",
  },
];

export function FeatureBento() {
  return (
    <div className="mt-14 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-12">
      {TILES.map((t) => {
        const shot = productShots[t.shot];
        return (
          <article key={t.shot} data-reveal-item className={cn("flex flex-col gap-6", t.wide ? "lg:col-span-6" : "lg:col-span-4")}>
            <div className={cn("relative overflow-hidden rounded-card", t.wide ? "aspect-[16/10]" : "aspect-[4/3]", t.tint)}>
              <Image
                data-parallax
                src={shot.src}
                alt={shot.alt}
                placeholder="blur"
                sizes={t.wide ? "(min-width: 1024px) 640px, 100vw" : "(min-width: 1024px) 600px, 100vw"}
                className={cn("absolute h-auto max-w-none rounded-tl-xl border border-line/10 shadow-[0_12px_32px_rgba(3,28,23,.10)]", t.offset)}
              />
            </div>
            <div>
              <h3 className="text-[1.375rem] font-medium leading-tight tracking-[-0.03em] md:text-[1.625rem]">{t.title}</h3>
              <p className="mt-2 max-w-[46ch] text-muted">{t.body}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
