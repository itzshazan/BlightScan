import Link from "next/link";
import { site } from "@/lib/site";
import { ContactForm } from "./contact-form";

export const metadata = { title: "Contact" };

// Two columns, no boxes: who to contact on the left (ruled rows), the form on the right.
const DETAILS: { label: string; value: React.ReactNode; note?: string }[] = [
  {
    label: "Email",
    value: (
      <a href={`mailto:${site.email}`} className="hover:underline">
        {site.email}
      </a>
    ),
  },
  { label: "University", value: site.university, note: site.universityAddress },
  { label: "Response time", value: "Usually within 2–3 working days" },
];

export default function ContactPage() {
  return (
    <section className="pb-24 pt-14 md:pt-20 [@media(max-height:700px)]:pt-10">
      <div className="container grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
        <div>
          <p className="eyebrow">Get in touch</p>
          <h1 className="display-1 mt-5">Contact the team.</h1>
          <p className="lead mt-6 max-w-[40ch]">Have a question, found an issue, or want to discuss the project? Send us a message.</p>

          <dl className="mt-12 border-b border-line/15">
            {DETAILS.map((d) => (
              <div key={d.label} className="grid gap-1 border-t border-line/15 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <dt className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted sm:pt-0.5">{d.label}</dt>
                <dd>
                  <p className="font-medium">{d.value}</p>
                  {d.note && <p className="mt-0.5 text-[15px] text-muted">{d.note}</p>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 max-w-[46ch] text-[15px] text-muted">
            Reporting a wrong diagnosis? Open the scan from{" "}
            <Link href="/history" className="font-medium text-ink underline-offset-4 hover:underline">
              Scan History
            </Link>{" "}
            and use <span className="font-medium text-ink">Request Expert Review</span>. It sends the photo to a reviewer.
          </p>
        </div>

        <div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
