import { ArrowDown, ArrowLeft, ArrowRight, CloudSun, Cpu, Database, ImageUp, Map, MapPin, Scaling } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ScanCTA } from "@/components/auth-cta";
import { evaluation, model } from "@/lib/site";

export const metadata = { title: "How It Works" };

type PipelineNode = { icon: LucideIcon; t: string; s: string };

const row1: PipelineNode[] = [
  { icon: ImageUp, t: "Upload leaf", s: "Phone camera or file, compressed to 1024 px" },
  { icon: Scaling, t: "Preprocess", s: "Fix rotation, resize to 256, centre-crop 224, normalise" },
  { icon: Cpu, t: "Model predict", s: "38 PlantVillage classes narrowed to 3, with confidence and % of leaf affected" },
  { icon: Database, t: "Save prediction", s: "Stored in your private scan history" },
];
const row2: PipelineNode[] = [
  { icon: MapPin, t: "Field coordinates + scan", s: "Disease, severity, recent cases" },
  { icon: CloudSun, t: "Weather data", s: "Open-Meteo hourly, next 7 days" },
  { icon: Map, t: "7-day risk estimate", s: "Daily score 0–100 and risk map" },
];

function Node({ n, accent }: { n: PipelineNode; accent?: boolean }) {
  return (
    <div className={`flex-1 rounded-2xl border p-5 ${accent ? "border-accent/30 bg-accent-tint" : "border-line/10 bg-surface"}`}>
      <n.icon className="h-5 w-5 text-accent" />
      <p className="mt-4 font-semibold">{n.t}</p>
      <p className="mt-1 text-sm text-muted">{n.s}</p>
    </div>
  );
}

const metric = (v: number | null) => (v == null ? "—" : `${v}%`);

export default function HowItWorksPage() {
  const counts = [
    { k: "Late blight", v: model.classCounts.late_blight, c: "bg-late" },
    { k: "Healthy", v: model.classCounts.healthy, c: "bg-healthy" },
    { k: "Early blight", v: model.classCounts.early_blight, c: "bg-early" },
  ];
  const classTotal = counts.reduce((a, c) => a + c.v, 0);
  const metrics: [string, number | null][] = [
    ["Accuracy", model.metrics.accuracy],
    ["Macro F1", model.metrics.f1],
  ];

  return (
    <>
      <section className="pb-16 pt-14 md:pt-20">
        <div className="container grid items-end gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div>
            <p className="eyebrow">The technology</p>
            <h1 className="display-1 mt-5 max-w-[16ch]">From a leaf image to a field-level risk estimate.</h1>
          </div>
          <p className="lead">
            BlightScan works in two stages. A pretrained image model classifies one leaf photo as healthy, early blight or late blight. If the leaf is diseased and the
            scan belongs to a mapped field, a weather-driven model then estimates how likely the disease is to spread there over the next seven days.
          </p>
        </div>
      </section>

      {/* Pipeline diagram */}
      <section className="pb-20">
        <div className="container">
          <div className="rounded-[28px] bg-sunken p-6 md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">Pipeline</p>
            <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-stretch">
              {row1.map((n, i) => (
                <div key={n.t} className="contents">
                  <Node n={n} />
                  {i < row1.length - 1 && (
                    <div className="grid place-items-center text-muted">
                      <ArrowRight className="hidden h-5 w-5 lg:block" />
                      <ArrowDown className="h-5 w-5 lg:hidden" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="my-3 flex justify-end pr-[10%] text-muted">
              <ArrowDown className="h-5 w-5" />
              <span className="ml-2 text-xs">if diseased and field has a location</span>
            </div>
            <div className="flex flex-col-reverse gap-3 lg:flex-row lg:items-stretch">
              {[...row2].reverse().map((n, i) => (
                <div key={n.t} className="contents">
                  <Node n={n} accent={i === 0} />
                  {i < row2.length - 1 && (
                    <div className="grid place-items-center text-muted">
                      <ArrowLeft className="hidden h-5 w-5 lg:block" />
                      <ArrowDown className="h-5 w-5 rotate-180 lg:hidden" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dataset + Model: editorial, hairline rules, no boxes (Greenhouse) */}
      <section className="section border-t border-line/10">
        <div className="container grid gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="eyebrow">Dataset</p>
            <p className="mt-6 font-serif text-[clamp(4rem,3rem+4vw,6.5rem)] leading-none tracking-[-0.05em]">{model.datasetImages.toLocaleString("en-IN")}</p>
            <p className="mt-4 max-w-[38ch] text-[17px] text-muted">
              PlantVillage colour photos of single leaves on plain backgrounds, across {model.modelClasses} crop and disease classes.
            </p>

            <p className="mt-12 text-sm font-medium">The three classes BlightScan reports</p>
            {/* One proportional bar, 2px gaps between segments */}
            <div className="mt-4 flex h-2 gap-[2px] overflow-hidden rounded-full">
              {counts.map((c) => (
                <span key={c.k} className={c.c} style={{ width: `${(c.v / classTotal) * 100}%` }} />
              ))}
            </div>
            <dl className="mt-5 border-b border-line/15">
              {counts.map((c) => (
                <div key={c.k} className="grid grid-cols-[1fr_auto_4rem] items-baseline gap-4 border-t border-line/15 py-3.5 text-[15px]">
                  <dt className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${c.c}`} />
                    {c.k}
                  </dt>
                  <dd className="tabular-nums">{c.v.toLocaleString("en-IN")}</dd>
                  <dd className="text-right tabular-nums text-muted">{Math.round((c.v / classTotal) * 100)}%</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 max-w-[52ch] text-[15px] text-muted">
              <span className="font-medium text-ink">Split {model.split.train}/{model.split.test}, grouped by leaf.</span> PlantVillage has several photos of the same
              leaf, so every photo of a leaf sits on one side of the split. Random splits leak near-duplicates into the test set and inflate accuracy.
            </p>
          </div>

          <div>
            <p className="eyebrow">Model</p>
            <h2 className="display-2 mt-6">Pretrained, not retrained.</h2>
            <p className="mt-5 max-w-[46ch] text-[17px] text-muted">
              BlightScan runs an openly published model and keeps only the tomato classes it needs. When a leaf looks more like another disease, the confidence drops and the
              result says why.
            </p>
            <dl className="mt-10 border-b border-line/15">
              {[
                ["Model", `${model.name} by ${model.author}`],
                ["Architecture", model.architecture],
                ["Runtime", model.runtime],
                ["Input", model.inputSize],
                ["Classes used", "Healthy, Early blight, Late blight (of 38)"],
                [
                  "Severity",
                  "Share of the leaf with lesions, measured from leaf colour as in Dhar et al. (2025): under 25% low, 25–50% moderate, over 50% high. Only shown for one leaf on a plain background.",
                ],
                ["Licence", model.license],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-4 border-t border-line/15 py-3.5 text-[15px]">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Results: copy left, ruled figures right */}
      <section className="section bg-deep text-deep-ink">
        <div className="container grid gap-14 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#7bf6d1]">Performance</p>
            <h2 className="display-2 mt-6">Measured on leaves the model never saw</h2>
            <p className="mt-5 max-w-[46ch] text-[17px] text-deep-muted">
              Reported by the model&apos;s author for the int8 version we run, across all 38 PlantVillage classes. Phone photos of leaves still on the plant will score lower.
            </p>
            <a href={model.url} target="_blank" rel="noreferrer" className="mt-8 inline-block font-medium text-[#7bf6d1] hover:underline">
              Model card and evaluation details ↗
            </a>
          </div>
          <ul className="border-b border-deep-ink/25 lg:mt-2">
            {[
              ...metrics.map(([k, v]) => ({ v: metric(v), l: k, s: k === "Accuracy" ? "Share of test photos labelled correctly" : "Averaged across all 38 classes, so rare classes count" })),
              { v: model.testImages.toLocaleString("en-IN"), l: "Test photos", s: "Every photo of a leaf kept on one side of the split" },
            ].map((x) => (
              <li key={x.l} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-end gap-6 border-t border-deep-ink/25 py-6">
                <p className="font-serif text-[clamp(3rem,2.4rem+2vw,4.5rem)] leading-none tracking-[-0.05em]">{x.v}</p>
                <div className="pb-1">
                  <p className="font-medium">{x.l}</p>
                  <p className="mt-1 text-sm text-deep-muted">{x.s}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Our own evaluation: lab vs field, ruled comparison table */}
      <section className="section">
        <div className="container grid gap-14 lg:grid-cols-[1fr_1.25fr] lg:gap-24">
          <div>
            <p className="eyebrow">Our own test</p>
            <h2 className="display-2 mt-6">Checked on {evaluation.lab.n + evaluation.field.n} photos, lab and field</h2>
            <p className="mt-5 max-w-[46ch] text-[17px] text-muted">
              We ran the model on {evaluation.lab.n} PlantVillage lab photos and {evaluation.field.n} real field photos from PlantDoc, which it never trained on. On lab photos it
              matches the author&apos;s figure. On field photos accuracy drops sharply, so BlightScan warns whenever a photo doesn&apos;t look like a single leaf.
            </p>
            <a href={evaluation.resultsUrl} target="_blank" rel="noreferrer" className="mt-8 inline-block font-medium text-accent hover:underline">
              Full results and confusion matrices ↗
            </a>
          </div>
          <div>
            <table className="w-full border-b border-line/15 text-left text-sm sm:text-[15px]">
              <thead>
                <tr className="text-sm text-muted">
                  <th className="py-3 pr-4 font-medium" />
                  <th className="py-3 pr-4 font-medium">Lab photos</th>
                  <th className="py-3 font-medium">Field photos</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Accuracy", `${evaluation.lab.accuracy}%`, `${evaluation.field.accuracy}%`],
                  ["Macro F1", evaluation.lab.f1.toFixed(3), evaluation.field.f1.toFixed(3)],
                  ["Shown with a “not sure” warning", `${evaluation.lab.warned}%`, `${evaluation.field.warned}%`],
                  ["Accuracy when not warned", `${evaluation.lab.accuracyNotWarned}%`, `${evaluation.field.accuracyNotWarned}%`],
                  ["MobileNetV2 fallback accuracy", `${evaluation.lab.fallbackAccuracy}%`, `${evaluation.field.fallbackAccuracy}%`],
                  ["McNemar test, model vs fallback", `p = ${evaluation.lab.mcnemarP}, not significant`, `p = ${evaluation.field.mcnemarP}, not significant`],
                ].map(([k, lab, field]) => (
                  <tr key={k} className="border-t border-line/15 align-top">
                    <th scope="row" className="py-3.5 pr-4 font-normal text-muted">
                      {k}
                    </th>
                    <td className="py-3.5 pr-4">{lab}</td>
                    <td className="py-3.5">{field}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Spread model: numbered list on hairlines, one 0–100 scale */}
      <section id="spread" className="section scroll-mt-20">
        <div className="container grid gap-14 lg:grid-cols-[1fr_1.25fr] lg:gap-24">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">Spread forecast</p>
            <h2 className="display-2 mt-6">A weather-driven risk score you can explain</h2>
            <p className="mt-5 max-w-[44ch] text-[17px] text-muted">
              Version 1 needs no outbreak history. It counts the hours in each forecast day that suit the detected disease, adds infection pressure from your field, and
              smooths the result so risk builds over consecutive favourable days. Weights and thresholds are tunable starting values.
            </p>
          </div>

          <div>
            <ol className="border-b border-line/15">
              {[
                ["Weather favourability", "0–60", "Hours in the disease's band: late blight 10–25 °C, early blight 24–29 °C, with RH ≥ 90% or rain.", "(hours ÷ 24) × 60"],
                ["Infection pressure", "0–40", "Severity (low 5, moderate 12, high 20), plus 5 for each diseased scan in this field in the last 14 days, up to 20.", null],
                ["Day score", "0–100", "Favourability plus pressure. Late blight is multiplied by 1.2 because it spreads faster.", null],
                ["Cumulative trend", null, "Risk builds over consecutive favourable days.", "0.6 × today + 0.4 × yesterday"],
              ].map(([t, range, body, formula], i) => (
                <li key={t} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-line/15 py-7">
                  <span className="font-serif text-[2rem] leading-none tracking-[-0.04em] text-ink/30">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="text-lg font-medium tracking-[-0.02em]">{t}</p>
                      {range && <p className="text-sm tabular-nums text-muted">{range}</p>}
                    </div>
                    <p className="mt-1.5 text-[15px] text-muted">{body}</p>
                    {formula && <p className="mt-3 inline-block rounded-md bg-sunken px-2 py-1 font-mono text-[13px] tracking-normal">{formula}</p>}
                  </div>
                </li>
              ))}
            </ol>

            {/* Risk scale: one bar split at 35 and 65 */}
            <div className="mt-10">
              <p className="text-sm font-medium">Peak score over the 7 days sets the risk level</p>
              <div className="relative mt-8">
                <div className="flex h-2 gap-[2px] overflow-hidden rounded-full">
                  <span className="w-[35%] bg-healthy" />
                  <span className="w-[30%] bg-early" />
                  <span className="w-[35%] bg-late" />
                </div>
                {[0, 35, 65, 100].map((v) => (
                  <span key={v} className="absolute -top-6 -translate-x-1/2 text-xs tabular-nums text-muted first:translate-x-0 last:-translate-x-full" style={{ left: `${v}%` }}>
                    {v}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-[35fr_30fr_35fr] text-sm">
                <span className="text-healthy">Low</span>
                <span className="text-early">Medium</span>
                <span className="text-late">High</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section className="section bg-sunken">
        <div className="container">
          <p className="eyebrow">Limitations</p>
          <h2 className="display-2 mt-4 max-w-2xl">What to keep in mind</h2>
          <div className="mt-12 grid gap-x-10 md:grid-cols-3">
            {[
              ["Lab vs. field photos", "Training images are single leaves on plain backgrounds. Busy field photos with soil, shadows and several leaves are harder and lower the accuracy."],
              ["Image quality", "Blur, glare, low light and partial leaves reduce confidence. One leaf, filling the frame, in daylight works best."],
              ["Forecast uncertainty", "Weather forecasts get less certain after 3–4 days, and the spread score is a rule-based estimate, not a guarantee."],
            ].map(([t, b]) => (
              <div key={t} className="border-t border-ink/80 pt-5">
                <h3 className="text-lg font-medium tracking-[-0.02em]">{t}</h3>
                <p className="mt-2 text-[15px] text-muted">{b}</p>
              </div>
            ))}
          </div>
          <ScanCTA className="mt-12">Try a Scan</ScanCTA>
        </div>
      </section>
    </>
  );
}
