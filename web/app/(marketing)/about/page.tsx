import { Building2, CloudSun, Cpu, Github, GraduationCap, Mail } from "lucide-react";
import Image from "next/image";
import { authPhoto, classPhoto } from "@/lib/photos";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata = { title: "About" };

// Grouped by layer, so it reads as an architecture rather than a list of logos.
const stack: [string, string, string][] = [
  ["Interface", "Next.js 14, TypeScript, Tailwind CSS", "Pages, forms and the app shell"],
  ["Charts & maps", "Recharts, Leaflet, OpenStreetMap", "Forecast charts and the field risk map"],
  ["Data & accounts", "Supabase", "Postgres with row-level security, file storage, sign-in"],
  ["Model service", "FastAPI, ONNX Runtime", "Runs the classifier and the spread forecast"],
  ["Model", "DINOv2-small, PlantVillage", "Pretrained leaf-disease classifier, int8"],
  ["Weather", "Open-Meteo", "Hourly temperature, humidity and rain"],
  ["Hosting", "Vercel, Hugging Face Spaces", "Website and model service"],
];

export default function AboutPage() {
  return (
    <>
      {/* Text left, the portrait field photo right in its natural shape (it's 2:3, so a wide crop would upscale it).
          Width is capped so the 4:5 frame never runs past the bottom of the screen, as on the home hero. */}
      <section className="pb-20 pt-14 md:pt-20">
        {/* lg+: text column stretches to the photo height; label + headline sit on the photo top edge,
            the paragraph on its bottom edge, so both edges line up. */}
        <div className="container grid gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col lg:justify-between">
            <div>
              <p className="eyebrow">About the project</p>
              <h1 className="display-1 mt-5">Making tomato leaf monitoring easier to understand.</h1>
            </div>
            <p className="lead mt-6 max-w-[42ch] lg:mt-0 lg:max-w-none lg:border-t lg:border-line/15 lg:pt-6">
              BlightScan brings image classification and local weather together so a grower can go from a single leaf photo to a clear next step.
            </p>
          </div>
          <figure className="relative mx-auto w-full max-w-[min(440px,calc((100svh_-_11rem)_*_0.8))] lg:mr-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-sunken">
              <Image src={authPhoto.src} alt={authPhoto.alt} fill priority placeholder="blur" sizes="(min-width: 1024px) 440px, 100vw" className="object-cover object-[50%_70%]" />
            </div>
          </figure>
        </div>
      </section>

      <section className="section bg-sunken">
        <div className="container grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow">The problem</p>
            <h2 className="display-2 mt-4">Blight is easy to miss and quick to spread.</h2>
          </div>
          <div className="space-y-5 text-[17px] leading-relaxed text-muted">
            <p>
              Early and late blight are two of the most damaging diseases of tomato. Their first signs are small, easy to confuse with each other or with nutrient problems, and
              they appear when the grower is busiest.
            </p>
            <p>
              Whether a spot becomes an outbreak depends heavily on the weather over the next few days. Late blight in particular can move through a field within a week in cool,
              wet conditions, so recognising it early and knowing when risk is rising matters as much as the diagnosis itself.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="eyebrow">Our approach</p>
          <h2 className="display-2 mt-4 max-w-2xl">Two models, one simple flow</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <div className="card overflow-hidden">
              <div className="relative h-48 overflow-hidden bg-sunken">
                <Image src={classPhoto.early_blight.src} alt={classPhoto.early_blight.alt} fill placeholder="blur" sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-[50%_60%]" />
                <span className="absolute bottom-4 left-4 rounded-xl bg-surface/95 px-3 py-2 text-sm font-semibold text-early shadow-sm">Early Blight · 91%</span>
              </div>
              <div className="p-8">
                <Cpu className="h-6 w-6 text-accent" />
                <h3 className="title-card mt-5">Leaf classification</h3>
                <p className="mt-2 text-muted">A pretrained image model predicts healthy, early blight or late blight from one photo and reports how confident it is in each class.</p>
              </div>
            </div>
            <div className="card overflow-hidden">
              <div className="flex h-48 items-end justify-center gap-2 bg-sunken px-10 pb-10">
                {[24, 30, 42, 58, 71, 66, 52].map((v, i) => (
                  <span key={i} className={`w-full rounded-t-md ${v >= 65 ? "bg-late" : v >= 35 ? "bg-early" : "bg-healthy"}`} style={{ height: `${v}%` }} />
                ))}
              </div>
              <div className="p-8">
                <CloudSun className="h-6 w-6 text-accent" />
                <h3 className="title-card mt-5">Spread-risk estimation</h3>
                <p className="mt-2 text-muted">For a mapped field, hourly weather and recent scans feed a 7-day risk score that shows when conditions favour spread.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-sunken">
        <div className="container">
          <p className="eyebrow">The team</p>
          <h2 className="display-2 mt-4">Who&apos;s behind BlightScan</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="card p-8">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-accent-soft font-serif text-3xl">SK</span>
              <h3 className="title-card mt-6">{site.student.name}</h3>
              <p className="mt-1 text-muted">{site.student.program}</p>
              <p className="mt-1 text-sm text-muted">Roll no. {site.student.roll}</p>
            </div>
            <div className="card p-8">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-sunken">
                <GraduationCap className="h-8 w-8 text-muted" />
              </span>
              <h3 className="title-card mt-6">{site.guide.name}</h3>
              <p className="mt-1 text-muted">Project guide</p>
              <p className="mt-1 text-sm text-muted">{site.guide.department}</p>
            </div>
            <div className="card p-8">
              <span className="grid h-20 w-20 place-items-center rounded-full bg-sunken">
                <Building2 className="h-8 w-8 text-muted" />
              </span>
              <h3 className="title-card mt-6">{site.university}</h3>
              <p className="mt-1 text-muted">Faridabad, Haryana</p>
              <p className="mt-1 text-sm text-muted">Department of Computer Science &amp; Engineering</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-24">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow">Technology</p>
              <h2 className="display-2 mt-6">How it&apos;s built</h2>
              <p className="mt-5 max-w-[36ch] text-[17px] text-muted">Open, free-tier tools from end to end, so the project can run without paid services.</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button href={site.github} external size="lg">
                  <Github className="h-4 w-4" /> View on GitHub
                </Button>
                <Button href="/contact" variant="outline" size="lg">
                  <Mail className="h-4 w-4" /> Contact the team
                </Button>
              </div>
            </div>
            <dl className="border-b border-line/15">
              {stack.map(([layer, tools, role]) => (
                <div key={layer} className="grid gap-1 border-t border-line/15 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6">
                  <dt className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted sm:pt-1">{layer}</dt>
                  <dd>
                    <p className="text-lg font-medium tracking-[-0.02em]">{tools}</p>
                    <p className="mt-0.5 text-[15px] text-muted">{role}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
