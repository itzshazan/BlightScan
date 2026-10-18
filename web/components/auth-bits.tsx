"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { safeRedirect } from "@/lib/utils";

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}

/** signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' }) once Supabase is wired. */
export function GoogleButton() {
  const router = useRouter();
  const params = useSearchParams();
  const { signInWithGoogle, mode } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full border-line/25"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        const next = safeRedirect(params.get("redirect"));
        try {
          await signInWithGoogle(next); // Supabase mode leaves the page for Google here
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Google sign-in failed");
          setBusy(false);
          return;
        }
        if (mode === "demo") {
          toast.info("Demo mode: signed in without Google");
          router.push(next);
          router.refresh();
        }
      }}
    >
      {!busy && <GoogleIcon />} Continue with Google
    </Button>
  );
}

export function Divider({ children = "or continue with" }) {
  return (
    <div className="my-4 flex items-center gap-4 text-sm text-muted">
      <span className="h-px flex-1 bg-line/15" />
      {children}
      <span className="h-px flex-1 bg-line/15" />
    </div>
  );
}

export function AuthHeading({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-serif text-[2.25rem] font-normal leading-[1.1] tracking-[-0.04em] md:text-[2.5rem]">{title}</h1>
      {body && <p className="mt-2.5 text-[15px] text-muted">{body}</p>}
    </div>
  );
}
