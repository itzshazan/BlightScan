"use client";
import Link from "next/link";
import { ArrowUp, Github, Linkedin } from "lucide-react";
import { Logo } from "./logo";
import { site } from "@/lib/site";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "New Scan", href: "/scan" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Spread Risk Map", href: "/spread-map" },
      { label: "How It Works", href: "/how-it-works" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Disease Library", href: "/diseases" },
      { label: "Early Blight", href: "/diseases/early-blight" },
      { label: "Late Blight", href: "/diseases/late-blight" },
      { label: "Dataset (PlantVillage)", href: site.datasetUrl, external: true },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function BottomBar({ className = "" }) {
  return (
    <div className={`flex flex-col gap-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p>© 2026 BlightScan · {site.student.program} project, {site.university}</p>
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex items-center gap-1.5 self-start font-medium hover:underline sm:self-auto">
        Back to top <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
}

// Greenhouse-style dark evergreen footer.
export function Footer() {
  return (
    <footer className="bg-deep text-deep-ink">
      <div className="container pt-16 md:pt-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs font-serif text-2xl leading-snug tracking-[-0.03em]">{site.tagline}</p>
            <div className="mt-6 flex gap-2">
              <a href={site.github} target="_blank" rel="noreferrer" aria-label="GitHub repository" className="grid h-10 w-10 place-items-center rounded-full border border-deep-ink/20 hover:bg-deep-ink/10">
                <Github className="h-4 w-4" />
              </a>
              <a href={site.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="grid h-10 w-10 place-items-center rounded-full border border-deep-ink/20 hover:bg-deep-ink/10">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-deep-muted">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noreferrer" className="hover:underline">
                        {l.label} ↗
                      </a>
                    ) : (
                      <Link href={l.href} className="hover:underline">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <BottomBar className="mt-16 border-t border-deep-ink/15 text-deep-muted" />
      </div>
    </footer>
  );
}
