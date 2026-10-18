"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";
import { AuthHeading } from "@/components/auth-bits";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    setError("");
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send the link");
    } finally {
      setBusy(false);
    }
  }

  const back = (
    <Link href="/login" className="mt-8 inline-flex items-center gap-1.5 text-[15px] font-medium text-accent hover:underline">
      <ArrowLeft className="h-4 w-4" /> Back to login
    </Link>
  );

  if (sent)
    return (
      <div>
        <span className="grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent">
          <Inbox className="h-7 w-7" />
        </span>
        <h1 className="display-3 mt-6">Check your inbox</h1>
        {/* Neutral wording: don't reveal whether an account exists. */}
        <p className="mt-3 text-muted">If an account exists for {email}, you&apos;ll receive a link to reset your password in a few minutes.</p>
        <div>{back}</div>
      </div>
    );

  return (
    <>
      <AuthHeading title="Reset your password" body="Enter your account email and we'll send reset instructions." />
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField label="Email" htmlFor="email" error={error}>
          <Input id="email" type="email" autoComplete="email" placeholder="Enter your account email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!error} />
        </FormField>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Send Reset Link
        </Button>
      </form>
      {back}
    </>
  );
}
