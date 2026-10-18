import type { ReactNode } from "react";
import { site } from "@/lib/site";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  sections: LegalSection[];
  actions: ReactNode;
}

/** Healthline-like long-form layout with a sticky "On this page" list. */
export function LegalPage({ eyebrow, title, sections, actions }: LegalPageProps) {
  return (
    <section className="pb-24 pt-14 md:pt-20">
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display-1 mt-5">{title}</h1>
        <p className="mt-4 text-muted">Last updated: {site.legalUpdated}</p>

        <div className="mt-14 grid gap-12 lg:grid-cols-[260px_1fr]">
          <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">On this page</p>
            <ol className="mt-4 space-y-1 border-l border-line/15">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-[15px] text-muted hover:border-accent hover:text-ink">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="max-w-[720px] space-y-12 text-[17px] leading-relaxed">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="rule-h2">
                  {i + 1}. {s.title}
                </h2>
                <div className="mt-5 space-y-4 text-ink/85 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">{s.body}</div>
              </section>
            ))}
            <div className="flex flex-wrap gap-3 border-t border-line/10 pt-10">{actions}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
