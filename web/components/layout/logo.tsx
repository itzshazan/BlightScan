import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden>
      <rect width="32" height="32" rx="10" fill="rgb(var(--accent))" />
      <path d="M9 23c0-8 5-13.5 14-14-.4 8.6-5.6 14-14 14Z" fill="#fff" />
      <path d="M9.5 22.5 19 13" stroke="rgb(var(--accent))" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="18.6" cy="17.4" r="1.7" fill="rgb(var(--accent))" />
    </svg>
  );
}

export function Logo({ href = "/", className, light }: { href?: string; className?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)} aria-label="BlightScan home">
      <LogoMark />
      <span className={cn("text-[19px] font-semibold tracking-[-0.03em]", light && "text-deep-ink")}>BlightScan</span>
    </Link>
  );
}
