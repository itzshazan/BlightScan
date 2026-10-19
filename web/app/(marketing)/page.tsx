import Link from "next/link";
import { ArrowRight, Camera, ChartLine, MapPinned, ScanLine, Sprout } from "lucide-react";
import { HeroVisual } from "@/components/home/hero-visual";
import { FeatureBento } from "@/components/home/feature-bento";
import Image from "next/image";
import { ScanCTA } from "@/components/auth-cta";
import { Button } from "@/components/ui/button";
import { Faq } from "@/components/ui/accordion";
import { diseases, healthy } from "@/lib/diseases";
import { model } from "@/lib/site";
import { classPhoto } from "@/lib/photos";

const steps = [
  { icon: Camera, title: "Photograph a leaf", body: "Take a clear photo of one tomato leaf with your phone, or upload one you already have." },
  { icon: ScanLine, title: "Get an AI diagnosis", body: "A pretrained model labels it Healthy, Early Blight or Late Blight and shows how confident it is." },
  { icon: ChartLine, title: "Plan next steps", body: "See treatment guidance and a 7-day spread-risk forecast built from your field's weather." },
];

const detect = [
  { ...healthy, href: "/diseases", variant: "healthy", tone: "text-healthy" },
  ...diseases.map((d) => ({ ...d, href: `/diseases/${d.slug}`, variant: d.label, tone: d.label === "early_blight" ? "text-early" : "text-late" })),
];

const faqs = [
  { q: "Is it free?", a: "Yes. BlightScan is a university project and free to use. You only need an account so your scans and fields are saved to you." },
  {
    q: "Which crops does it work for?",
    a: "Tomato only, and three classes: healthy, early blight and late blight. Other problems, such as septoria leaf spot, bacterial spot or nutrient deficiency, are not recognised and may be mislabelled.",
  },
  {
    q: "How accurate is it?",
    a: "The model's author reports 98.7% accuracy on PlantVillage photos of leaves the model never saw during training. Details are on the How It Works page. Lab photos are cleaner than field photos, so expect lower accuracy in the field. Every result shows a confidence score, and low-confidence results are flagged.",
  },
  {
    q: "Do I need internet?",
    a: "Yes. The photo is analysed on our server and the forecast uses live weather data. It works on mobile data: photos are compressed to about 1024 px before upload.",
  },
  {
    q: "Is my data private?",
    a: "Leaf photos are stored in private storage that only you can open. Experts see a scan only if you request a review. Your field's location is used only to fetch its weather. You can delete your account and all data at any time.",
  },
  {
    q: "Can it replace an agronomist?",
    a: "No. BlightScan is a decision-support tool. Before spraying, confirm the diagnosis with your local KVK or agriculture extension officer, especially when the confidence is low.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* 1 · Hero */}
      <section className="relative overflow-hidden">
        <div className="container grid items-center gap-14 pb-20 pt-12 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-28">
          <div>
            <p className="eyebrow">AI-assisted tomato crop monitoring</p>
            <h1 className="display-1 mt-5 max-w-[12ch]">Catch tomato blight before it spreads.</h1>
            <p className="lead mt-6 max-w-[34ch]">
              Snap a photo of one tomato leaf. In seconds you get a diagnosis with a confidence score, clear treatment steps and a 7-day spread forecast for your field.
            </p>
            <div data-intro="text" className="mt-9 flex flex-wrap gap-3">
              <ScanCTA />
              <Button href="#how-it-works" variant="outline" size="lg">
                See How It Works
              </Button>
            </div>
            <ul data-intro="text" className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-muted">
              <li className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-accent" /> Free to use
              </li>
              <li className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-accent" /> Works in your phone browser
              </li>
              <li className="flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-accent" /> Field-level weather forecast
              </li>
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* 2 · How it works (BetterHelp three-step) */}
      <section id="how-it-works" className="section scroll-mt-20 bg-sunken">
        <div className="container">
          <div className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="display-2 mt-4">From leaf photo to clearer next steps</h2>
          </div>
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="card relative flex flex-col p-8">
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-serif text-6xl leading-none tracking-[-0.04em] text-ink/15">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="title-card mt-10">{s.title}</h3>
                <p className="mt-3 text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3 · What we detect (Upwork category cards) */}
      <section className="section">
        <div className="container">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow">What we detect</p>
              <h2 className="display-2 mt-4">Three classes, each with clear signs</h2>
            </div>
            <Link href="/diseases" className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
              Browse the disease library <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {detect.map((d) => (
              <Link key={d.name} href={d.href} className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-xl">
                <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
                  <Image
                    src={classPhoto[d.label].src}
                    alt={classPhoto[d.label].alt}
                    fill
                    placeholder="blur"
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <h3 className={`title-card ${d.tone}`}>{d.name}</h3>
                  {d.pathogen && <p className="mt-1 text-sm italic text-muted">{d.pathogen}</p>}
                  <p className="mt-3 text-muted">{d.shortSymptom}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 font-medium">
                    Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4 · Features (Harvest bento: real screenshots, no cards) */}
      {/* Same background as the section above, so only one gap between them (no top padding here) */}
      <section className="pb-20 md:pb-28">
        <div className="container">
          <h2 className="display-2 mx-auto max-w-3xl text-center">Everything you need to keep an eye on your crop</h2>
          <FeatureBento />
        </div>
      </section>

      {/* 5 · Model at a glance (Greenhouse stat band: oversized numbers on hairlines) */}
      <section className="section bg-deep text-deep-ink">
        <div className="container">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#7bf6d1]">Model at a glance</p>
              <h2 className="display-2 mt-4 max-w-[26ch]">Trained on tens of thousands of labelled leaves.</h2>
            </div>
            <Button href="/how-it-works" variant="light" size="lg" className="shrink-0">
              Read the technology
            </Button>
          </div>
          <ul className="mt-16 grid gap-y-12 sm:grid-cols-3 sm:gap-x-10">
            {[
              { v: model.datasetImages.toLocaleString("en-IN"), l: "Training photos", s: "PlantVillage, 38 crop and disease classes" },
              { v: String(model.classes), l: "Classes reported", s: "Healthy, early blight, late blight" },
              model.metrics.accuracy != null && { v: `${model.metrics.accuracy}%`, l: "Reported accuracy", s: "On leaves the model never saw, by its author" },
              model.avgResponseMs != null && { v: `${(model.avgResponseMs / 1000).toFixed(1)}s`, l: "Average response", s: "Photo to result" },
            ]
              .filter((x): x is { v: string; l: string; s: string } => !!x)
              .map((x) => (
                <li key={x.l} data-reveal-item className="border-t border-deep-ink/25 pt-6">
                  <p data-count={x.v} className="font-serif text-[clamp(3.5rem,2.6rem+2.6vw,5.25rem)] leading-none tracking-[-0.05em] tabular-nums">
                    {x.v}
                  </p>
                  <p className="mt-5 font-medium">{x.l}</p>
                  <p className="mt-1 text-sm text-deep-muted">{x.s}</p>
                </li>
              ))}
          </ul>
        </div>
      </section>

      {/* 6 · FAQ (BetterHelp accordion) */}
      <section className="section">
        <div className="container grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="display-2 mt-4">Frequently asked questions</h2>
            <p className="mt-5 text-muted">
              Something else?{" "}
              <Link href="/contact" className="font-medium text-accent underline-offset-4 hover:underline">
                Ask the team
              </Link>
              .
            </p>
          </div>
          <Faq items={faqs} />
        </div>
      </section>

      {/* 7 · Final CTA (Asana closing statement) */}
      <section className="pb-24">
        <div className="container">
          <div data-reveal="scale" className="relative overflow-hidden rounded-[28px] bg-accent-soft px-6 py-16 text-center md:px-16 md:py-24">
            <h2 className="display-1 relative mx-auto max-w-[14ch]">Protect your tomato crop today.</h2>
            <div className="relative mt-10 flex flex-wrap justify-center gap-3">
              <Button href="/signup" size="lg">
                Create Free Account
              </Button>
              <Button href="/contact" variant="outline" size="lg">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
