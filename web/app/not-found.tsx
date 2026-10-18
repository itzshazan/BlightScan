"use client";
import { Logo } from "@/components/layout/logo";
import { LeafArt } from "@/components/art/leaf-art";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function NotFound() {
  const { user } = useAuth();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-16 text-center">
      <Logo />
      <div className="relative mt-14">
        <p className="font-serif text-[9rem] leading-none tracking-[-0.06em] text-ink/10 md:text-[12rem]">404</p>
        <LeafArt variant="late_blight" seed={21} className="absolute left-1/2 top-1/2 h-36 -translate-x-1/2 -translate-y-1/2 rotate-12 md:h-44" />
      </div>
      <h1 className="display-2 mt-8">We couldn&apos;t find that page.</h1>
      <p className="mt-3 max-w-md text-muted">The link may be outdated, or the page may have moved.</p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Button href="/" size="lg">
          Go Home
        </Button>
        <Button href={user ? "/dashboard" : "/login?redirect=%2Fdashboard"} variant="outline" size="lg">
          Go to Dashboard
        </Button>
      </div>
    </main>
  );
}
