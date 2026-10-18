import Image from "next/image";
import Link from "next/link";
import { diseases } from "@/lib/diseases";
import { classPhoto } from "@/lib/photos";
import { ScanCTA } from "@/components/auth-cta";
import { LibrarySearch } from "./library-search";

export const metadata = { title: "Disease Library" };

const columns = diseases.map((d) => ({ ...d, tone: d.label === "early_blight" ? "text-early" : "text-late" }));

const compare = [
  ["Organism", "Fungus", "Oomycete (water mould)"],
  ["Where it starts", "Oldest, lowest leaves", "Any leaf, often tips and edges"],
  ["Lesions", "Brown spots with target rings and a yellow halo", "Water-soaked patches turning brown-black, no rings"],
  ["Weather", "Warm and wet, 24–29 °C", "Cool and wet, 10–25 °C"],
  ["Speed", "Builds over weeks", "Can take a field in days"],
];

export default function DiseasesPage() {
  return (
    <>
      <section className="pb-20 pt-14 md:pt-20">
        <div className="container">
          <p className="eyebrow">Tomato disease guide</p>
          <h1 className="display-1 mt-5 max-w-[14ch]">Know what to look for.</h1>
          <p className="lead mt-5 max-w-[46ch]">Explore the blight classes BlightScan detects and compare their most common symptoms.</p>
          <LibrarySearch diseases={diseases} />
        </div>
      </section>

      {/* Comparison: large photo per column so the symptoms are visible, hairline rows aligned on the text baseline */}
      <section className="section bg-sunken">
        <div className="container">
          <h2 className="display-2 max-w-2xl">Early blight vs. late blight</h2>
          <div className="mt-12 hidden md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <td className="w-[22%] pb-8 pr-10 align-bottom text-[15px] text-muted">
                    Both start as dark spots on the leaves. Where they start, what the spots look like and how fast they move tell them apart.
                  </td>
                  {columns.map((c) => (
                    <th key={c.slug} scope="col" className="w-[39%] pb-8 pr-8 align-bottom font-normal last:pr-0">
                      <Link href={`/diseases/${c.slug}`} className="group block">
                        <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
                          <Image
                            src={classPhoto[c.label].src}
                            alt={classPhoto[c.label].alt}
                            fill
                            placeholder="blur"
                            sizes="(min-width: 1296px) 440px, 40vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </span>
                        <span className="mt-5 flex items-baseline justify-between gap-4">
                          <span>
                            <span className={`block text-2xl font-medium tracking-[-0.03em] ${c.tone}`}>{c.name}</span>
                            <span className="mt-0.5 block text-[15px] italic text-muted">{c.pathogen}</span>
                          </span>
                          <span className="shrink-0 text-[15px] font-medium text-ink group-hover:underline">Read the guide →</span>
                        </span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="border-b border-line/15">
                {compare.map(([k, early, late]) => (
                  <tr key={k} className="border-t border-line/15 align-baseline">
                    <th scope="row" className="py-5 pr-10 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
                      {k}
                    </th>
                    <td className="py-5 pr-8 text-[17px] leading-relaxed">{early}</td>
                    <td className="py-5 text-[17px] leading-relaxed">{late}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-10 space-y-12 md:hidden">
            <p className="text-[15px] text-muted">Both start as dark spots on the leaves. Where they start, what the spots look like and how fast they move tell them apart.</p>
            {columns.map((c, i) => (
              <div key={c.slug}>
                <Link href={`/diseases/${c.slug}`} className="block">
                  <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
                    <Image src={classPhoto[c.label].src} alt={classPhoto[c.label].alt} fill placeholder="blur" sizes="100vw" className="object-cover" />
                  </span>
                  <span className={`mt-4 block text-2xl font-medium tracking-[-0.03em] ${c.tone}`}>{c.name}</span>
                  <span className="block text-[15px] italic text-muted">{c.pathogen}</span>
                </Link>
                <dl className="mt-4 border-b border-line/15">
                  {compare.map((row) => (
                    <div key={row[0]} className="border-t border-line/15 py-3">
                      <dt className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{row[0]}</dt>
                      <dd className="mt-1 text-[16px]">{row[i + 1]}</dd>
                    </div>
                  ))}
                </dl>
                <Link href={`/diseases/${c.slug}`} className="mt-4 inline-block text-[15px] font-medium hover:underline">
                  Read the {c.name.toLowerCase()} guide →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container flex flex-col items-start justify-between gap-6 rounded-[28px] bg-deep px-8 py-12 text-deep-ink md:flex-row md:items-center md:px-14">
          <h2 className="display-3 max-w-xl">Not sure what the leaf shows?</h2>
          <ScanCTA variant="light">Scan a Leaf</ScanCTA>
        </div>
      </section>
    </>
  );
}
