"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu as MenuIcon, Plus, X } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const PUBLIC_TABS = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/diseases", label: "Disease Library" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
const APP_TABS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/diseases", label: "Disease Library" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function Navbar({ app = false }: { app?: boolean }) {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const authed = ready && !!user;
  const tabs = authed ? APP_TABS : PUBLIC_TABS;

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-page/90 backdrop-blur-md transition-colors",
        scrolled || app ? "border-line/10" : "border-transparent"
      )}
    >
      {/* xl+: three columns so the tabs sit in the true centre; below that there isn't room beside the buttons */}
      <div className={cn("flex h-[72px] items-center gap-8 xl:grid xl:grid-cols-[1fr_auto_1fr]", app ? "px-4 md:px-6" : "container")}>
        <Logo href={authed ? "/dashboard" : "/"} className="xl:justify-self-start" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "relative rounded-full px-3.5 py-2 text-[15px] font-medium text-ink/75 transition-colors hover:text-ink",
                isActive(pathname, t.href) && "text-accent after:absolute after:inset-x-3.5 after:-bottom-[17px] after:h-[2px] after:bg-accent"
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {!ready ? (
            <div className="h-10 w-40" />
          ) : authed ? (
            <UserMenu />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button href="/login" variant="outline">
                Log in
              </Button>
              <Button href="/signup" variant="primary">
                Get Started
              </Button>
            </div>
          )}
          <button
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-deep/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(360px,88vw)] animate-slide-in flex-col bg-page p-5">
            <div className="flex items-center justify-between">
              <Logo href={authed ? "/dashboard" : "/"} />
              <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-8 flex flex-col" aria-label="Mobile">
              {tabs.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={() => setOpen(false)}
                  className={cn("border-b border-line/10 py-4 font-serif text-2xl tracking-[-0.03em]", isActive(pathname, t.href) && "text-accent")}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2">
              {authed ? (
                <Button href="/scan" variant="accent" size="lg" onClick={() => setOpen(false)}>
                  <Plus className="h-4 w-4" /> New Scan
                </Button>
              ) : (
                <>
                  <Button href="/signup" size="lg" onClick={() => setOpen(false)}>
                    Get Started
                  </Button>
                  <Button href="/login" variant="outline" size="lg" onClick={() => setOpen(false)}>
                    Log in
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
