"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
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

type Tab = (typeof PUBLIC_TABS)[number];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function Navbar({ app = false }: { app?: boolean }) {
  const pathname = usePathname();
  const { user, ready } = useAuth();
  const [open, setOpen] = useState(false);
  const authed = ready && !!user;
  const tabs = authed ? APP_TABS : PUBLIC_TABS;

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const menu = open && <MobileMenu tabs={tabs} pathname={pathname} authed={authed} onClose={() => setOpen(false)} />;
  return app ? (
    <AppBar tabs={tabs} pathname={pathname} authed={authed} ready={ready} onMenu={() => setOpen(true)} open={open} menu={menu} />
  ) : (
    <PillBar tabs={tabs} pathname={pathname} authed={authed} ready={ready} onMenu={() => setOpen(true)} open={open} menu={menu} />
  );
}

interface BarProps {
  tabs: Tab[];
  pathname: string;
  authed: boolean;
  ready: boolean;
  open: boolean;
  onMenu: () => void;
  menu: React.ReactNode;
}

/** Signed-in app: full-width bar above the sidebar. */
function AppBar({ tabs, pathname, authed, ready, open, onMenu, menu }: BarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/10 bg-page/90 backdrop-blur-md">
      {/* xl+: three columns so the tabs sit in the true centre; below that there isn't room beside the buttons */}
      <div className="flex h-[72px] items-center gap-8 px-4 md:px-6 xl:grid xl:grid-cols-[1fr_auto_1fr]">
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
          {!ready ? <div className="h-10 w-10" /> : authed ? <UserMenu /> : null}
          <MenuButton open={open} onClick={onMenu} className="hover:bg-ink/5" />
        </div>
      </div>
      {menu}
    </header>
  );
}

/**
 * Public pages: a floating pill that takes the colour of the section scrolled beneath it, switching its
 * text and buttons to light or dark so they stay readable.
 */
function PillBar({ tabs, pathname, authed, ready, open, onMenu, menu }: BarProps) {
  const pill = useRef<HTMLDivElement>(null);
  const bg = useColourBehind(pill, pathname);
  const dark = bg?.dark ?? false;

  return (
    // The header only reserves the pill's space; pointer events pass through its transparent margins.
    // Same .container as the page sections, so the pill's edges line up with the content below.
    <header className="pointer-events-none sticky top-0 z-40 pt-3">
      <div className="container">
        <div
          ref={pill}
          data-tone={dark ? "dark" : "light"}
          style={bg ? { backgroundColor: `rgb(${bg.rgb.join(" ")} / 0.82)` } : undefined}
          className={cn(
            "pointer-events-auto flex h-16 w-full items-center gap-4 rounded-full pl-5 pr-2.5 backdrop-blur-xl",
            "transition-[background-color,color,box-shadow] duration-500 ease-out",
            bg ? "" : "bg-page/80",
            dark
              ? "text-deep-ink shadow-[0_10px_30px_-12px_rgba(0,0,0,.55)] ring-1 ring-white/15"
              : "text-ink shadow-[0_10px_30px_-14px_rgba(3,28,23,.28)] ring-1 ring-ink/[0.07]"
          )}
        >
          <Logo href={authed ? "/dashboard" : "/"} className="shrink-0" />
  
          <nav className="mx-auto hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {tabs.map((t) => {
              const active = isActive(pathname, t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors xl:px-4",
                    dark
                      ? active
                        ? "bg-white/15 text-white"
                        : "text-deep-ink/75 hover:bg-white/10 hover:text-white"
                      : active
                        ? "bg-ink/[0.07] text-ink"
                        : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
  
          <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0">
            <ThemeToggle className={dark ? "text-deep-ink hover:bg-white/10" : undefined} />
            {!ready ? (
              <div className="h-11 w-11" />
            ) : authed ? (
              <UserMenu />
            ) : (
              <div className="hidden items-center gap-1.5 sm:flex">
                <Button href="/login" variant={dark ? "light-outline" : "outline"} className="lg:max-xl:hidden">
                  Log in
                </Button>
                <Button href="/signup" variant={dark ? "light" : "primary"}>
                  Get Started
                </Button>
              </div>
            )}
            <MenuButton open={open} onClick={onMenu} className={dark ? "hover:bg-white/10" : "hover:bg-ink/5"} />
          </div>
        </div>
      </div>
      {menu}
    </header>
  );
}

function MenuButton({ open, onClick, className }: { open: boolean; onClick: () => void; className?: string }) {
  return (
    <button className={cn("grid h-10 w-10 place-items-center rounded-full lg:hidden", className)} onClick={onClick} aria-label="Open menu" aria-expanded={open}>
      <MenuIcon className="h-5 w-5" />
    </button>
  );
}

function MobileMenu({ tabs, pathname, authed, onClose }: { tabs: Tab[]; pathname: string; authed: boolean; onClose: () => void }) {
  // Portalled to <body>: the bar's backdrop-blur makes it the containing block for fixed children,
  // which would shrink this overlay to the bar's height.
  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button className="absolute inset-0 bg-deep/40" aria-label="Close menu" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-[min(360px,88vw)] animate-slide-in flex-col bg-page p-5">
        <div className="flex items-center justify-between">
          <Logo href={authed ? "/dashboard" : "/"} />
          <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-8 flex flex-col" aria-label="Mobile">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              onClick={onClose}
              className={cn("border-b border-line/10 py-4 font-serif text-2xl tracking-[-0.03em]", isActive(pathname, t.href) && "text-accent")}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          {authed ? (
            <Button href="/scan" variant="accent" size="lg" onClick={onClose}>
              <Plus className="h-4 w-4" /> New Scan
            </Button>
          ) : (
            <>
              <Button href="/signup" size="lg" onClick={onClose}>
                Get Started
              </Button>
              <Button href="/login" variant="outline" size="lg" onClick={onClose}>
                Log in
              </Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---- colour of the section under the bar -----------------------------------------------------------

type Rgb = [number, number, number];

function parseColour(c: string): { rgb: Rgb; alpha: number } | null {
  const n = c.match(/[\d.]+/g)?.map(Number);
  if (!n || n.length < 3) return null;
  return { rgb: [n[0], n[1], n[2]], alpha: n.length > 3 ? n[3] : 1 };
}

/**
 * Background of the page section directly under `el`'s centre: the nearest section, footer or body
 * with an opaque background (cards and images inside a section don't count, so the bar doesn't flicker
 * over them). Re-sampled on scroll, resize, route change and theme switch.
 */
function useColourBehind(el: RefObject<HTMLElement>, key: string) {
  const [bg, setBg] = useState<{ rgb: Rgb; dark: boolean } | null>(null);

  useEffect(() => {
    let raf = 0;
    const sample = () => {
      raf = 0;
      const self = el.current;
      if (!self) return;
      const r = self.getBoundingClientRect();
      const header = self.closest("header");
      const under = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).find((e) => !header?.contains(e));
      let found: Rgb | null = null;
      for (let n: Element | null = under ?? document.body; n && !found; n = n.parentElement) {
        if (!n.matches("section, footer, main, body, [data-nav-surface]")) continue;
        const c = parseColour(getComputedStyle(n).backgroundColor);
        if (c && c.alpha >= 0.5) found = c.rgb;
      }
      if (!found) return;
      const [R, G, B] = found;
      const dark = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255 < 0.5;
      setBg((prev) => (prev && prev.rgb.join() === found!.join() ? prev : { rgb: found!, dark }));
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(sample);
    };

    sample();
    const late = setTimeout(queue, 400); // after the new page's content and theme have settled
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    const theme = new MutationObserver(queue); // next-themes switches the class on <html>
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(late);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      theme.disconnect();
    };
  }, [el, key]);

  return bg;
}
