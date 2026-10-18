"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, FormField, Input, PasswordInput } from "@/components/ui/field";
import { AuthHeading, Divider, GoogleButton } from "@/components/auth-bits";
import { useAuth } from "@/lib/auth";
import { safeRedirect } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, mode } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const err = params.get("error");
    if (err) toast.error(err);
  }, [params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address.";
    if (!password) errs.password = "Enter your password.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await signIn({ email, password, remember });
      router.push(safeRedirect(params.get("redirect")));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid email or password");
      setBusy(false);
    }
  }

  return (
    <>
      <AuthHeading title="Welcome back" body="Log in to review your scans, monitor your fields, and check risk." />
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} />
        </FormField>
        <FormField label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!errors.password} />
        </FormField>
        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <Link href="/forgot-password" className="text-[15px] font-medium text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Log in
        </Button>
      </form>
      <Divider />
      <GoogleButton />
      <p className="mt-5 text-center text-[15px] text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
      {mode === "demo" && (
        <p className="mt-6 flex gap-2 rounded-xl bg-info-soft p-3 text-sm text-info">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Demo mode: any email and password work. Use an email containing “admin” or “expert” to see those roles.</span>
        </p>
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
