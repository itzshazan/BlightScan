"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, PasswordInput } from "@/components/ui/field";
import { AuthHeading } from "@/components/auth-bits";
import { useAuth } from "@/lib/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (password.length < 8) errs.password = "Use at least 8 characters.";
    if (confirm !== password) errs.confirm = "Passwords don't match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      // Needs the recovery session set by /auth/callback from the email link.
      await updatePassword(password);
      await logout();
      toast.success("Password updated", { description: "Log in with your new password." });
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update your password", { description: "The link may have expired. Request a new one." });
      setBusy(false);
    }
  }

  return (
    <>
      <AuthHeading title="Choose a new password" body="Enter your new password below." />
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField label="New password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
          <PasswordInput id="password" autoComplete="new-password" placeholder="Enter a new password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!errors.password} />
        </FormField>
        <FormField label="Confirm password" htmlFor="confirm" error={errors.confirm}>
          <PasswordInput id="confirm" autoComplete="new-password" placeholder="Confirm your new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={!!errors.confirm} />
        </FormField>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Update Password
        </Button>
      </form>
      <p className="mt-8 text-[15px] text-muted">
        Invalid or expired link?{" "}
        <Link href="/forgot-password" className="font-medium text-accent hover:underline">
          Request a New Link
        </Link>
      </p>
    </>
  );
}
