import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Droplets, Thermometer, CloudRain } from "lucide-react";
import Image from "next/image";
import { LeafArt } from "@/components/art/leaf-art";
import { classPhoto, galleryPhotos } from "@/lib/photos";
import { ScanCTA } from "@/components/auth-cta";
import { Button } from "@/components/ui/button";
import { Crumbs } from "@/components/ui/misc";
import { TreatmentTabs } from "@/components/scan/treatment-tabs";
import { diseases, getDisease, sources } from "@/lib/diseases";
import { site } from "@/lib/site";
import { ArticleFooter, PreventionChecklist } from "./article-parts";

export function generateStaticParams() {
  return diseases.map((d) => ({ slug: d.slug }));
}

type Params = { params: { slug: string } };

export function generateMetadata({ params }: Params) {
  const d = getDisease(params.slug);
  return d ? { title: d.name, description: d.deck } : {};
}

const conditionIcons = [Thermometer, Droplets, CloudRain];

export default function DiseaseDetail({ params }: Params) {
  const d = getDisease(params.slug);
  if (!d) notFound();
  const related = getDisease(d.related)!;
  const [main, second, third] = galleryPhotos[d.slug]; // static content: every disease names an existing related slug
  const toc = [
    ["pathogen", "Pathogen"],
    ["symptoms", "What to look for"],
    ["conditions", "Favourable weather"],
    ["spread", "How it spreads"],
    ["management", "Management options"],
    ["prevention", "Prevention checklist"],
    ["compare", `Compare with ${related.name.toLowerCase()}`],
  ];

  return (
    <>
      {/* Header band: fills the first screen on lg+ so the article never peeks in underneath.
          Text is pinned to the gallery's top and bottom edges. The gallery's width is capped so its
          height (main photo is 4:5) fits the screen: height ≈ width ÷ 1.2. */}
      <section className="bg-sunken">
        <div className="container flex flex-col justify-center py-10 md:py-14 lg:min-h-[calc(100svh-72px)]">
          <Crumbs items={[{ label: "Disease Library", href: "/diseases" }, { label: d.name }]} />
          <header className="mt-4 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div className="flex flex-col lg:justify-between">
              <div>
                <h1 className="display-1">{d.name}</h1>
                <p className="lead mt-4 max-w-[40ch]">{d.deck}</p>
              </div>
              <div className="mt-8 flex items-center gap-3 border-t border-line/15 pt-5 text-sm lg:mt-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-accent">
                  <LeafArt variant="healthy" className="h-6" />
                </span>
                <div>
                  <p>
                    Written by the <span className="font-medium">BlightScan project team</span>, checked against{" "}
                    <a href="#sources" className="font-medium text-accent hover:underline">
                      extension sources
                    </a>
                  </p>
                  <p className="text-muted">Updated on {site.legalUpdated}</p>
                </div>
              </div>
            </div>
            {/* Image gallery */}
            <div className="grid w-full grid-cols-[2fr_1fr] grid-rows-2 gap-3 lg:ml-auto lg:max-w-[calc((100svh-15rem)*1.2)]">
              <figure className="relative row-span-2 aspect-[4/5] overflow-hidden rounded-card bg-surface">
                <Image src={main.src} alt={main.alt} fill priority placeholder="blur" sizes="(min-width: 1024px) 30vw, 66vw" className="object-cover" />
              </figure>
              {[second, third].map((p) => (
                <figure key={p.alt} className="relative overflow-hidden rounded-card bg-surface">
                  <Image src={p.src} alt={p.alt} fill placeholder="blur" sizes="(min-width: 1024px) 15vw, 33vw" className="object-cover" />
                </figure>
              ))}
            </div>
          </header>
        </div>
      </section>

      <article className="pb-24 pt-14 md:pt-20">
        <div className="container">
          <div className="grid gap-14 lg:grid-cols-[1fr_300px]">
            <div className="min-w-0 max-w-[720px] space-y-14 text-[17px] leading-relaxed">
              {/* Jump list (Healthline TOC), inline on small screens */}
              <nav aria-label="On this page" className="rounded-card bg-sunken p-6 lg:hidden">
                <p className="font-medium">On this page</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {toc.map(([id, l]) => (
                    <li key={id}>
                      <a href={`#${id}`} className="text-accent hover:underline">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <section id="pathogen" className="scroll-mt-24">
                <h2 className="rule-h2">Pathogen</h2>
                <p className="mt-5">
                  {d.name} is caused by <i>{d.pathogen}</i>, {d.pathogenType === "Fungus" ? "a fungus" : "an oomycete, or water mould, not a true fungus"}. {d.summary}
                </p>
              </section>

              <section id="symptoms" className="scroll-mt-24">
                <h2 className="rule-h2">What to look for</h2>
                <ul className="mt-5 space-y-3">
                  {d.symptoms.map((s) => (
                    <li key={s} className="flex gap-3">
                      <span className={`mt-2.5 h-2 w-2 shrink-0 rounded-full ${d.label === "early_blight" ? "bg-early" : "bg-late"}`} />
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-[15px]">
                  <span className="font-semibold">Learn:</span>{" "}
                  <Link href="/how-it-works" className="text-accent hover:underline">
                    How BlightScan tells these symptoms apart
                  </Link>
                </p>
              </section>

              <section id="conditions" className="scroll-mt-24">
                <h2 className="rule-h2">Conditions that can favour disease</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {d.conditions.map((c, i) => {
                    const Icon = conditionIcons[i];
                    return (
                      <div key={c.key} className="rounded-2xl border border-line/10 bg-surface p-5">
                        <Icon className="h-5 w-5 text-accent" />
                        <p className="mt-4 text-sm text-muted">{c.key}</p>
                        <p className="mt-0.5 text-xl font-semibold tracking-[-0.02em]">{c.value}</p>
                        <p className="mt-2 text-sm text-muted">{c.note}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-6">{d.favourable_conditions}</p>
              </section>

              <section id="spread" className="scroll-mt-24">
                <h2 className="rule-h2">How it can spread</h2>
                <p className="mt-5">{d.spread_mode}</p>
                <p className="mt-6 text-[15px]">
                  <span className="font-semibold">See:</span>{" "}
                  <Link href="/how-it-works#spread" className="text-accent hover:underline">
                    How the 7-day spread forecast is calculated
                  </Link>
                </p>
              </section>

              <section id="management" className="scroll-mt-24">
                <h2 className="rule-h2">Management options</h2>
                <div className="mt-6">
                  <TreatmentTabs organic={d.treatment_organic} chemical={d.treatment_chemical} />
                </div>
              </section>

              <section id="prevention" className="scroll-mt-24">
                <h2 className="rule-h2">Prevention checklist</h2>
                <PreventionChecklist items={d.prevention} storageKey={`bs-prevent-${d.slug}`} />
              </section>

              <section id="compare" className="scroll-mt-24">
                <h2 className="rule-h2">Compare with {related.name.toLowerCase()}</h2>
                <Link href={`/diseases/${related.slug}`} className="card group mt-6 flex items-center gap-5 p-5 hover:shadow-lg">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-sunken">
                    <Image src={classPhoto[related.label].src} alt="" fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="title-card">{related.name}</p>
                    <p className="mt-1 text-[15px] text-muted">{related.shortSymptom}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
                </Link>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href={`/diseases/${related.slug}`} variant="outline">
                    Read {related.name} Guide
                  </Button>
                  <ScanCTA size="md">Scan a Leaf Now</ScanCTA>
                  <Button href="/diseases" variant="ghost">
                    <ArrowLeft className="h-4 w-4" /> Back to Disease Library
                  </Button>
                </div>
              </section>

              <ArticleFooter sources={sources} />
            </div>

            {/* Right rail: sticky jump list + scan card */}
            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-6">
                <nav aria-label="On this page">
                  <p className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">On this page</p>
                  <ul className="mt-4 space-y-1 border-l border-line/15">
                    {toc.map(([id, l]) => (
                      <li key={id}>
                        <a href={`#${id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-[15px] text-muted hover:border-accent hover:text-ink">
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="rounded-card bg-deep p-6 text-deep-ink">
                  <p className="font-serif text-2xl leading-snug tracking-[-0.03em]">Seeing these signs?</p>
                  <p className="mt-2 text-sm text-deep-muted">Photograph one leaf and get a result with a confidence score.</p>
                  <ScanCTA variant="light" size="md" className="mt-5 w-full">
                    Scan a leaf now
                  </ScanCTA>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}
