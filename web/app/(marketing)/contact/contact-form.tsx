"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/field";
import { sendContactMessage } from "@/lib/store";
import { cn } from "@/lib/utils";

const SUBJECTS = ["General", "Bug report", "Feedback", "Collaboration"] as const;
const MIN = 20;
const EMPTY = { name: "", email: "", subject: "", message: "" };
type Values = typeof EMPTY;
type Errors = Partial<Record<keyof Values, string>>;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v: Values) {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Please enter your name.";
  if (!EMAIL.test(v.email)) e.email = "Please enter a valid email address.";
  if (!v.subject) e.subject = "Please choose what it's about.";
  if (v.message.trim().length < MIN) e.message = `Please write at least ${MIN} characters.`;
  return e;
}

export function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const update = (k: keyof Values, value: string) => {
    setValues((v) => ({ ...v, [k]: value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const set = (k: keyof Values) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(k, e.target.value);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await sendContactMessage(values);
      setSentTo(values.email);
      setValues(EMPTY);
    } catch {
      toast.error("Couldn't send your message. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const count = values.message.trim().length;

  return (
    <div className="rounded-[28px] bg-sunken p-6 sm:px-9 sm:py-8">
      {sentTo ? (
        <div className="flex min-h-[420px] flex-col items-start justify-center" role="status">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-white">
            <Check className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <h2 className="display-3 mt-6">Message sent.</h2>
          <p className="mt-3 max-w-[40ch] text-[17px] text-muted">
            Thanks for writing. We&apos;ll reply to <span className="font-medium text-ink">{sentTo}</span>, usually within 2–3 working days.
          </p>
          <button onClick={() => setSentTo(null)} className="mt-8 inline-flex items-center gap-1.5 font-medium text-accent hover:underline">
            Send another message <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <fieldset>
            <legend className="field-label">What&apos;s it about?</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-invalid={!!errors.subject || undefined}>
              {SUBJECTS.map((s) => {
                const on = values.subject === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => update("subject", s)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-[15px] font-medium transition-colors",
                      on ? "border-ink bg-ink text-page" : "border-line/20 bg-surface text-ink hover:border-line/50",
                      errors.subject && !on && "border-late/50"
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {errors.subject && <p className="field-error">{errors.subject}</p>}
          </fieldset>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <FormField label="Name" htmlFor="name" error={errors.name}>
              <Input id="name" autoComplete="name" value={values.name} onChange={set("name")} invalid={!!errors.name} placeholder="Your full name" className="h-[52px]" />
            </FormField>
            <FormField label="Email" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" autoComplete="email" value={values.email} onChange={set("email")} invalid={!!errors.email} placeholder="you@example.com" className="h-[52px]" />
            </FormField>
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <label htmlFor="message" className="field-label">
                Message
              </label>
              <span className={cn("text-sm tabular-nums", count >= MIN ? "text-accent" : "text-muted")} aria-live="polite">
                {count >= MIN ? <Check className="inline h-3.5 w-3.5" strokeWidth={3} /> : `${count} / ${MIN}`}
              </span>
            </div>
            <Textarea id="message" rows={4} value={values.message} onChange={set("message")} invalid={!!errors.message} placeholder="Tell us what happened or what you'd like to discuss." />
            {errors.message && <p className="field-error">{errors.message}</p>}
          </div>

          <div className="mt-6 flex flex-col-reverse items-start gap-4 border-t border-line/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[34ch] text-sm text-muted">All fields are required. Your email is only used to reply to you.</p>
            <Button type="submit" variant="accent" size="lg" loading={busy} className="w-full sm:w-auto">
              Send message {!busy && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
