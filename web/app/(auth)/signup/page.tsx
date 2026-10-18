"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, FormField, Input, PasswordInput } from "@/components/ui/field";
import { AuthHeading, Divider, GoogleButton } from "@/components/auth-bits";
import { useAuth } from "@/lib/auth";

const EMPTY = { name: "", email: "", password: "", confirm: "", agree: false };
type Values = typeof EMPTY;
type Errors = Partial<Record<keyof Values, string>>;

function validate(v: Values) {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "Enter a valid email address.";
  if (v.password.length < 8) e.password = "Use at least 8 characters.";
  if (v.confirm !== v.password) e.confirm = "Passwords don't match.";
  if (!v.agree) e.agree = "You need to agree to the Terms to continue.";
  return e;
}

function SignupForm() {
  const router = useRouter();
  const { signUp, signIn, mode } = useAuth();
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof Values) => (e: ChangeEvent<HTMLInputElement>) => setV((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate(v);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const needsConfirmation = await signUp({ fullName: v.name.trim(), email: v.email, password: v.password });
      if (needsConfirmation) setSent(true);
      else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create your account");
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="h-7 w-7" />
        </span>
        <h1 className="display-3 mt-6">Check your email to confirm</h1>
        <p className="mt-3 text-muted">
          We sent a confirmation link to <span className="font-medium text-ink">{v.email}</span>. Open it to activate your account.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Button href="/login" size="lg">
            Go to log in
          </Button>
          {mode === "demo" && (
            <Button
              variant="ghost"
              onClick={async () => {
                await signIn({ email: v.email, password: v.password, fullName: v.name });
                router.push("/dashboard");
                router.refresh();
              }}
            >
              Skip confirmation (demo mode)
            </Button>
          )}
        </div>
      </div>
    );

  return (
    <>
      <AuthHeading title="Create your account" body="Start recording leaf scans and organising your tomato fields." />
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField label="Full name" htmlFor="name" error={errors.name}>
          <Input id="name" autoComplete="name" placeholder="Enter your full name" value={v.name} onChange={set("name")} invalid={!!errors.name} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={v.email} onChange={set("email")} invalid={!!errors.email} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Password" htmlFor="password" error={errors.password}>
            <PasswordInput id="password" autoComplete="new-password" placeholder="At least 8 characters" value={v.password} onChange={set("password")} invalid={!!errors.password} />
          </FormField>
          <FormField label="Confirm password" htmlFor="confirm" error={errors.confirm}>
            <PasswordInput id="confirm" autoComplete="new-password" placeholder="Re-enter password" value={v.confirm} onChange={set("confirm")} invalid={!!errors.confirm} />
          </FormField>
        </div>
        <FormField error={errors.agree}>
          <Checkbox
            checked={v.agree}
            onChange={set("agree")}
            label={
              <>
                I agree to the{" "}
                <Link href="/terms" className="font-medium text-accent hover:underline">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-accent hover:underline">
                  Privacy Policy
                </Link>
              </>
            }
          />
        </FormField>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Create Account
        </Button>
      </form>
      <Divider />
      <GoogleButton />
      <p className="mt-5 text-center text-[15px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
